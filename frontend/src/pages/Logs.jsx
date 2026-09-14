import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

function formatTime(dateInput) {
  return new Date(dateInput).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit'
  });
}

function LogEntry({ log, index }) {
  const [expanded, setExpanded] = useState(false);
  const ok = log.status === 'success' || log.status === 'completed';
  const isErr = log.status === 'error' || log.status === 'failed';

  const statusBg = ok ? 'bg-success-light text-success' : isErr ? 'bg-error-light text-error' : 'bg-primary-light text-primary';
  const statusIcon = ok ? 'check_circle' : isErr ? 'error' : 'info';

  const metaKeys = log.metadata ? Object.keys(log.metadata) : [];
  const hasMeta = metaKeys.length > 0 || log.metadata?.previewUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center shrink-0 pt-4">
        <div className={`w-3 h-3 rounded-full shrink-0 ring-4 ring-background-light dark:ring-background ${ok ? 'bg-success' : isErr ? 'bg-error' : 'bg-primary'}`} />
        <div className="w-px flex-1 mt-2 bg-black/5 dark:bg-white/5" />
      </div>

      <div className="flex-1 pb-4">
        <div 
          onClick={() => hasMeta && setExpanded(e => !e)}
          className={`premium-card p-0 overflow-hidden ${hasMeta ? 'premium-card-hover cursor-pointer' : ''}`}
        >
          <div className="p-4 flex items-start gap-3 md:gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${statusBg}`}>
              <Icon className="text-[20px]">{statusIcon}</Icon>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="badge-neutral text-[10px] px-2 py-0.5">{log.action}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${statusBg}`}>
                  {log.status}
                </span>
                <span className="text-xs text-gray-400 font-medium ml-auto">{formatTime(log.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-900 dark:text-white font-medium">{log.message}</p>
            </div>

            {hasMeta && (
              <div className="shrink-0 flex items-center pt-2">
                <Icon className={`text-[20px] text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>expand_more</Icon>
              </div>
            )}
          </div>

          <AnimatePresence>
            {expanded && hasMeta && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5">
                  {log.metadata?.previewUrl && (
                    <div className="mt-3 mb-2">
                      <a
                        href={log.metadata.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                      >
                        <Icon className="text-[16px]">open_in_new</Icon> View full preview
                      </a>
                    </div>
                  )}
                  {metaKeys.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {metaKeys.filter(k => k !== 'previewUrl').map(key => {
                        const val = String(log.metadata[key]);
                        return (
                          <div key={key} className="bg-white dark:bg-[#1f1f23] rounded-xl p-3 border border-black/5 dark:border-white/5 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{key}</p>
                            <p className="text-xs font-mono text-gray-900 dark:text-gray-300 break-words">{val}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const data = await apiClient('/logs?limit=50'); // Fetch a bit more to allow filtering
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'success') return log.status === 'success' || log.status === 'completed';
    if (filter === 'error') return log.status === 'error' || log.status === 'failed';
    return true;
  });

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-gray-900 dark:text-white">
            Action Logs
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-lg">
            Complete history of system activities and workflow executions.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#111115] p-1.5 rounded-xl border border-black/5 dark:border-white/5 shadow-sm self-start md:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'success', label: 'Success' },
            { id: 'error', label: 'Errors' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.id ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Entries', val: loading ? '—' : logs.length, color: 'bg-primary' },
          { label: 'Successful', val: loading ? '—' : logs.filter(l => l.status === 'success' || l.status === 'completed').length, color: 'bg-success' },
          { label: 'Errors', val: loading ? '—' : logs.filter(l => l.status === 'error' || l.status === 'failed').length, color: 'bg-error' },
        ].map(s => (
          <div key={s.label} className="premium-card p-5 flex items-center gap-4">
            <div className={`w-1.5 h-10 rounded-full ${s.color}`} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-bold font-display">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-4xl">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center shrink-0 pt-4">
                  <div className="w-3 h-3 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="w-px flex-1 mt-2 bg-black/5 dark:bg-white/5" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="animate-pulse bg-black/5 dark:bg-white/5 rounded-2xl h-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="premium-card py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Icon className="text-3xl text-gray-400">history</Icon>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No logs found</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              {logs.length === 0 
                ? 'System logs will appear here once workflows start running.' 
                : 'No logs match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredLogs.map((log, index) => (
              <LogEntry key={log._id} log={log} index={index} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
