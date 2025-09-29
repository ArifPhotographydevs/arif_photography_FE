// pages/share/[token].tsx
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

// Install: npm install jszip
// (we dynamically import jszip only when needed)

type GalleryItem = {
  Key: string;
  Size?: number;
  LastModified?: string | null;
  presignedUrl?: string;
  // convenience fields
  key?: string;         // same as Key
  imageUrl?: string;    // same as presignedUrl
  id?: string;
};

type ShareResponse = {
  success: boolean;
  prefix?: string;
  folders?: string[];
  objects?: GalleryItem[];
  continuationToken?: string | null;
  message?: string;
};

type ShareModalState = {
  isOpen: boolean;
  links: string[];
  serverMessage: string | null;
};

export default function SharePage() {
  const router = useRouter();
  const { token } = router.query as { token?: string };

  // optional query parameters: api (get_share) and shareCreateApi (sharelink-create POST)
  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const qApi = query.get("api") || "";
  const qShareCreateApi = query.get("shareCreateApi") || "";

  const [apiBase, setApiBase] = useState<string>(qApi);
  const [shareCreateApi, setShareCreateApi] = useState<string>(qShareCreateApi);
  const [key, setKey] = useState<string>(query.get("key") || "");
  const [pageSize, setPageSize] = useState<number>(50);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShareResponse | null>(null);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [shareModal, setShareModal] = useState<ShareModalState>({ isOpen: false, links: [], serverMessage: null });
  const [notifications, setNotifications] = useState<{ id: number; text: string; kind?: "info" | "error" }[]>([]);
  const [downloading, setDownloading] = useState(false);

  // Helpers
  const addNotification = (text: string, kind: "info" | "error" = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setNotifications((s) => [...s, { id, text, kind }]);
    // auto remove
    setTimeout(() => setNotifications((s) => s.filter((n) => n.id !== id)), 6000);
  };

  useEffect(() => {
    if (token && apiBase) {
      load(false, null, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, apiBase, key, pageSize]);

  const buildGetShareUrl = (t: string, k?: string, cont?: string | null, page_size?: number) => {
    if (!apiBase) return "";
    const u = new URL(apiBase);
    u.searchParams.set("token", t);
    if (k) u.searchParams.set("key", k);
    if (cont) u.searchParams.set("continuation_token", cont);
    if (page_size) u.searchParams.set("page_size", String(page_size));
    return u.toString();
  };

  async function load(append = false, cont: string | null = null, initial = false) {
    setLoading(true);
    setData((d) => (initial ? null : d));
    setTimeout(() => {}, 0);
    try {
      if (!apiBase) {
        addNotification("get_share API URL missing. Provide it in the input or ?api= query parameter", "error");
        setLoading(false);
        return;
      }
      if (!token) {
        addNotification("Missing token in URL path", "error");
        setLoading(false);
        return;
      }
      const url = buildGetShareUrl(String(token), key || undefined, cont, pageSize);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server returned ${res.status}: ${txt}`);
      }
      const j: ShareResponse = await res.json();
      if (!j.success) {
        throw new Error(j.message || "get_share returned success=false");
      }
      if (append && data && data.objects) {
        setData({ ...j, objects: [...(data.objects || []), ...(j.objects || [])] });
      } else {
        setData(j);
      }
      setContinuationToken((j as any).continuationToken || null);
    } catch (err: any) {
      console.error("Load error", err);
      addNotification("Failed to load: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(keyStr: string) {
    setSelected((s) => ({ ...s, [keyStr]: !s[keyStr] }));
  }

  function selectAllOnPage() {
    const objs = data?.objects || [];
    const newSel: Record<string, boolean> = { ...selected };
    objs.forEach((o) => (newSel[o.Key] = true));
    setSelected(newSel);
  }

  function clearSelection() {
    setSelected({});
  }

  // download helpers
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function downloadSelectedAsZip() {
    const keys = Object.keys(selected).filter((k) => selected[k]);
    if (keys.length === 0) {
      addNotification("No images selected", "error");
      return;
    }
    if (!data) return;
    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const k of keys) {
        const obj = (data.objects || []).find((o) => o.Key === k);
        const url = obj?.presignedUrl;
        if (!url) continue;
        const resp = await fetch(url);
        if (!resp.ok) {
          console.warn("Failed to fetch", k);
          continue;
        }
        const blob = await resp.blob();
        const fname = k.split("/").pop() || k;
        zip.file(fname, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, "selected_images.zip");
      addNotification("ZIP created. Download should start shortly.");
    } catch (err: any) {
      console.error("ZIP error", err);
      addNotification("Failed to create ZIP: " + (err.message || err), "error");
    } finally {
      setDownloading(false);
    }
  }

  async function downloadAllShownAsZip() {
    if (!data?.objects || data.objects.length === 0) {
      addNotification("No files to download", "error");
      return;
    }
    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const obj of data.objects || []) {
        if (!obj.presignedUrl) continue;
        const resp = await fetch(obj.presignedUrl);
        if (!resp.ok) {
          console.warn("Failed to fetch", obj.Key);
          continue;
        }
        const blob = await resp.blob();
        const fname = obj.Key.split("/").pop() || obj.Key;
        zip.file(fname, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, "all_shown_images.zip");
      addNotification("ZIP created. Download should start shortly.");
    } catch (err: any) {
      console.error("ZIP error", err);
      addNotification("Failed to create ZIP: " + (err.message || err), "error");
    } finally {
      setDownloading(false);
    }
  }

  // ---------------------------
  // ----- SHARE (fixed) -------
  // ---------------------------
  // requestShareLinksFromServer: call your sharelink-create POST endpoint to create share tokens/links.
  // We implement it to accept array of keys and return array of share URLs (strings).
  async function requestShareLinksFromServer(keys: string[]): Promise<string[]> {
    if (!shareCreateApi) {
      throw new Error("shareCreateApi URL not configured. Set it in the UI or ?shareCreateApi= query param");
    }
    // Build POST body per your sharelink-create contract: { keys: [ "path1", ... ], expiry_seconds?: N, metadata?: {} }
    const body = { keys, expiry_seconds: 3600 };
    const res = await fetch(shareCreateApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Server returned ${res.status}: ${txt}`);
    }
    const j = await res.json();
    if (!j.success) {
      throw new Error(j.message || "shareCreate failed");
    }
    // j.shares is expected to be an array of { prefix, token, shareUrl, expiry }
    const shares = j.shares || [];
    // Return array of shareUrl strings
    return shares.map((s: any) => s.shareUrl).filter(Boolean);
  }

  // Fixed handleShareSingle implementation
  const handleShareSingle = async (item: GalleryItem) => {
    // Prefer direct presigned URL if available
    const link = item.presignedUrl || item.imageUrl;
    if (link) {
      setShareModal({ isOpen: true, links: [link], serverMessage: null });
      return;
    }

    // Otherwise, ask server for a share URL for that single key
    try {
      // The server function expects the S3 key — use item.Key
      const created = await requestShareLinksFromServer([item.Key || item.key || item.id || ""]);
      if (created && created.length > 0) {
        setShareModal({ isOpen: true, links: created, serverMessage: null });
      } else {
        addNotification("No share link created", "error");
      }
    } catch (err: any) {
      console.error("Share single failed:", err);
      addNotification(`Share failed: ${err?.message || String(err)}`, "error");
      setShareModal({ isOpen: true, links: [], serverMessage: err?.message || String(err) });
    }
  };

  // ---------------------------
  // ----- MARK FAVORITE -------
  // ---------------------------
  // This calls a /mark_favorite endpoint (optional) — implement server-side copy if you want server to create fav copy.
  async function markFavorite(objKey: string) {
    if (!shareCreateApi) {
      addNotification("shareCreateApi / mark_favorite endpoint not configured", "error");
      return;
    }
    try {
      // Build mark_favorite URL: assume same domain as shareCreateApi but path /mark_favorite
      const u = new URL(shareCreateApi);
      // default: replace last path segment with mark_favorite OR append if path ends with get_share
      const basePath = u.pathname.replace(/\\/get_share\\/?$/, "");
      u.pathname = basePath + "/mark_favorite";
      const resp = await fetch(u.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, key: objKey }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Server returned ${resp.status}: ${t}`);
      }
      const j = await resp.json();
      if (!j.success) throw new Error(j.message || "mark_favorite failed");
      addNotification("Marked favorite");
    } catch (err: any) {
      console.error("mark favorite failed", err);
      addNotification("Failed to mark favorite: " + (err.message || String(err)), "error");
    }
  }

  // pagination action
  const loadMore = () => {
    if (!continuationToken) return;
    load(true, continuationToken);
  };

  const objects = data?.objects || [];
  const folders = data?.folders || [];

  const breadcrumbs = useMemo(() => {
    const prefix = data?.prefix ?? key ?? "";
    const parts = prefix.split("/").filter(Boolean);
    const crumbs: { name: string; prefix: string }[] = [];
    let acc = "";
    crumbs.push({ name: "root", prefix: "" });
    parts.forEach((p) => {
      acc += p + "/";
      crumbs.push({ name: p, prefix: acc });
    });
    return crumbs;
  }, [data, key]);

  return (
    <div style={{ maxWidth: 1200, margin: "28px auto", padding: 18, fontFamily: "Inter, system-ui, Arial" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Shared Gallery</h1>
        <div style={{ marginLeft: "auto", color: "#666" }}>Backend: get_share (JSON)</div>
      </header>

      {/* Controls */}
      <div style={{ marginTop: 12, background: "#111827", padding: 12, borderRadius: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="get_share API URL (e.g. https://.../get_share)"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 8, background: "#0b1220", border: "1px solid #222", color: "#fff" }}
          />
          <input
            placeholder="sharelink-create POST API URL (for creating share links)"
            value={shareCreateApi}
            onChange={(e) => setShareCreateApi(e.target.value)}
            style={{ width: 420, padding: 8, borderRadius: 8, background: "#0b1220", border: "1px solid #222", color: "#fff" }}
          />
          <input
            placeholder="optional key (folder/)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={{ width: 300, padding: 8, borderRadius: 8, background: "#0b1220", border: "1px solid #222", color: "#fff" }}
          />
          <button onClick={() => load(false, null)} style={{ padding: "8px 12px", borderRadius: 8 }}>
            Load
          </button>
        </div>
        <div style={{ marginTop: 8, color: "#9aa4b2", fontSize: 13 }}>
          Tip: pass ?api=GET_SHARE_URL&shareCreateApi=SHARE_CREATE_URL in the link or fill inputs above.
        </div>
      </div>

      {/* Notifications */}
      <div style={{ position: "fixed", right: 12, top: 12, zIndex: 9999 }}>
        {notifications.map((n) => (
          <div key={n.id} style={{ marginBottom: 8, background: n.kind === "error" ? "#5f1b1b" : "#153945", color: "#fff", padding: 8, borderRadius: 6 }}>
            {n.text}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#9aa4b2" }}>Showing: <strong>{data?.prefix ?? "(root)"}</strong></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={selectAllOnPage}>Select page</button>
          <button onClick={clearSelection}>Clear</button>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button onClick={downloadSelectedAsZip} disabled={downloading}>{downloading ? "Zipping..." : "Download selected (ZIP)"}</button>
          <button onClick={downloadAllShownAsZip} disabled={downloading}>Download all shown (ZIP)</button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav style={{ marginTop: 8, color: "#9aa4b2" }}>
        {breadcrumbs.map((c) => (
          <button key={c.prefix} onClick={() => { setKey(c.prefix); load(false, null); }} style={{ marginRight: 8 }}>{c.name}</button>
        ))}
      </nav>

      {/* Folders */}
      {folders.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginTop: 12 }}>
          {folders.map((f) => {
            const display = f.startsWith(data?.prefix || "") ? f.slice((data?.prefix || "").length) : f;
            return (
              <div key={f} style={{ background: "#0b1220", padding: 10, borderRadius: 8 }}>
                <button style={{ display: "block", width: "100%", textAlign: "left" }} onClick={() => { setKey(f); load(false, null); }}>
                  <div style={{ fontSize: 36 }}>📁</div>
                  <div style={{ marginTop: 8 }}>{display}</div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Objects grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginTop: 16 }}>
        {objects.map((o) => {
          const name = o.Key.split("/").pop() || o.Key;
          const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(o.Key);
          const sel = !!selected[o.Key];
          return (
            <div key={o.Key} style={{ background: "#0b1220", padding: 8, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={sel} onChange={() => toggleSelect(o.Key)} />
                  <div style={{ fontSize: 14 }}>{name}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleShareSingle(o)} title="Share single">🔗</button>
                  <button onClick={() => markFavorite(o.Key)} title="Favorite">★</button>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                {isImage ? (
                  <a href={o.presignedUrl} target="_blank" rel="noreferrer">
                    <img src={o.presignedUrl} alt={name} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} />
                  </a>
                ) : (
                  <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>📄</div>
                )}
              </div>

              <div style={{ marginTop: 8, color: "#9aa4b2", fontSize: 12 }}>
                {(o.Size !== undefined) ? `${(o.Size / 1024).toFixed(1)} KB` : ""} {o.LastModified ? " · " + new Date(o.LastModified).toLocaleString() : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more button */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8 }}>
        {continuationToken && <button onClick={loadMore}>Load more</button>}
      </div>

      {/* Share modal */}
      {shareModal.isOpen && (
        <div style={{
          position: "fixed", left: 0, right: 0, top: 0, bottom: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000
        }}>
          <div style={{ width: 720, background: "#0b1220", padding: 18, borderRadius: 8 }}>
            <h3>Share Links</h3>
            <div style={{ marginTop: 8 }}>
              {shareModal.serverMessage && <div style={{ color: "#ffb4b4" }}>Server: {shareModal.serverMessage}</div>}
              {shareModal.links.length === 0 && <div>No links generated.</div>}
              <ul>
                {shareModal.links.map((l, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <input style={{ width: "80%" }} readOnly value={l} />
                    <button onClick={() => navigator.clipboard?.writeText(l)}>Copy</button>
                    <a href={l} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>Open</a>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShareModal({ isOpen: false, links: [], serverMessage: null })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
