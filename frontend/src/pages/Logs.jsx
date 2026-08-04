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
      <div className="bg-white dark:bg-[#0d0d14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                <th className="p-4 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Time</th>
                <th className="p-4 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Action</th>
                <th className="p-4 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Status</th>
                <th className="p-4 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Message</th>
                <th className="p-4 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Metadata / Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10 font-body text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 dark:text-gray-500 animate-pulse">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 dark:text-gray-500">
                    No system logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="font-label text-xs uppercase font-bold tracking-wider px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 rounded-md">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1.5 font-label font-bold text-xs uppercase ${
                        log.status === 'success' ? 'text-green-500 dark:text-green-400' : log.status === 'error' ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {log.status === 'success' ? 'check_circle' : log.status === 'error' ? 'cancel' : 'info'}
                        </span>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white max-w-md truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="p-4">
                      {log.metadata && log.metadata.previewUrl ? (
                        <a 
                          href={log.metadata.previewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#ff4a00] hover:underline font-label text-xs font-semibold"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View Email
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs italic">
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
