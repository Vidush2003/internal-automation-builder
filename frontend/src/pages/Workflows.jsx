import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';
import { useConfirm, useToast } from '../components/Overlays';

const statusMeta = {
  active: { label: 'Active', icon: 'bolt', className: 'bg-[#ff4a00]/10 text-[#ff4a00] border-[#ff4a00]/20' },
  draft: { label: 'Draft', icon: 'edit_note', className: 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/20' },
  archived: { label: 'Archived', icon: 'inventory_2', className: 'bg-gray-50 dark:bg-[#0d0d14] text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/20' },
};

function relativeDate(value) {
  if (!value) return 'Recently created';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  return `Updated ${days} days ago`;
}

function WorkflowCardSkeleton() {
  return <div className="h-72 rounded-2xl bg-white dark:bg-[#0d0d14] border border-gray-200 dark:border-white/10 animate-pulse" />;
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient('/workflows');
      setWorkflows(data.workflows || []);
    } catch (err) {
      toast.error(`Failed to load workflows: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const createWorkflow = async () => {
    setCreating(true);
    try {
      const data = await apiClient('/workflows', {
        method: 'POST',
        body: JSON.stringify({ name: 'Untitled workflow', description: 'Describe what this workflow automates.' }),
      });
      navigate(`/editor/${data.workflow._id}`);
    } catch (err) {
      toast.error(`Failed to create workflow: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const generateWithAi = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setGeneratingAi(true);
    try {
      const data = await apiClient('/ai/generate-workflow', {
        method: 'POST',
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      toast.success('AI Workflow generated successfully!');
      navigate(`/editor/${data.workflow._id}`);
    } catch (err) {
      toast.error(`Failed to generate workflow: ${err.message}`);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleRun = async (id, event) => {
    event.stopPropagation();
    try {
      const result = await apiClient(`/workflows/${id}/trigger`, { method: 'POST' });
      toast.success(`Workflow queued · ${String(result.executionId).slice(-6)}`);
    } catch (err) {
      toast.error(`Unable to run workflow: ${err.message}`);
    }
  };

  const handleDelete = async (workflow, event) => {
    event.stopPropagation();
    const approved = await confirm({
      title: 'Delete this workflow?',
      description: `“${workflow.name}” and its execution history will be permanently removed.`,
      confirmLabel: 'Delete workflow',
      danger: true,
    });
    if (!approved) return;
    try {
      await apiClient(`/workflows/${workflow._id}`, { method: 'DELETE' });
      setWorkflows((items) => items.filter((item) => item._id !== workflow._id));
      toast.success('Workflow deleted.');
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const counts = useMemo(() => ({
    all: workflows.length,
    active: workflows.filter((workflow) => workflow.status === 'active').length,
    draft: workflows.filter((workflow) => workflow.status === 'draft').length,
  }), [workflows]);

  const filteredWorkflows = useMemo(() => workflows.filter((workflow) => {
    const name = workflow.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) && (statusFilter === 'all' || workflow.status === statusFilter);
  }), [workflows, searchTerm, statusFilter]);

  return (
    <AppLayout title="Workflows" subtitle="Design, manage, and run the automations that move your team’s work forward.">
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d14] p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#ff4a00]/10 text-[#ff4a00] flex items-center justify-center shrink-0"><span className="material-symbols-outlined">account_tree</span></span>
          <div><p className="font-label text-[10px] uppercase tracking-[.16em] font-bold text-[#ff4a00]">Automation library</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{counts.all === 0 ? 'Create your first workflow to get started.' : `${counts.all} workflow${counts.all === 1 ? '' : 's'} in this workspace`}</p></div>
        </div>
        <button onClick={createWorkflow} disabled={creating} className="text-white px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md hover:-translate-y-px transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#ff4a00,#e04200)', boxShadow: '0 0 15px rgba(255,74,0,0.2)' }}><span className="material-symbols-outlined text-[18px]">add</span>{creating ? 'Creating…' : 'New workflow'}</button>
      </section>

      <section className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff4a00]/20 to-[#e04200]/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <form onSubmit={generateWithAi} className="relative bg-white dark:bg-[#0d0d14] border border-gray-200 dark:border-[#ff4a00]/30 rounded-2xl flex items-center p-2 shadow-lg transition-all focus-within:border-[#ff4a00] focus-within:ring-1 focus-within:ring-[#ff4a00]">
          <span className="material-symbols-outlined absolute left-5 text-[22px] text-[#ff4a00] animate-pulse">auto_awesome</span>
          <input 
            type="text" 
            disabled={generatingAi}
            className="w-full bg-transparent border-none py-3.5 pl-14 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500" 
            placeholder="Describe your workflow and let AI build it..." 
            value={aiPrompt} 
            onChange={(e) => setAiPrompt(e.target.value)} 
          />
          <button 
            type="submit" 
            disabled={generatingAi || !aiPrompt.trim()} 
            className={`text-white rounded-xl px-6 py-3 text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all flex items-center gap-2 disabled:cursor-not-allowed hover:-translate-y-px active:translate-y-0 ${
              generatingAi || !aiPrompt.trim() 
                ? 'bg-gray-100 dark:bg-white/5 !text-gray-400 dark:!text-white/40' 
                : 'hover:shadow-lg'
            }`}
            style={
              generatingAi || !aiPrompt.trim() 
                ? {} 
                : { background: 'linear-gradient(135deg,#ff4a00,#e04200)', boxShadow: '0 0 15px rgba(255,74,0,0.3)' }
            }
          >
            {generatingAi ? (
              <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Generating...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">auto_fix_high</span> Generate</>
            )}
          </button>
        </form>
      </section>

      <section className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Workflow status filters">
          {['all', 'active', 'draft'].map((status) => (
            <button key={status} role="tab" aria-selected={statusFilter === status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${statusFilter === status ? 'bg-[#ff4a00] text-white shadow-sm' : 'bg-white dark:bg-[#0d0d14] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/15 hover:border-[#ff4a00]/30 hover:text-gray-900 dark:hover:text-white'}`}>
              {status} <span className="ml-1 opacity-70">{counts[status]}</span>
            </button>
          ))}
        </div>
        <label className="relative w-full lg:w-72"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400 dark:text-gray-500">search</span><input type="search" className="w-full rounded-xl bg-white dark:bg-[#0d0d14] border border-gray-200 dark:border-white/15 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[#ff4a00] focus:ring-2 focus:ring-[#ff4a00]/10" placeholder="Search workflows" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? <><WorkflowCardSkeleton /><WorkflowCardSkeleton /><WorkflowCardSkeleton /></> : filteredWorkflows.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 dark:border-white/20 bg-white dark:bg-[#0d0d14] py-16 px-6 text-center"><span className="material-symbols-outlined text-4xl text-[#ff4a00]/50">account_tree</span><h3 className="mt-3 font-headline text-xl font-bold text-gray-900 dark:text-white">{workflows.length === 0 ? 'Your automation library is empty.' : 'No workflows match this view.'}</h3><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{workflows.length === 0 ? 'Start with a trigger, add the actions your process needs, then run it when you are ready.' : 'Try clearing the search or choosing another status.'}</p>{workflows.length === 0 && <button onClick={createWorkflow} className="mt-6 text-sm font-bold text-[#ff4a00] hover:underline">Create a workflow →</button>}</div>
        ) : filteredWorkflows.map((workflow) => {
          const status = statusMeta[workflow.status] || statusMeta.draft;
          const nodeCount = workflow.nodes?.length || 0;
          return (
            <article key={workflow._id} onClick={() => navigate(`/editor/${workflow._id}`)} className="group min-h-72 cursor-pointer rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d14] p-6 shadow-sm hover:shadow-md hover:border-[#ff4a00]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-[#ff4a00]/5 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-label text-[10px] uppercase tracking-wider font-bold ${status.className}`}>
                    <span className="material-symbols-outlined text-[13px]">{status.icon}</span>{status.label}
                  </span>
                  <button onClick={(event) => handleDelete(workflow, event)} className="p-2 -mr-2 -mt-2 rounded-lg text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all" aria-label={`Delete ${workflow.name}`}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <h3 className="mt-5 font-headline text-2xl font-bold leading-tight text-gray-900 dark:text-white line-clamp-2">{workflow.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">{workflow.description || 'No description yet. Open the workflow to add its purpose and build the flow.'}</p>
              </div>
              <div className="relative mt-auto pt-5">
                <div className="flex items-center gap-4 border-t border-gray-200 dark:border-white/10 pt-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-[#ff4a00]">hub</span>{nodeCount} node{nodeCount === 1 ? '' : 's'}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">schedule</span>{relativeDate(workflow.updatedAt)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button 
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/apps/${workflow._id}`);
                    }} 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-[#ff4a00] dark:hover:text-[#ff4a00] transition-all border border-gray-200 dark:border-white/20 px-3 py-1.5 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>Open App
                  </button>
                  <button onClick={(event) => handleRun(workflow._id, event)} disabled={workflow.status === 'archived'} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#ff4a00] hover:gap-2 transition-all disabled:opacity-40">
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>Run now
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </AppLayout>
  );
}