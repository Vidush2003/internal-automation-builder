import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../api/client';
import { useConfirm, useToast } from '../components/Overlays';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

const statusMeta = {
  active: { label: 'Active', icon: 'bolt', color: '#10b981' },
  draft: { label: 'Draft', icon: 'edit_note', color: '#94a3b8' },
  failed: { label: 'Failed', icon: 'error', color: '#f43f5e' },
};

function relativeDate(value) {
  if (!value) return 'Recently';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) {
    const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function WorkflowCardSkeleton() {
  return <div className="h-64 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 animate-pulse" />;
}

// Renders a mini visual representation of the workflow nodes
function MiniNodeGraph({ nodes }) {
  if (!nodes || nodes.length === 0) {
    return <div className="text-xs text-gray-400 py-2">Empty workflow</div>;
  }
  
  // Show up to 4 nodes, then a "+N more" indicator
  const displayNodes = nodes.slice(0, 4);
  const remaining = nodes.length - 4;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-3">
      {displayNodes.map((node, i) => {
        // Simplified node icon logic based on type/label
        let icon = 'account_tree';
        let color = '#94a3b8';
        if (node.type?.includes('Trigger') || node.id?.includes('trigger')) { icon = 'bolt'; color = '#ff4a00'; }
        else if (node.type?.includes('HTTP')) { icon = 'api'; color = '#3b82f6'; }
        else if (node.type?.includes('Condition')) { icon = 'call_split'; color = '#8b5cf6'; }
        else if (node.type?.includes('Gemini') || node.type?.includes('AI')) { icon = 'auto_awesome'; color = '#ec4899'; }

        return (
          <React.Fragment key={node.id}>
            <div className="flex items-center gap-1.5 bg-gray-100/50 dark:bg-white/5 border border-black/5 dark:border-white/10 px-2 py-1 rounded-md text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
              <Icon className="text-[12px]" style={{ color }}>{icon}</Icon>
              <span className="truncate">{node.data?.label || node.type || 'Node'}</span>
            </div>
            {i < displayNodes.length - 1 && (
              <Icon className="text-[14px] text-gray-300 dark:text-gray-600">arrow_forward</Icon>
            )}
          </React.Fragment>
        );
      })}
      {remaining > 0 && (
        <>
          <Icon className="text-[14px] text-gray-300 dark:text-gray-600">arrow_forward</Icon>
          <div className="bg-gray-100/50 dark:bg-white/5 border border-black/5 dark:border-white/10 px-2 py-1 rounded-md text-[10px] font-semibold text-gray-500">
            +{remaining}
          </div>
        </>
      )}
    </div>
  );
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  
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
    active: workflows.filter((w) => w.status === 'active').length,
    draft: workflows.filter((w) => w.status === 'draft').length,
    failed: workflows.filter((w) => w.status === 'failed').length, // Assuming we track failure status
  }), [workflows]);

  const filteredWorkflows = useMemo(() => workflows.filter((workflow) => {
    const name = workflow.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) && (statusFilter === 'all' || workflow.status === statusFilter);
  }), [workflows, searchTerm, statusFilter]);

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-gray-900 dark:text-white">
            Workflows
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-lg">
            Create, manage and monitor your automations.
          </p>
        </div>
        <button onClick={createWorkflow} disabled={creating} className="btn-primary shrink-0 self-start md:self-auto">
          <Icon className="text-[18px]">add</Icon> {creating ? 'Creating...' : 'New Workflow'}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6 bg-white dark:bg-[#111115] p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex gap-1 overflow-x-auto" role="tablist">
          {['all', 'active', 'draft', 'failed'].map((status) => (
            <button 
              key={status} 
              onClick={() => setStatusFilter(status)} 
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {status} <span className="ml-1.5 text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{counts[status]}</span>
            </button>
          ))}
        </div>
        
        <div className="relative w-full lg:w-80 shrink-0 px-2 lg:px-0">
          <Icon className="absolute left-3 lg:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</Icon>
          <input 
            type="text" 
            className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#ff4a00]/50 placeholder:text-gray-400" 
            placeholder="Search workflows..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <><WorkflowCardSkeleton /><WorkflowCardSkeleton /><WorkflowCardSkeleton /></>
        ) : filteredWorkflows.length === 0 ? (
          <div className="col-span-full premium-card py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Icon className="text-3xl text-gray-400">account_tree</Icon>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No workflows found</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              {workflows.length === 0 
                ? 'Create your first automation or let AI build one for you.' 
                : 'Try adjusting your search or filters to find what you are looking for.'}
            </p>
            {workflows.length === 0 && (
              <button onClick={createWorkflow} className="mt-6 btn-primary">
                Create Workflow
              </button>
            )}
          </div>
        ) : filteredWorkflows.map((workflow) => {
          const status = statusMeta[workflow.status] || statusMeta.draft;
          const nodeCount = workflow.nodes?.length || 0;
          // Mock stats for information density if they don't exist in the model
          const successRate = workflow.successRate ?? '100%';
          const runs = workflow.runs ?? 0;

          return (
            <article 
              key={workflow._id} 
              onClick={() => navigate(`/editor/${workflow._id}`)} 
              className="group premium-card-hover cursor-pointer p-5 flex flex-col relative"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{status.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(event) => handleDelete(workflow, event)} 
                    className="p-1.5 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error-light transition-all"
                  >
                    <Icon className="text-[18px]">delete</Icon>
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{workflow.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10">
                {workflow.description || 'No description provided.'}
              </p>

              {/* Mini Workflow Graph */}
              <div className="my-4 border-y border-black/5 dark:border-white/5 py-2">
                <MiniNodeGraph nodes={workflow.nodes} />
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium mb-4">
                <span>{nodeCount} nodes</span>
                <span>{runs} runs</span>
                <span>{successRate} success</span>
              </div>

              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-[11px] text-gray-400 font-medium">
                  Updated {relativeDate(workflow.updatedAt)}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/apps/${workflow._id}`); }} className="btn-ghost !px-2.5 !py-1 !text-[11px]">
                    Open App
                  </button>
                  <button onClick={(e) => handleRun(workflow._id, e)} className="btn-ghost !px-2.5 !py-1 !text-[11px] !text-primary hover:!bg-primary-light">
                    Run →
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AppLayout>
  );
}