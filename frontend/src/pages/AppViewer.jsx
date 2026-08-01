import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { getSocket } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

export default function AppViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState('{\n  "email": "customer@example.com",\n  "amount": 100\n}');
  
  // Execution state
  const [running, setRunning] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null); // 'running', 'completed', 'failed'

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  useEffect(() => {
    if (!currentExecutionId) return;

    const socket = getSocket();
    
    // Join the execution room
    socket.emit('join_execution', currentExecutionId);

    const handleNodeStarted = (data) => {
      setLogs(prev => [...prev, { id: Date.now(), type: 'info', msg: `Started node: ${data.nodeId}` }]);
    };
    const handleNodeCompleted = (data) => {
      const msg = `Completed node: ${data.nodeId}`;
      const outputMsg = data.output ? `\n${JSON.stringify(data.output, null, 2)}` : '';
      setLogs(prev => [...prev, { id: Date.now(), type: 'success', msg: msg + outputMsg }]);
    };
    const handleNodeFailed = (data) => {
      setLogs(prev => [...prev, { id: Date.now(), type: 'error', msg: `Failed node: ${data.nodeId} - ${data.error}` }]);
    };
    const handleCompleted = (data) => {
      setStatus('completed');
      setRunning(false);
      setLogs(prev => [...prev, { id: Date.now(), type: 'success', msg: 'Workflow execution completed successfully!' }]);
    };
    const handleFailed = (data) => {
      setStatus('failed');
      setRunning(false);
      setLogs(prev => [...prev, { id: Date.now(), type: 'error', msg: `Workflow execution failed: ${data.error}` }]);
    };

    socket.on('execution:node_started', handleNodeStarted);
    socket.on('execution:node_completed', handleNodeCompleted);
    socket.on('execution:node_failed', handleNodeFailed);
    socket.on('execution:completed', handleCompleted);
    socket.on('execution:failed', handleFailed);

    return () => {
      socket.off('execution:node_started', handleNodeStarted);
      socket.off('execution:node_completed', handleNodeCompleted);
      socket.off('execution:node_failed', handleNodeFailed);
      socket.off('execution:completed', handleCompleted);
      socket.off('execution:failed', handleFailed);
      socket.emit('leave_execution', currentExecutionId);
    };
  }, [currentExecutionId]);

  const loadWorkflow = async () => {
    try {
      const data = await apiClient(`/workflows/${id}`);
      setWorkflow(data.workflow);
    } catch (err) {
      setError(err.message || 'Failed to load app');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (e) => {
    e.preventDefault();
    setError('');
    setLogs([]);
    setStatus('running');
    setRunning(true);
    setCurrentExecutionId(null);

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(payload);
    } catch (err) {
      setError('Invalid JSON payload');
      setRunning(false);
      setStatus(null);
      return;
    }

    try {
      const res = await apiClient(`/workflows/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ payload: parsedPayload })
      });
      setCurrentExecutionId(res.executionId);
      setLogs([{ id: Date.now(), type: 'info', msg: `Execution triggered. ID: ${res.executionId}` }]);
    } catch (err) {
      setError(err.message || 'Failed to trigger workflow');
      setRunning(false);
      setStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant font-label text-sm uppercase tracking-widest">Loading App...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-error">{error || 'App not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col">
      {/* App Header */}
      <header className="bg-surface-container-low border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/workflows')} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
            <Icon>arrow_back</Icon>
          </button>
          <div>
            <h1 className="font-headline font-bold text-xl text-on-background">{workflow.name}</h1>
            <p className="font-body text-sm text-on-surface-variant">{workflow.description}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-primary/10 text-primary font-label text-xs uppercase tracking-widest rounded-full font-bold">
          Internal App
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <section className="flex flex-col">
          <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm flex-1">
            <h2 className="font-headline font-bold text-lg mb-2">Input Variables</h2>
            <p className="text-sm text-on-surface-variant mb-6">Provide the initial payload for this workflow. Use JSON format.</p>
            
            <form onSubmit={handleRun} className="flex flex-col gap-4 h-full">
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full h-64 bg-surface-container font-mono text-sm p-4 rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                placeholder="{}"
                disabled={running}
                spellCheck="false"
              />
              
              {error && <div className="text-error text-sm font-semibold">{error}</div>}
              
              <button
                type="submit"
                disabled={running}
                className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-primary text-white font-label font-bold uppercase tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {running ? (
                  <><span className="animate-spin"><Icon>progress_activity</Icon></span> Processing...</>
                ) : (
                  <><Icon>play_arrow</Icon> Run App</>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Real-time Status Section */}
        <section className="flex flex-col">
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-6 shadow-sm flex-1 flex flex-col">
            <h2 className="font-headline font-bold text-lg mb-2">Real-Time Progress</h2>
            <p className="text-sm text-on-surface-variant mb-4">Powered by WebSockets</p>
            
            <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-4 overflow-y-auto font-mono text-xs flex flex-col gap-2">
              {logs.length === 0 ? (
                <div className="text-on-surface-variant opacity-50 m-auto text-center">
                  Waiting for execution to start...
                </div>
              ) : (
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-2 rounded border whitespace-pre-wrap ${
                        log.type === 'success' ? 'bg-primary/5 border-primary/20 text-primary' :
                        log.type === 'error' ? 'bg-error/5 border-error/20 text-error' :
                        'bg-surface-container border-outline-variant/10 text-on-background'
                      }`}
                    >
                      {log.msg}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {status && (
              <div className={`mt-4 p-3 rounded-xl border flex items-center justify-center font-bold text-sm uppercase tracking-widest ${
                status === 'completed' ? 'bg-primary/10 border-primary/20 text-primary' :
                status === 'failed' ? 'bg-error/10 border-error/20 text-error' :
                'bg-secondary-container border-outline-variant/20 text-on-secondary-container animate-pulse'
              }`}>
                {status === 'running' ? 'Running...' : status === 'completed' ? 'Success' : 'Failed'}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}