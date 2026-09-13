import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

export default function CommandPalette({ open, setOpen }) {
  const navigate = useNavigate();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog 
          open={open} 
          onOpenChange={setOpen}
          label="Global Command Palette"
          className="fixed z-[100] inset-0"
        >
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.96, y: -20, x: '-50%' }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-[640px] z-[101]"
          >
            <div className="bg-white dark:bg-[#0a0a0f] rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden flex flex-col">
              <div className="flex items-center px-4 border-b border-black/5 dark:border-white/10">
                <Icon className="text-gray-400">search</Icon>
                <Command.Input 
                  placeholder="Type a command or search..." 
                  className="flex-1 px-3 py-4 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                  <span>ESC</span>
                </div>
              </div>
              
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="p-4 text-sm text-center text-gray-500">No results found.</Command.Empty>
                
                <Command.Group heading={<div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Navigation</div>}>
                  <Command.Item onSelect={() => runCommand(() => navigate('/dashboard'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-[#ff4a00]/10 aria-selected:text-[#ff4a00]">
                    <Icon className="text-[18px]">dashboard</Icon> Dashboard
                  </Command.Item>
                  <Command.Item onSelect={() => runCommand(() => navigate('/workflows'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-[#ff4a00]/10 aria-selected:text-[#ff4a00]">
                    <Icon className="text-[18px]">account_tree</Icon> Workflows
                  </Command.Item>
                  <Command.Item onSelect={() => runCommand(() => navigate('/logs'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-[#ff4a00]/10 aria-selected:text-[#ff4a00]">
                    <Icon className="text-[18px]">receipt_long</Icon> Executions & Logs
                  </Command.Item>
                </Command.Group>

                <Command.Group heading={<div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-2">Actions</div>}>
                  <Command.Item onSelect={() => runCommand(() => console.log('Create new workflow'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-[#ff4a00]/10 aria-selected:text-[#ff4a00]">
                    <Icon className="text-[18px]">add</Icon> Create Workflow
                  </Command.Item>
                  <Command.Item onSelect={() => runCommand(() => console.log('Run workflow'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-[#ff4a00]/10 aria-selected:text-[#ff4a00]">
                    <Icon className="text-[18px]">play_arrow</Icon> Run Workflow...
                  </Command.Item>
                </Command.Group>
                
                <Command.Group heading={<div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-2">System</div>}>
                  <Command.Item onSelect={() => runCommand(() => console.log('Settings'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-gray-700 dark:text-gray-300 aria-selected:bg-[#ff4a00]/10 aria-selected:text-[#ff4a00]">
                    <Icon className="text-[18px]">settings</Icon> Settings
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </div>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  );
}
