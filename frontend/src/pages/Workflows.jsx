import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';
import { useConfirm, useToast } from '../components/Overlays';

const statusMeta = {
  active: { label: 'Active', icon: 'bolt', className: 'bg-primary/10 text-primary border-primary/20' },
  draft: { label: 'Draft', icon: 'edit_note', className: 'bg-surface-container-high text-on-surface-variant border-outline-variant/20' },
  archived: { label: 'Archived', icon: 'inventory_2', className: 'bg-surface-container text-on-surface-variant border-outline-variant/20' },
};

function relativeDate(value) {
  if (!value) return 'Recently created';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  return `Updated ${days} days ago`;
}

function WorkflowCardSkeleton() {
  return <div className="h-72 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 animate-pulse" />;
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
      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined">account_tree</span></span>
          <div><p className="font-label text-[10px] uppercase tracking-[.16em] font-bold text-primary">Automation library</p><p className="mt-1 text-sm text-on-surface-variant">{counts.all === 0 ? 'Create your first workflow to get started.' : `${counts.all} workflow${counts.all === 1 ? '' : 's'} in this workspace`}</p></div>
        </div>
        <button onClick={createWorkflow} disabled={creating} className="btn-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md hover:-translate-y-px transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[18px]">add</span>{creating ? 'Creating…' : 'New workflow'}</button>
      </section>

      <form onSubmit={generateWithAi} className="relative rounded-2xl overflow-hidden shadow-sm border border-[#7b2cbf]/30 bg-surface-container-lowest flex items-center p-2 focus-within:ring-2 focus-within:ring-[#7b2cbf]/20 transition-all">
        <span className="material-symbols-outlined absolute left-4 text-[22px] text-[#7b2cbf]">auto_awesome</span>
        <input 
          type="text" 
          disabled={generatingAi}
          className="w-full bg-transparent py-3 pl-12 pr-4 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60" 
          placeholder="Describe your workflow and let AI build it (e.g. 'Trigger on webhook, decide if it is a refund, and email the team')" 
          value={aiPrompt} 
          onChange={(e) => setAiPrompt(e.target.value)} 
        />
        <button 
          type="submit" 
          disabled={generatingAi || !aiPrompt.trim()} 
          className="bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] text-white rounded-xl px-5 py-2.5 text-xs font-bold tracking-wide uppercase whitespace-nowrap disabled:opacity-50 hover:shadow-md transition-all flex items-center gap-2"
        >
          {generatingAi ? 'Generating...' : 'Generate'}
        </button>
      </form>

      <section className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Workflow status filters">
          {['all', 'active', 'draft'].map((status) => (
            <button key={status} role="tab" aria-selected={statusFilter === status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${statusFilter === status ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15 hover:bg-surface-container-low'}`}>
              {status} <span className="ml-1 opacity-70">{counts[status]}</span>
            </button>
          ))}
        </div>
        <label className="relative w-full lg:w-72"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span><input type="search" className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/15 py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="Search workflows" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? <><WorkflowCardSkeleton /><WorkflowCardSkeleton /><WorkflowCardSkeleton /></> : filteredWorkflows.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest py-16 px-6 text-center"><span className="material-symbols-outlined text-4xl text-primary/50">account_tree</span><h3 className="mt-3 font-headline text-xl font-bold text-on-background">{workflows.length === 0 ? 'Your automation library is empty.' : 'No workflows match this view.'}</h3><p className="mt-2 text-sm text-on-surface-variant">{workflows.length === 0 ? 'Start with a trigger, add the actions your process needs, then run it when you are ready.' : 'Try clearing the search or choosing another status.'}</p>{workflows.length === 0 && <button onClick={createWorkflow} className="mt-6 text-sm font-bold text-primary hover:underline">Create a workflow →</button>}</div>
        ) : filteredWorkflows.map((workflow) => {
          const status = statusMeta[workflow.status] || statusMeta.draft;
          const nodeCount = workflow.nodes?.length || 0;
          return (
            <article key={workflow._id} onClick={() => navigate(`/editor/${workflow._id}`)} className="group min-h-72 cursor-pointer rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-primary/5 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-label text-[10px] uppercase tracking-wider font-bold ${status.className}`}>
                    <span className="material-symbols-outlined text-[13px]">{status.icon}</span>{status.label}
                  </span>
                  <button onClick={(event) => handleDelete(workflow, event)} className="p-2 -mr-2 -mt-2 rounded-lg text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/5 transition-all" aria-label={`Delete ${workflow.name}`}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <h3 className="mt-5 font-headline text-2xl font-bold leading-tight text-on-background line-clamp-2">{workflow.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant line-clamp-2">{workflow.description || 'No description yet. Open the workflow to add its purpose and build the flow.'}</p>
              </div>
              <div className="relative mt-auto pt-5">
                <div className="flex items-center gap-4 border-t border-outline-variant/10 pt-4 text-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary">hub</span>{nodeCount} node{nodeCount === 1 ? '' : 's'}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">schedule</span>{relativeDate(workflow.updatedAt)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button 
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/apps/${workflow._id}`);
                    }} 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface hover:text-primary transition-all border border-outline-variant/20 px-3 py-1.5 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>Open App
                  </button>
                  <button onClick={(event) => handleRun(workflow._id, event)} disabled={workflow.status === 'archived'} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2 transition-all disabled:opacity-40">
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