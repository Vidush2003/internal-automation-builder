import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../services/socket';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

function formatRelativeTime(dateInput) {
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-black/5 dark:bg-white/5 ${className}`} />;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-[#111115]/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 shadow-premium">
        <p className="font-semibold text-gray-900 dark:text-white mb-2 text-xs">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center justify-between gap-6 text-xs">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{entry.value?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7D');

  useEffect(() => {
    loadData();
    const socket = getSocket();
    const onUpdate = (d) => { if (d.status === 'completed' || d.status === 'failed') loadData(false); };
    socket.on('execution:completed', onUpdate);
    socket.on('execution:failed', onUpdate);
    return () => { socket.off('execution:completed', onUpdate); socket.off('execution:failed', onUpdate); };
  }, [timeRange]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [ad, ld] = await Promise.all([
        apiClient(`/analytics/dashboard?range=${timeRange}`),
        apiClient('/logs?limit=8').catch(() => ({ logs: [] })),
      ]);
      setAnalytics(ad);
      setLogs(ld.logs || []);
      if (showLoading) setError('');
    } catch (err) {
      if (showLoading) setError(err.message || 'Failed to load data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const r = await apiClient('/workflows', { method: 'POST', body: JSON.stringify({ name: `Workflow ${Date.now()}`, description: '' }) });
      navigate(`/editor/${r.workflow._id}`);
    } catch (err) { setError('Failed to create workflow.'); }
  };

  const greet = () => { 
    const h = new Date().getHours(); 
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const m = analytics?.metrics || { totalWorkflows: 0, activeWorkflows: 0, totalExecutions: 0, successRate: 0 };
  const chart = analytics?.chartData || [];

  return (
    <AppLayout>
      {error && (
        <div className="p-4 bg-error-light text-error text-sm rounded-xl flex items-center gap-2 border border-error/20">
          <Icon className="text-[18px]">error</Icon> {error}
        </div>
      )}

      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            {greet()}, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-lg">
            Monitor your automations, execution health, and workflow performance.
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary shrink-0 self-start md:self-auto">
          <Icon className="text-[18px]">add</Icon> New Workflow
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5 mt-4">
        
        {/* Metrics Row */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
          <div className="premium-card p-5 lg:col-span-1">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Total Workflows</p>
            <div className="text-3xl font-bold font-display">{loading ? <Skeleton className="h-9 w-16" /> : m.totalWorkflows}</div>
          </div>
          
          <div className="premium-card p-5 lg:col-span-1 border-l-4 border-l-[#ff4a00]">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Active Workflows</p>
            <div className="text-3xl font-bold font-display">{loading ? <Skeleton className="h-9 w-16" /> : m.activeWorkflows}</div>
          </div>
          
          <div className="premium-card p-5 lg:col-span-1">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Total Executions</p>
            <div className="text-3xl font-bold font-display">{loading ? <Skeleton className="h-9 w-20" /> : m.totalExecutions?.toLocaleString()}</div>
          </div>
          
          <div className="premium-card p-5 lg:col-span-1">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Success Rate</p>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold font-display">{loading ? <Skeleton className="h-9 w-16" /> : `${m.successRate}%`}</div>
              {!loading && (
                <div className={`w-2 h-2 rounded-full ${m.successRate > 90 ? 'bg-success' : m.successRate > 50 ? 'bg-warning' : 'bg-error'}`} />
              )}
            </div>
          </div>

          <div className="premium-card p-5 col-span-2 md:col-span-4 lg:col-span-1">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Avg Exec Time</p>
            <div className="text-3xl font-bold font-display">{loading ? <Skeleton className="h-9 w-16" /> : '1.1s'}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="premium-card p-6 h-full flex flex-col min-h-[300px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-base font-semibold">Workflow Execution Analytics</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total executions over time</p>
              </div>
              
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                {['7D', '30D', '90D'].map(range => (
                  <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${timeRange === range ? 'bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-[250px]">
              {loading ? <Skeleton className="h-full w-full" /> : chart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Icon className="text-4xl opacity-30">analytics</Icon>
                  <p className="text-sm">No execution data for this period.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4a00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff4a00" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-black/5 dark:text-white/5" />
                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,74,0,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="success" name="Successful" stroke="#ff4a00" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" />
                    <Area type="monotone" dataKey="failed" name="Failed" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorFail)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4">
          <div className="premium-card p-6 h-full flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold">Recent Activity</h3>
              <button onClick={() => navigate('/logs')} className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
                View All
              </button>
            </div>
            
            <div className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1">
              {loading ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />) :
               logs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Icon className="text-3xl opacity-30">history</Icon>
                  <p className="text-sm">No recent activity.</p>
                </div>
              ) : logs.slice(0, 5).map((log) => {
                const ok = log.status === 'success' || log.status === 'completed';
                const failed = log.status === 'failed' || log.status === 'error';
                
                return (
                  <div key={log._id} className="group flex gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/5">
                    <div className="flex flex-col items-center gap-1 mt-0.5">
                      {ok ? (
                        <div className="w-6 h-6 rounded-full bg-success-light text-success flex items-center justify-center shrink-0">
                          <Icon className="text-[14px]">check</Icon>
                        </div>
                      ) : failed ? (
                        <div className="w-6 h-6 rounded-full bg-error-light text-error flex items-center justify-center shrink-0">
                          <Icon className="text-[14px]">close</Icon>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-warning-light text-warning flex items-center justify-center shrink-0">
                          <Icon className="text-[14px]">pending</Icon>
                        </div>
                      )}
                      <div className="w-px h-full bg-black/5 dark:bg-white/5 group-last:hidden" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {log.message || 'Workflow executed'}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge-neutral text-[9px] px-1.5 py-0">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Icon className="text-[12px]">schedule</Icon> {formatRelativeTime(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
