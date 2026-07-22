import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await apiClient('/logs');
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Action Logs" subtitle="Historical record of system activities, automated emails, and executed workflows.">
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                <th className="p-4 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Time</th>
                <th className="p-4 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Action</th>
                <th className="p-4 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Status</th>
                <th className="p-4 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Message</th>
                <th className="p-4 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Metadata / Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 font-body text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-on-surface-variant animate-pulse">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-on-surface-variant">
                    No system logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                    <td className="p-4 text-on-surface-variant whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="font-label text-xs uppercase font-bold tracking-wider px-2 py-1 bg-secondary-container text-on-secondary-container rounded-md">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1.5 font-label font-bold text-xs uppercase ${
                        log.status === 'success' ? 'text-primary' : log.status === 'error' ? 'text-error' : 'text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {log.status === 'success' ? 'check_circle' : log.status === 'error' ? 'cancel' : 'info'}
                        </span>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-on-background max-w-md truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="p-4">
                      {log.metadata && log.metadata.previewUrl ? (
                        <a 
                          href={log.metadata.previewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline font-label text-xs font-semibold"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View Email
                        </a>
                      ) : (
                        <span className="text-on-surface-variant text-xs italic">
                          {log.metadata ? Object.keys(log.metadata).join(', ') : 'None'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
