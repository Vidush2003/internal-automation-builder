import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { apiClient } from '../api/client';
import { ArrowLeft } from 'lucide-react';

const initialNodes = [
  { id: 'trigger', type: 'custom', position: { x: 150, y: 210 }, data: { label: 'Manual Trigger', type: 'TRIGGER_MANUAL' } }
];

// Custom Node Component to match Alexandria Light Design System
const CustomNode = ({ data, id }) => {
  const isTrigger = id === 'trigger' || data.type === 'TRIGGER_MANUAL';
  
  let iconName = 'bolt';
  let badgeColor = 'text-primary';
  let badgeBg = 'bg-secondary-container';
  let badgeLabel = 'Trigger';

  if (data.type === 'ACTION_HTTP') {
    iconName = 'http';
    badgeColor = 'text-primary';
    badgeBg = 'bg-primary-fixed/20';
    badgeLabel = 'HTTP Action';
  } else if (data.type === 'ACTION_EMAIL') {
    iconName = 'mail';
    badgeColor = 'text-secondary';
    badgeBg = 'bg-secondary-container';
    badgeLabel = 'Email Action';
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm p-4 w-64 border border-outline-variant/30 hover:border-primary transition-all relative select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${badgeBg} ${badgeColor}`}>
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
          </div>
          <span className="font-label text-sm font-semibold text-on-surface truncate max-w-[150px]">{data.label}</span>
        </div>
      </div>
      <div className="text-xs text-on-surface-variant font-body">
        {data.type === 'ACTION_HTTP' && (data.url || 'No URL configured')}
        {data.type === 'ACTION_EMAIL' && (data.to || 'No recipient configured')}
        {data.type === 'TRIGGER_MANUAL' && 'Listens for manual POST trigger'}
      </div>
      
      {/* Handles */}
      {!isTrigger && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="w-3 h-3 bg-white border-2 border-primary node-connector !rounded-full -left-1.5" 
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-white border-2 border-primary node-connector !rounded-full -right-1.5" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
};

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeTab, setActiveTab] = useState('settings'); // settings | logs
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  useEffect(() => {
    if (id) loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const res = await apiClient(`/workflows/${id}`);
      const data = res.workflow;
      setWorkflow(data);
      if (data && data.nodes && data.nodes.length > 0) {
        setNodes(data.nodes.map(n => ({
          id: n.id,
          type: 'custom',
          position: n.position || { x: 100, y: 100 },
          data: n.data || { label: n.type, type: n.type }
        })));
        setEdges(data.edges.map((e, idx) => ({
          id: e.id || `e${idx}`,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle
        })));
      }
    } catch (err) {
      alert('Error loading workflow: ' + err.message);
    }
  };

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const handleSave = async () => {
    try {
      const backendNodes = nodes.map(n => ({
        id: n.id,
        type: n.data.type || (n.id === 'trigger' ? 'TRIGGER_MANUAL' : 'ACTION_HTTP'),
        data: n.data,
        position: n.position
      }));
      const backendEdges = edges.map((e, idx) => ({
        id: e.id || `e${idx}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null
      }));

      await apiClient(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...workflow, nodes: backendNodes, edges: backendEdges })
      });
      alert('Saved successfully!');
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab('logs');
    setLogs([{ timestamp: new Date().toISOString(), message: 'Workflow Queued...', level: 'info' }]);
    try {
      await handleSave();
      const res = await apiClient(`/workflows/${id}/trigger`, { method: 'POST' });
      const executionId = res.executionId;
      
      const poll = setInterval(async () => {
        try {
          const execData = await apiClient(`/workflows/executions/${executionId}`);
          if (execData.logs) setLogs(execData.logs);
          if (execData.status === 'completed' || execData.status === 'failed') {
            clearInterval(poll);
            setIsRunning(false);
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
      
    } catch (err) {
      alert('Execution failed: ' + err.message);
      setIsRunning(false);
    }
  };

  const addNode = (type) => {
    const label = type === 'ACTION_HTTP' ? 'HTTP Request' : 'Send Email';
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 200 + 200, y: Math.random() * 200 + 200 },
      data: { 
        label, 
        type,
        url: type === 'ACTION_HTTP' ? 'https://httpbin.org/get' : '',
        method: type === 'ACTION_HTTP' ? 'GET' : '',
        to: type === 'ACTION_EMAIL' ? 'recipient@example.com' : '',
        subject: type === 'ACTION_EMAIL' ? 'Notification Alert' : '',
        body: type === 'ACTION_EMAIL' ? 'The job has completed.' : ''
      }
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const deleteNode = (nodeId) => {
    if (nodeId === 'trigger') return;
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateNodeData = (field, value) => {
    setNodes(nds => nds.map(n => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            [field]: value
          }
        };
      }
      return n;
    }));
  };

  return (
    <div className="bg-background text-on-background font-body h-screen w-full overflow-hidden flex select-none relative">
      {/* TopAppBar */}
      <header className="fixed top-0 right-0 left-72 h-16 flex justify-between items-center px-8 z-30 bg-surface border-b border-outline-variant/10 shadow-sm font-headline">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/workflows')} className="p-2 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-primary transition-all">
            <ArrowLeft size={18} />
          </button>
          <span className="text-lg font-bold text-primary tracking-tight">{workflow?.name || 'Loading Designer...'}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg font-label text-sm font-medium bg-surface-container-high text-primary hover:bg-surface-variant transition-colors duration-200">
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save
          </button>
          <button onClick={handleRun} disabled={isRunning} className="flex items-center gap-2 px-6 py-2 rounded-lg font-label text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-primary-container shadow-sm hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </header>

      {/* Left Panel: Node Palette */}
      <aside className="w-72 bg-surface-container-lowest h-full z-40 flex flex-col border-r border-outline-variant/10 shadow-sm">
        <div className="p-6 pb-8 border-b border-outline-variant/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-headline font-bold text-xl shadow-sm">
            A
          </div>
          <div>
            <h1 className="font-headline text-lg font-semibold text-on-background leading-tight">Alexandria</h1>
            <p className="font-label uppercase tracking-widest text-[10px] text-on-secondary-container">Automata Suite</p>
          </div>
        </div>

        <div className="flex-grow p-6 space-y-6 overflow-y-auto">
          <div>
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3 font-bold">Triggers</h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface opacity-75 border border-outline-variant/15 select-none">
              <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span className="text-sm font-semibold">Manual Trigger</span>
            </div>
          </div>

          <div>
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3 font-bold">Actions</h3>
            <div className="space-y-2">
              <button onClick={() => addNode('ACTION_HTTP')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surface-variant transition-colors text-left border border-outline-variant/30">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed">
                  <span className="material-symbols-outlined text-[18px]">http</span>
                </div>
                <span className="text-sm font-semibold">HTTP Request</span>
              </button>

              <button onClick={() => addNode('ACTION_EMAIL')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surface-variant transition-colors text-left border border-outline-variant/30">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <span className="text-sm font-semibold">Send Email</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="ml-0 mt-16 flex-1 relative bg-surface-container-low overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(e, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
        >
          <Background color="#737784" gap={40} size={1.5} opacity={0.15} />
          <Controls />
        </ReactFlow>
      </main>

      {/* Right Panel: Settings / Execution Logs */}
      <aside className="w-80 bg-surface-container-lowest h-full z-45 flex flex-col border-l border-outline-variant/15 shadow-sm">
        {/* Panel Tabs */}
        <div className="flex border-b border-outline-variant/15 bg-surface">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3.5 text-xs font-label uppercase tracking-wider font-bold border-b-2 flex justify-center items-center gap-2 transition-all ${
              activeTab === 'settings' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3.5 text-xs font-label uppercase tracking-wider font-bold border-b-2 flex justify-center items-center gap-2 transition-all ${
              activeTab === 'logs' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Logs
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'settings' ? (
            selectedNode ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-primary border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {selectedNode.data.type === 'ACTION_HTTP' ? 'http' : (selectedNode.data.type === 'ACTION_EMAIL' ? 'mail' : 'bolt')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-label font-bold text-on-surface">{selectedNode.data.label}</h3>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                      {selectedNode.id === 'trigger' ? 'Trigger Node' : 'Action Node'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Node Label</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-outline-variant/30 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface"
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeData('label', e.target.value)}
                  />
                </div>

                {selectedNode.data.type === 'ACTION_HTTP' && (
                  <>
                    <div>
                      <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-bold">HTTP Method</label>
                      <select
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline-variant/30 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface appearance-none pr-8"
                        value={selectedNode.data.method || 'GET'}
                        onChange={(e) => updateNodeData('method', e.target.value)}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Target URL</label>
                      <input
                        type="url"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline-variant/30 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface font-mono"
                        value={selectedNode.data.url || ''}
                        onChange={(e) => updateNodeData('url', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedNode.data.type === 'ACTION_EMAIL' && (
                  <>
                    <div>
                      <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Recipient Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline-variant/30 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface"
                        value={selectedNode.data.to || ''}
                        onChange={(e) => updateNodeData('to', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Subject</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline-variant/30 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface"
                        value={selectedNode.data.subject || ''}
                        onChange={(e) => updateNodeData('subject', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Mail Body</label>
                      <textarea
                        rows="4"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline-variant/30 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface"
                        value={selectedNode.data.body || ''}
                        onChange={(e) => updateNodeData('body', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedNode.id !== 'trigger' && (
                  <button
                    onClick={() => deleteNode(selectedNode.id)}
                    className="w-full py-2.5 rounded-lg border border-error/25 text-error hover:bg-error/5 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete Node
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">ads_click</span>
                <p className="text-xs">Click a node on the canvas to configure settings.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3">Telemetry Output</h3>
              {logs.length === 0 ? (
                <span className="text-xs text-on-surface-variant">No runs executed. Click "Run" to trigger execution.</span>
              ) : (
                <div className="space-y-3">
                  {logs.map((l, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface border border-outline-variant/15 text-xs font-mono leading-relaxed">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-on-surface-variant">{l.timestamp || l.startedAt}</span>
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                          l.status === 'success' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                      <div className="text-on-surface">
                        <span className="text-primary font-bold">[{l.nodeId || 'SYSTEM'}]</span> {l.message || (l.error ? `Error: ${l.error}` : `Completed successfully`)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
