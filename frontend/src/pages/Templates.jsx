import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Overlays';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

const mockTemplates = [
  { id: 't1', title: 'Resume Screening Pipeline', category: 'HR & Recruiting', nodes: 5, uses: '12k', description: 'Automatically parse incoming resumes, grade them using Gemini AI, and slack the recruiter.', icon: 'description', color: '#8b5cf6' },
  { id: 't2', title: 'Daily Standup Summary', category: 'Engineering', nodes: 3, uses: '8.4k', description: 'Fetch yesterday\'s GitHub commits and Jira tickets to generate a daily standup report via email.', icon: 'engineering', color: '#3b82f6' },
  { id: 't3', title: 'Customer Support Triager', category: 'Customer Success', nodes: 6, uses: '15k', description: 'Analyze incoming support emails with AI and automatically route them to the correct department.', icon: 'support_agent', color: '#ec4899' },
  { id: 't4', title: 'Lead Enrichment', category: 'Marketing', nodes: 4, uses: '5.2k', description: 'Enrich new lead emails with company data and add them to your CRM instantly.', icon: 'campaign', color: '#ff4a00' },
  { id: 't5', title: 'Invoice Data Extraction', category: 'Finance', nodes: 4, uses: '3.1k', description: 'Extract line items and totals from PDF invoices and sync them to Google Sheets.', icon: 'request_quote', color: '#10b981' },
];

export default function Templates() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const navigate = useNavigate();
  const toast = useToast();

  const categories = ['All', ...new Set(mockTemplates.map(t => t.category))];

  const filtered = mockTemplates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (id) => {
    toast.info('Template cloning is coming in the next update!');
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Templates</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Jumpstart your automations with pre-built workflows.</p>
          </div>
          <button className="btn-primary shrink-0 self-start md:self-auto">
            <Icon className="text-[18px]">upload</Icon> Submit Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6 bg-white dark:bg-[#111115] p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex gap-1 overflow-x-auto" role="tablist">
            {categories.map((c) => (
              <button 
                key={c} 
                onClick={() => setCategory(c)} 
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  category === c 
                    ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          
          <div className="relative w-full lg:w-80 shrink-0 px-2 lg:px-0">
            <Icon className="absolute left-3 lg:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</Icon>
            <input 
              type="text" 
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#ff4a00]/50 placeholder:text-gray-400" 
              placeholder="Search templates..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(template => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={template.id}
              className="group premium-card flex flex-col relative overflow-hidden"
            >
              {/* Decorative Header */}
              <div className="h-16 w-full opacity-20" style={{ background: `linear-gradient(135deg, ${template.color}, transparent)` }} />
              
              <div className="p-5 pt-0 -mt-8 flex flex-col h-full z-10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm mb-4"
                  style={{ backgroundColor: template.color }}
                >
                  <Icon className="text-2xl">{template.icon}</Icon>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{template.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 mb-4">
                  {template.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mb-6">
                  <span className="flex items-center gap-1.5"><Icon className="text-[14px]">account_tree</Icon> {template.nodes} Nodes</span>
                  <span className="flex items-center gap-1.5"><Icon className="text-[14px]">download</Icon> {template.uses} Uses</span>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{template.category}</span>
                  <button onClick={() => handleUseTemplate(template.id)} className="btn-ghost !text-primary hover:!bg-primary/10">
                    Use Template →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="text-3xl text-gray-400">search_off</Icon>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No templates found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
