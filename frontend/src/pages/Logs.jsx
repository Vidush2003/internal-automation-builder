import { motion } from 'framer-motion';

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
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden w-full"
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-white/5 bg-black/5 dark:bg-white/5">
                <th className="p-4 sm:p-5 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Time</th>
                <th className="p-4 sm:p-5 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Action</th>
                <th className="p-4 sm:p-5 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Status</th>
                <th className="p-4 sm:p-5 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">Message</th>
                <th className="p-4 sm:p-5 font-label text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-white/5 font-body text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 dark:text-gray-500 animate-pulse">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-4xl mb-3 opacity-20">history</span>
                      <p>No system logs recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <motion.tr 
                    key={log._id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-white/50 dark:hover:bg-white/[0.02] transition-colors group cursor-default"
                  >
                    <td className="p-4 sm:p-5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(undefined, { 
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' 
                      })}
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="font-label text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-black/5 dark:bg-white/10 text-gray-700 dark:text-white/70 rounded border border-black/5 dark:border-white/5">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className={`flex items-center gap-1.5 font-label font-bold text-[11px] uppercase tracking-wider ${
                        log.status === 'success' ? 'text-emerald-500 dark:text-emerald-400' : log.status === 'error' ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {log.status === 'success' ? 'check_circle' : log.status === 'error' ? 'error' : 'info'}
                        </span>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-gray-700 dark:text-gray-200 max-w-md truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="p-4 sm:p-5 text-right">
                      {log.metadata && log.metadata.previewUrl ? (
                        <a 
                          href={log.metadata.previewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#ff4a00] hover:text-[#e04200] bg-[#ff4a00]/10 hover:bg-[#ff4a00]/20 px-3 py-1.5 rounded-lg transition-colors font-label text-[11px] uppercase tracking-wider font-bold"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400/50 dark:text-gray-600 font-mono text-[10px] truncate max-w-[120px] inline-block">
                          {log.metadata ? Object.keys(log.metadata).join(', ') : '—'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayout>
  );
}
