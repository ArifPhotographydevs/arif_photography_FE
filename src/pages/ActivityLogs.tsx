import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { FileText } from 'lucide-react';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

interface Shoot {
  shoot_id: string;
  has_embeddings: boolean;
  clientName?: string;
  eventDate?: string;
}

interface ActivityLog {
  id: string;
  shoot_id: string;
  timestamp: string;
  action: string;
  details: string;
}

// S3 Configuration (WARNING: Do not hardcode credentials in production)
const s3Client = new S3Client({
  region: 'ap-northeast-1',
  endpoint: 'https://s3.ap-northeast-1.wasabisys.com',
  credentials: {
    accessKeyId: 'SW5I2XCNJAI7GTB7MRIW',
    secretAccessKey: 'eKNEI3erAhnSiBdcK0OltkTHIe2jJYJVhPu1eazJ',
  },
});

const ActivityLogs: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [selectedShoot, setSelectedShoot] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Toast notification helper
  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info', duration: number = 4000) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white animate-fade-in ${
      type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // Ported list_shoot_ids from app.py
  const listShootIds = async (prefix: string = 'projects/gallery/'): Promise<string[]> => {
    const shootsSet = new Set<string>();
    try {
      // Try delimiter-based listing
      const command = new ListObjectsV2Command({
        Bucket: 'arif12',
        Prefix: prefix,
        Delimiter: '/',
      });
      let response = await s3Client.send(command);
      for (const cp of response.CommonPrefixes || []) {
        const key = cp.Prefix;
        if (key && key.startsWith(prefix)) {
          const parts = key.slice(prefix.length).split('/');
          if (parts[0]) {
            shootsSet.add(parts[0]);
          }
        }
      }

      // Fallback to full scan if no results
      if (shootsSet.size === 0) {
        const fullCommand = new ListObjectsV2Command({
          Bucket: 'arif12',
          Prefix: prefix,
        });
        response = await s3Client.send(fullCommand);
        for (const obj of response.Contents || []) {
          const key = obj.Key;
          if (key && key.startsWith(prefix)) {
            const parts = key.slice(prefix.length).split('/');
            if (parts[0]) {
              shootsSet.add(parts[0]);
            }
          }
        }
      }

      return Array.from(shootsSet).sort();
    } catch (err) {
      console.error('S3 listing failed:', err);
      throw err;
    }
  };

  // Check for embeddings.npz
  const hasEmbeddings = async (shootId: string): Promise<boolean> => {
    try {
      const command = new HeadObjectCommand({
        Bucket: 'arif12',
        Key: `projects/gallery/${shootId}/embeddings.npz`,
      });
      await s3Client.send(command);
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound') {
        return false;
      }
      console.error(`Error checking embeddings for ${shootId}:`, err);
      return false;
    }
  };

  // Fetch metadata from AWS API
  const fetchMetadata = async (): Promise<Record<string, { clientName: string; eventDate: string }>> => {
    try {
      const response = await fetch('https://vxxl9b57z2.execute-api.eu-north-1.amazonaws.com/default/Get_Project_Details', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (!data.success || !Array.isArray(data.projects)) {
        throw new Error('Invalid AWS API response');
      }
      return Object.fromEntries(
        data.projects.map((p: any) => [p.projectId, { clientName: p.clientName, eventDate: p.eventDate }])
      );
    } catch (err) {
      console.error('Failed to fetch AWS API metadata:', err);
      return {};
    }
  };

  // Load shoots (mimics /shoots endpoint)
  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const shootIds = await listShootIds();
      if (shootIds.length === 0) {
        console.warn('No shoots found in S3, trying AWS API');
        showToast('No projects found in S3, trying fallback API...', 'info', 3000);
        const awsResponse = await fetch(
          'https://vxxl9b57z2.execute-api.eu-north-1.amazonaws.com/default/Get_Project_Details',
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (!awsResponse.ok) {
          throw new Error(`HTTP error ${await awsResponse.text()}`);
        }
        const awsData = await awsResponse.json();
        if (!awsData.success || !Array.isArray(awsData.projects)) {
          throw new Error('Invalid AWS API response');
        }
        const shoots = await Promise.all(
          awsData.projects.map(async (project: any) => ({
            shoot_id: project.projectId,
            has_embeddings: project.status === 'Accepted' && new Date(project.eventDate) <= new Date(),
            clientName: project.clientName,
            eventDate: project.eventDate,
          }))
        );
        setShoots(shoots);
        setSelectedShoot(shoots[0]?.shoot_id || '');
        showToast(`Loaded ${shoots.length} project(s) from AWS API`, 'success');
        return;
      }

      const metadata = await fetchMetadata();
      const shoots = await Promise.all(
        shootIds.map(async (sid) => ({
          shoot_id: sid,
          has_embeddings: await hasEmbeddings(sid),
          clientName: metadata[sid]?.clientName || 'Unknown Client',
          eventDate: metadata[sid]?.eventDate || 'Unknown Date',
        }))
      );
      setShoots(shoots);
      setSelectedShoot(shoots[0]?.shoot_id || '');
      showToast(`Loaded ${shoots.length} project(s) from S3`, 'success');
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects. Please check your connection or server.');
      showToast(`Failed to load projects: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error', 6000);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch logs for the selected shoot (placeholder)
  const fetchLogs = async (shootId: string) => {
    try {
      showToast(`Fetching logs for ${shootId}...`, 'info');
      setLogs([
        { id: '1', shoot_id: shootId, timestamp: '2025-10-12T17:24:00', action: 'Match', details: 'User uploaded selfie' },
      ]);
    } catch (err) {
      showToast('Failed to fetch logs', 'error');
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedShoot) {
      fetchLogs(selectedShoot);
    }
  }, [selectedShoot]);

  const handleShootChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newShootId = e.target.value;
    setSelectedShoot(newShootId);
    showToast(`Selected project: ${newShootId}`, 'info');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="Activity Logs" sidebarCollapsed={sidebarCollapsed} />
        <main className="pt-16 p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Activity Logs</h2>
            <p className="text-gray-600">View activity logs for photo shoots</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4 flex items-center">
              <FileText className="h-5 w-5 text-[#00BCEB] mr-2" />
              Select Photo Shoot
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Photo Shoot</label>
                <select
                  value={selectedShoot}
                  onChange={handleShootChange}
                  disabled={isLoading || error !== null}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <option value="">Loading projects...</option>
                  ) : error ? (
                    <option value="">Error: {error}</option>
                  ) : shoots.length === 0 ? (
                    <option value="">No projects available</option>
                  ) : (
                    shoots.map((shoot) => (
                      <option key={shoot.shoot_id} value={shoot.shoot_id}>
                        📸 {shoot.clientName} ({shoot.shoot_id}) - {shoot.eventDate} {shoot.has_embeddings ? '' : '(processing...)'}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Logs</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs available for the selected project.</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="border-b border-gray-200 pb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{log.timestamp}</span> - {log.action}
                    </p>
                    <p className="text-sm text-gray-500">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActivityLogs;