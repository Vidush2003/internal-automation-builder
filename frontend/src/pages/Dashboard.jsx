import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { getSocket } from '../services/socket';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* ─── Helpers ─────────────────────────────────── */
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

/* ─── Skeleton ─────────────────────────────────── */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1a1a24] ${className}`} />;
}

/* ─── Stat Card ────────────────────────────────── */
function StatCard({ label, value, icon, primary, footer, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden bg-white dark:bg-[#0d0d14] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6"
    >
      <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-[#ff4a00]/5 pointer-events-none" />
      <div className="flex items-start justify-between mb-6">
        <p className="font-label text-[10px] uppercase tracking-[.18em] font-bold text-gray-500 dark:text-gray-400">{label}</p>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${primary ? 'bg-[#ff4a00]/10 text-[#ff4a00]' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
          <Icon className="text-[20px]">{icon}</Icon>
        </span>
      </div>
      <div className={`font-headline text-4xl font-bold ${primary ? 'text-transparent bg-clip-text' : 'text-gray-900 dark:text-white'}`} style={primary ? { backgroundImage: 'linear-gradient(135deg,#ff4a00,#e04200)' } : {}}>{value}</div>
      {footer && <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-label">{footer}</div>}
    </motion.div>
  );
}

/* ─── Activity Log Item ────────────────────────── */
function ActivityItem({ log, delay = 0 }) {
  const success = log.status === 'success' || log.status === 'completed';
  const actionName = log.action || log.status;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white dark:bg-[#0d0d14] rounded-2xl border border-gray-200 dark:border-white/10 hover:border-[#ff4a00]/30 hover:shadow-sm transition-all p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-label text-[9px] uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 rounded-lg font-bold">
          {actionName}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-label shrink-0">{formatRelativeTime(log.createdAt || new Date())}</span>
      </div>
      <p className="font-body text-sm font-semibold text-gray-900 dark:text-white truncate mb-3" title={log.message || `Execution ${log.executionId}`}>{log.message || `Execution ${log.executionId}`}</p>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${success ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        <Icon className="text-[15px]">{success ? 'check_circle' : 'warning'}</Icon>
        {success ? 'Success' : 'Failed'}
      </span>
    </motion.div>
  );
}

/* ─── Quick Actions ────────────────────────────── */
function QuickActions({ onNewWorkflow }) {
  const navigate = useNavigate();
  const actions = [
    { icon: 'add', label: 'New Workflow', desc: 'Start building', onClick: onNewWorkflow, primary: true },
    { icon: 'account_tree', label: 'All Workflows', desc: 'View & manage', onClick: () => navigate('/workflows') },
    { icon: 'receipt_long', label: 'Action Logs', desc: 'Inspect runs', onClick: () => navigate('/logs') },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
      {actions.map(({ icon, label, desc, onClick, primary }, i) => (
        <motion.button
          key={label}
          onClick={onClick}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 + i * 0.06 }}
          className={`flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-center ${
            primary
              ? 'text-white border-transparent'
              : 'bg-white dark:bg-[#0d0d14] border-gray-200 dark:border-white/10 hover:border-[#ff4a00]/30 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          style={primary ? { background: 'linear-gradient(135deg,#ff4a00,#e04200)', boxShadow: '0 0 15px rgba(255,74,0,0.2)' } : {}}
        >
          <Icon className="text-[28px] mb-1">{icon}</Icon>
          <span className="font-headline font-bold text-sm tracking-tight">{label}</span>
          <span className={`font-label text-[10px] uppercase tracking-widest ${primary ? 'text-white/70' : 'text-gray-400 dark:text-white/40'}`}>{desc}</span>
        </motion.button>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#0d0d14] px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg">
        <p className="font-label text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="font-body text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Dashboard ────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();

    // Setup real-time socket
    const socket = getSocket();
    
    // We can listen to globally emitted execution events if we want, or join an org room.
    // For now, we'll refetch on execution completion to keep chart accurate.
    const handleExecutionUpdate = (data) => {
      if (data.status === 'completed' || data.status === 'failed') {
        loadData(false); // background refresh
      }
    };

    socket.on('execution:completed', handleExecutionUpdate);
    socket.on('execution:failed', handleExecutionUpdate);

    return () => {
      socket.off('execution:completed', handleExecutionUpdate);
      socket.off('execution:failed', handleExecutionUpdate);
    };
  }, []);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [analyticsData, logData] = await Promise.all([
        apiClient('/analytics/dashboard'),
        apiClient('/logs?limit=5').catch(() => ({ logs: [] })),
      ]);
      setAnalytics(analyticsData);
      setLogs(logData.logs || []);
      if (showLoading) setError('');
    } catch (err) {
      if (showLoading) setError(err.message || 'Failed to load dashboard data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      const newWf = await apiClient('/workflows', {
        method: 'POST',
        body: JSON.stringify({ name: `New Workflow ${Date.now()}`, description: 'Auto-generated workflow' }),
      });
      navigate(`/editor/${newWf.workflow._id}`);
    } catch (err) {
      setError('Failed to create workflow: ' + err.message);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const metrics = analytics?.metrics || {
    totalWorkflows: 0, activeWorkflows: 0, totalExecutions: 0, successRate: 0
  };

  const chartData = analytics?.chartData || [];

  return (
    <AppLayout title="Dashboard" subtitle="Monitor your automation health and recent activity in real-time.">
      {error && (
        <div className="p-4 bg-error/10 text-error text-sm rounded-xl flex items-center gap-2">
          <Icon className="text-[18px]">error</Icon> {error}
        </div>
      )}

      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl px-6 sm:px-8 py-7 sm:py-8 shadow-xl shadow-[#ff4a00]/10"
        style={{ background: 'linear-gradient(135deg, #ff4a00, #e04200)' }}
      >
        <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-16 w-48 h-48 rounded-full bg-white/8 blur-2xl pointer-events-none" />
        <div className="relative">
          <p className="font-label text-[10px] uppercase tracking-[.18em] text-white/70 font-bold mb-1">Automation workspace</p>
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}.
          </h2>
          <p className="mt-1.5 text-white/75 text-sm">
            You have {metrics.totalWorkflows} workflow{metrics.totalWorkflows !== 1 ? 's' : ''} · {metrics.activeWorkflows} active.
          </p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <section>
        <p className="font-label text-[10px] uppercase tracking-[.18em] font-bold text-gray-500 dark:text-gray-400 mb-3">Quick actions</p>
        <QuickActions onNewWorkflow={handleCreateWorkflow} />
      </section>

      {/* Stat Cards */}
      <section>
        <p className="font-label text-[10px] uppercase tracking-[.18em] font-bold text-gray-500 dark:text-gray-400 mb-3">Real-Time Overview</p>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Workflows" value={metrics.totalWorkflows} icon="account_tree" delay={0} footer={<span>Across all statuses</span>} />
            <StatCard label="Active Workflows" value={metrics.activeWorkflows} icon="bolt" primary delay={0.06} footer={<><span className={`w-1.5 h-1.5 rounded-full ${metrics.activeWorkflows > 0 ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`} /><span>Currently running</span></>} />
            <StatCard label="Total Runs" value={metrics.totalExecutions} icon="history" delay={0.12} footer={<span>Total executions over time</span>} />
            <StatCard label="Success Rate" value={`${metrics.successRate}%`} icon="check_circle" delay={0.18} footer={<span>Based on all runs</span>} />
          </div>
        )}
      </section>

      {/* Chart + Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Execution Volume Chart */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="font-label text-[10px] uppercase tracking-[.18em] font-bold text-gray-500 dark:text-gray-400">Execution Volume</p>
              <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mt-0.5">Last 7 Days</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0d0d14] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 h-64 sm:h-80">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 gap-3">
                <Icon className="text-4xl opacity-40">bar_chart</Icon>
                <p className="text-sm">No executions yet. Run a workflow to see activity here.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8f9bb3' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8f9bb3' }} />
                  <Tooltip cursor={{ fill: 'rgba(255, 74, 0, 0.05)' }} content={<CustomTooltip />} />
                  <Bar dataKey="success" name="Successful" stackId="a" fill="#ff4a00" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="failed" name="Failed" stackId="a" fill="#e04200" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="font-label text-[10px] uppercase tracking-[.18em] font-bold text-gray-500 dark:text-gray-400">Activity</p>
              <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mt-0.5">Recent Runs</h3>
            </div>
            <button onClick={() => navigate('/logs')} className="text-[10px] font-bold uppercase tracking-wide text-[#ff4a00] font-label hover:underline">
              View all
            </button>
          </div>
          <div className="flex flex-col gap-3 h-64 sm:h-80 overflow-y-auto pr-1">
            {loading ? (
              <>{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</>
            ) : logs.length === 0 ? (
              <div className="bg-white dark:bg-[#0d0d14] p-6 rounded-2xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 text-center">
                No activity yet.
              </div>
            ) : (
              logs.slice(0, 5).map((log, i) => (
                <ActivityItem key={log._id} log={log} delay={i * 0.05} />
              ))
            )}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
