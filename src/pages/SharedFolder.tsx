import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2, Lock } from 'lucide-react';

const SHARE_API_ACCESS = 'https://t5g7mczss8.execute-api.eu-north-1.amazonaws.com/default/SharedLinkAccess';

function SharedFolder() {
  const { sharedId } = useParams<{ sharedId: string }>();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!sharedId || !pin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(SHARE_API_ACCESS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          action: 'verify_pin',
          sharedId,
          pin,
        }),
      });
      const txt = await res.text();
      let data: any = null;
      try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
      if (!res.ok) {
        const msg = (data && data.message) ? data.message : txt || 'Verification failed';
        throw new Error(msg);
      }
      if (!data || data.success === false) {
        throw new Error((data && data.message) || 'Invalid response from server');
      }
      // Expected: { success:true, message, folderName, shareUrl }
      const folderName: string | undefined = data.folderName;
      if (!folderName) {
        throw new Error('Server did not return a folderName');
      }
      // Navigate to existing shared images view, preserve shared id in query
      const encoded = encodeURIComponent(folderName);
      navigate(`/shared-images/${encoded}?sid=${encodeURIComponent(sharedId)}`);
    } catch (e: any) {
      setError(e.message || 'PIN verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md border border-amber-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full mb-6">
            <Lock className="h-10 w-10 text-amber-700" />
          </div>
          <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">Enter PIN to Continue</h2>
          <p className="text-gray-600 text-base leading-relaxed">This shared folder is protected. Enter the PIN provided to you.</p>
        </div>
        <div className="space-y-6">
          <div>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
              placeholder="Enter PIN"
              maxLength={6}
              className="w-full px-6 py-4 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-center text-2xl tracking-[0.3em] font-light text-gray-900 placeholder-amber-400 transition-all"
              autoFocus
            />
            {error && (
              <p className="mt-3 text-sm text-red-600 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 px-6 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={!pin || loading}
              className="flex-1 py-3 px-6 bg-amber-900 text-white rounded-xl hover:bg-amber-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</> : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedFolder;

