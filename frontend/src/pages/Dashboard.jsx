import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';

export default function Dashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiClient('/workflows');
      setWorkflows(data.workflows || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeWorkflowsCount = workflows.filter(w => w.status === 'active').length;

  return (
    <AppLayout title="Performance Overview" subtitle="A curated synthesis of your automation ecosystem. Monitoring execution fidelity and resource allocation across all active pipelines.">
      {/* Bento Grid Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Card 1 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between relative overflow-hidden group border border-outline-variant/10 shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-surface-variant group-hover:bg-primary transition-colors duration-500"></div>
          <div className="flex justify-between items-start mb-8">
            <h3 className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant font-bold">Total Workflows</h3>
            <span className="material-symbols-outlined text-on-secondary-container">account_tree</span>
          </div>
          <div className="font-headline text-4xl font-bold text-on-background">{workflows.length}</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant font-label">
            <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            <span>All systems optimal</span>
          </div>
        </div>

        {/* Metric Card 2 (Active) */}
        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between relative overflow-hidden group border border-primary/20 bg-primary-fixed/10 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <h3 className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant font-bold">Active Workflows</h3>
            <span className="material-symbols-outlined text-primary pulse-dot" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <div className="font-headline text-4xl font-bold text-primary">{activeWorkflowsCount}</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant font-label">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot"></span>
            <span>Currently running</span>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between relative overflow-hidden group border border-outline-variant/10 shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-surface-variant group-hover:bg-tertiary transition-colors duration-500"></div>
          <div className="flex justify-between items-start mb-8">
            <h3 className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant font-bold">Success Rate</h3>
            <span className="material-symbols-outlined text-on-secondary-container">check_circle</span>
          </div>
          <div className="font-headline text-4xl font-bold text-on-background">99.8%</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant font-label">
            <span className="material-symbols-outlined text-xs text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_flat</span>
            <span>Stable vs last week</span>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between relative overflow-hidden group border border-outline-variant/10 shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-surface-variant group-hover:bg-outline transition-colors duration-500"></div>
          <div className="flex justify-between items-start mb-8">
            <h3 className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant font-bold">Credits Used</h3>
            <span className="material-symbols-outlined text-on-secondary-container">database</span>
          </div>
          <div className="font-headline text-4xl font-bold text-on-background">68%</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant font-label w-full">
            <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full w-[68%] rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Complex Layout: Chart & Activity List */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Chart Area (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-outline-variant/15 pb-4">
            <h3 className="font-headline text-2xl font-bold text-on-background">Execution Volume</h3>
            <div className="font-label uppercase tracking-widest text-xs text-on-surface-variant">Last 7 Days</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-8 h-96 relative flex items-end justify-between px-12 group border border-outline-variant/10 shadow-sm">
            {/* Faux Chart Lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-12 pointer-events-none z-0">
              <div className="w-full h-px bg-outline-variant/10"></div>
              <div className="w-full h-px bg-outline-variant/10"></div>
              <div className="w-full h-px bg-outline-variant/10"></div>
              <div className="w-full h-px bg-outline-variant/10"></div>
              <div className="w-full h-px bg-outline-variant/30"></div>
            </div>
            {/* Chart Bars */}
            <div className="relative z-10 w-4 h-32 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
            <div className="relative z-10 w-4 h-48 bg-primary/40 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
            <div className="relative z-10 w-4 h-64 bg-primary/60 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
            <div className="relative z-10 w-4 h-56 bg-primary/50 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
            <div className="relative z-10 w-4 h-80 bg-primary rounded-t-sm shadow-[0_0_15px_rgba(9,76,178,0.3)]"></div>
            <div className="relative z-10 w-4 h-24 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
            <div className="relative z-10 w-4 h-16 bg-primary/10 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-outline-variant/15 pb-4">
            <h3 className="font-headline text-2xl font-bold text-on-background">Activity Log</h3>
            <span className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant font-bold">Realtime</span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:bg-surface-variant transition-colors cursor-default shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label uppercase tracking-widest text-[9px] px-2 py-1 bg-secondary-container text-on-secondary-container rounded-sm font-semibold">Webhook Ingestion</span>
                <span className="text-[10px] text-on-surface-variant font-label font-bold">2m ago</span>
              </div>
              <h4 className="font-headline font-semibold text-on-background mb-3">Sync CRM to Warehouse</h4>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1 text-tertiary">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span> Success
                </span>
                <span className="text-on-surface-variant font-mono text-[10px]">4.2s</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:bg-surface-variant transition-colors cursor-default shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label uppercase tracking-widest text-[9px] px-2 py-1 bg-secondary-container text-on-secondary-container rounded-sm font-semibold">Email Dispatch</span>
                <span className="text-[10px] text-on-surface-variant font-label font-bold">15m ago</span>
              </div>
              <h4 className="font-headline font-semibold text-on-background mb-3">Weekly Report Dispatch</h4>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1 text-error">
                  <span className="material-symbols-outlined text-[15px]">warning</span> Failed
                </span>
                <span className="text-on-surface-variant font-mono text-[10px]">30s</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
