import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await apiClient('/workflows');
      setWorkflows(data.workflows || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRun = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await apiClient(`/workflows/${id}/trigger`, { method: 'POST' });
      alert('Workflow execution queued! ID: ' + res.executionId);
    } catch (err) {
      alert('Execution failed: ' + err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await apiClient(`/workflows/${id}`, { method: 'DELETE' });
      setWorkflows(workflows.filter(w => w._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w._id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout title="Active Workflows" subtitle="Curated automation sequences governing your digital ecosystem. Review status and execution history.">
      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-label text-sm font-semibold transition-all ${
              statusFilter === 'all' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg font-label text-sm font-semibold transition-all ${
              statusFilter === 'active' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-2 rounded-lg font-label text-sm font-semibold transition-all ${
              statusFilter === 'draft' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            Draft
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            className="bg-surface-container w-full rounded-xl py-2 pl-10 pr-4 text-sm font-body border-none focus:ring-1 focus:ring-primary outline-none"
            placeholder="Search Workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Workflow List (Bento-style Grid layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {filteredWorkflows.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-on-surface-variant">
            No workflows found. Add nodes using the sidebar "+" buttons.
          </div>
        ) : (
          filteredWorkflows.map((w) => (
            <article
              key={w._id}
              onClick={() => navigate(`/editor/${w._id}`)}
              className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between hover:bg-surface-container-low transition-all group relative overflow-hidden h-64 border border-outline-variant/15 shadow-sm cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-headline text-2xl text-on-background font-semibold leading-tight pr-4 truncate max-w-[280px]">
                    {w.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full font-label text-[10px] tracking-wider uppercase font-bold flex items-center gap-1.5 border ${
                    w.status === 'active' 
                      ? 'bg-surface-container-high text-primary border-primary/20' 
                      : 'bg-surface-container text-on-surface-variant border-outline-variant/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'active' ? 'bg-primary animate-pulse' : 'bg-secondary'}`}></span>
                    {w.status}
                  </span>
                </div>
                <p className="font-body text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                  {w.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex justify-between items-end relative z-10 border-t border-outline-variant/10 pt-4 mt-2">
                <div className="space-y-1">
                  <p className="font-label text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Trigger Schema</p>
                  <p className="font-body text-xs text-on-background font-semibold capitalize">{w.triggerType || 'manual'}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(w._id, e)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors border border-transparent"
                    title="Delete Workflow"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                  <button
                    onClick={(e) => handleRun(w._id, e)}
                    className="text-primary hover:text-primary-container font-label text-sm font-semibold flex items-center gap-1 hover:underline underline-offset-4 decoration-2"
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    Run Now
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </AppLayout>
  );
}
