import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Overlays';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'workspace', label: 'Workspace', icon: 'workspaces' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'billing', label: 'Billing', icon: 'credit_card' },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully!');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Nav */}
          <nav className="w-full md:w-64 shrink-0 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="text-[20px]">{tab.icon}</Icon>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <div className="premium-card p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h2>
                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input type="text" defaultValue={user?.name || 'Admin User'} className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                    <input type="email" defaultValue={user?.email || 'admin@automatax.com'} className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50" />
                  </div>
                  <div className="pt-4 border-t border-black/5 dark:border-white/5">
                    <button type="submit" className="btn-primary">Save Changes</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="premium-card p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Appearance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-black/5 dark:border-white/10 hover:border-black/20'}`}
                  >
                    <Icon className="text-3xl text-gray-800 mb-2">light_mode</Icon>
                    <h3 className="font-bold text-gray-900 dark:text-white">Light Mode</h3>
                    <p className="text-xs text-gray-500 mt-1">Clean and bright.</p>
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-black/5 dark:border-white/10 dark:hover:border-white/20'}`}
                  >
                    <Icon className="text-3xl text-gray-200 mb-2">dark_mode</Icon>
                    <h3 className="font-bold text-gray-900 dark:text-white">Dark Mode</h3>
                    <p className="text-xs text-gray-500 mt-1">Easier on the eyes.</p>
                  </button>
                </div>
              </div>
            )}

            {(activeTab === 'workspace' || activeTab === 'billing') && (
              <div className="premium-card p-12 text-center flex flex-col items-center justify-center">
                <Icon className="text-5xl text-gray-300 dark:text-gray-700 mb-4">{activeTab === 'billing' ? 'credit_card' : 'workspaces'}</Icon>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{activeTab === 'billing' ? 'Billing' : 'Workspace'} Settings</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                  This feature is currently under development. Check back soon for updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
