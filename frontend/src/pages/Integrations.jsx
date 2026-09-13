import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { motion } from 'framer-motion';
import { useToast } from '../components/Overlays';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

const mockIntegrations = [
  { id: 'slack', name: 'Slack', category: 'Communication', status: 'connected', color: '#E01E5A', icon: 'tag' },
  { id: 'openai', name: 'OpenAI', category: 'AI', status: 'connected', color: '#10a37f', icon: 'smart_toy' },
  { id: 'github', name: 'GitHub', category: 'Development', status: 'disconnected', color: '#24292e', icon: 'code' },
  { id: 'jira', name: 'Jira', category: 'Project Management', status: 'disconnected', color: '#0052CC', icon: 'check_box' },
  { id: 'discord', name: 'Discord', category: 'Communication', status: 'disconnected', color: '#5865F2', icon: 'chat' },
  { id: 'google_sheets', name: 'Google Sheets', category: 'Productivity', status: 'disconnected', color: '#0F9D58', icon: 'table_view' },
  { id: 'sendgrid', name: 'SendGrid', category: 'Email', status: 'disconnected', color: '#009DD9', icon: 'mail' },
];

export default function Integrations() {
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const handleToggle = (id) => {
    setIntegrations(integrations.map(int => {
      if (int.id === id) {
        const newStatus = int.status === 'connected' ? 'disconnected' : 'connected';
        if (newStatus === 'connected') toast.success(`Successfully connected to ${int.name}`);
        else toast.info(`Disconnected from ${int.name}`);
        return { ...int, status: newStatus };
      }
      return int;
    }));
  };

  const filtered = integrations.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Integrations</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Connect your favorite apps and services to AutomataX.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</Icon>
            <input 
              type="text" 
              placeholder="Search integrations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#ff4a00]/50" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(int => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={int.id}
              className="premium-card p-5 flex flex-col group"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: int.color }}
                >
                  <Icon className="text-2xl">{int.icon}</Icon>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  int.status === 'connected' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-black/5 dark:bg-white/5 text-gray-500'
                }`}>
                  {int.status}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{int.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">{int.category}</p>

              <button 
                onClick={() => handleToggle(int.id)}
                className={`mt-auto w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                  int.status === 'connected'
                    ? 'bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-error/10 hover:text-error'
                    : 'btn-primary w-full'
                }`}
              >
                {int.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="text-3xl text-gray-400">search_off</Icon>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No integrations found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
