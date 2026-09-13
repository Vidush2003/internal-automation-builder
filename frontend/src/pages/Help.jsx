import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

const helpArticles = [
  { 
    id: '1', title: 'Building your first workflow', category: 'Getting Started', icon: 'account_tree',
    content: `
### Overview
AutomataX uses a visual drag-and-drop canvas to build workflows. A workflow consists of **Nodes** connected by **Edges**.

### 1. Triggers
Every workflow starts with a Trigger node. This determines *when* your workflow runs.
- **Webhook Trigger**: Runs when an external service sends an HTTP POST request to a unique URL.
- **Schedule Trigger**: Runs on a recurring cron schedule (e.g. every day at 9 AM).

### 2. Actions
After a trigger, you can chain Action nodes:
- **HTTP Request**: Call external APIs.
- **AI Node (Gemini)**: Process text, extract data, or generate content using LLMs.
- **Logic Branch**: Create conditional paths based on variables.

### 3. Connecting Nodes
Drag a line from the output handle (right side) of one node to the input handle (left side) of another. Data flows sequentially through the connections.`
  },
  { 
    id: '2', title: 'Connecting Slack and OpenAI', category: 'Integrations', icon: 'extension',
    content: `
### Managing Integrations
To connect third-party services, navigate to the **Integrations** tab in the sidebar.

### Slack
1. Click **Connect** on the Slack card.
2. You will be redirected to Slack's OAuth page.
3. Select the workspace and channel permissions you wish to grant.
4. Once connected, you can use the Slack Action node to post messages automatically.

### OpenAI
1. Go to your OpenAI Developer Dashboard and generate an API key.
2. Click **Connect** on the OpenAI card in AutomataX.
3. Paste your API key into the secure vault.
4. Your workflows can now use GPT models in AI Nodes.`
  },
  { 
    id: '3', title: 'Understanding Gemini Prompts', category: 'AI Nodes', icon: 'psychology',
    content: `
### Dynamic Variables
The power of AI Nodes lies in dynamic prompting. You can inject data from previous nodes directly into your prompt using double curly braces: \`{{node_id.data.field}}\`.

**Example Prompt:**
> Summarize the following customer feedback: {{trigger.body.feedback}}
> 
> Keep it under 3 sentences and highlight the main sentiment.

### Structured JSON Output
If you need the AI to output machine-readable data for downstream nodes (like saving to a database), check the **Structured JSON** option in the node settings. You can define the exact JSON schema the model must strictly follow.`
  },
  { 
    id: '4', title: 'How to use the Resume Analyzer', category: 'Tools', icon: 'description',
    content: `
### Overview
The Resume Analyzer is a specialized tool that uses multimodal AI to instantly parse and grade candidate resumes.

### Usage
1. Drag and drop a PDF file into the upload zone.
2. The AI will automatically process both text-based PDFs and scanned images.
3. It extracts the candidate's Name, Email, Phone, Skills, and Work Experience.
4. It also provides an automated 0-100 score based on standard hiring metrics.

### Building Workflows
You can automate this manual process by building a workflow with the **Parse Resume** node. This allows you to bulk-process resumes arriving via Webhooks or Emails.`
  },
  { 
    id: '5', title: 'Viewing Execution Logs', category: 'Troubleshooting', icon: 'receipt_long',
    content: `
### The Dashboard
Your main dashboard provides a bird's-eye view of your automation health, including total executions and success rates over the last 7 to 90 days.

### Detailed Logs
For deep debugging, navigate to the **Executions** tab.
- Click on any execution row to view the exact JSON inputs and outputs for every node in the workflow.
- If a node fails, it will be marked in red, and the exact error stack trace will be available in the log details.
- You can manually retry failed executions from this view.`
  },
  { 
    id: '6', title: 'Managing Workspace Members', category: 'Account', icon: 'group',
    content: `
### Inviting Team Members
AutomataX supports multi-player workspaces. Go to **Settings > Workspace** to invite colleagues.

### Roles and Permissions
- **Admin**: Can invite users, manage billing, and create/delete workflows.
- **Editor**: Can create and edit workflows, but cannot manage billing or integrations.
- **Viewer**: Can only view dashboards and execution logs.

*Note: Role-based access control is currently rolling out to Enterprise tiers.*`
  },
];

export default function Help() {
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = helpArticles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-0">
        
        <AnimatePresence mode="wait">
          {!selectedArticle ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">How can we help?</h1>
                <div className="relative max-w-xl mx-auto">
                  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[24px]">search</Icon>
                  <input 
                    type="text" 
                    placeholder="Search knowledge base..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 shadow-lg rounded-2xl py-4 pl-12 pr-4 text-base text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {filteredArticles.map((article, i) => (
                  <button 
                    onClick={() => setSelectedArticle(article)}
                    key={article.id}
                    className="premium-card p-5 flex items-start gap-4 hover:border-primary/30 transition-all group text-left w-full"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon>{article.icon}</Icon>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{article.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">{article.category}</p>
                    </div>
                  </button>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">No articles found matching "{search}".</p>
                </div>
              )}

              <div className="premium-card p-8 bg-gradient-to-br from-primary/5 to-transparent text-center">
                <Icon className="text-4xl text-primary mb-4">support_agent</Icon>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Still need help?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Our support team is available 24/7 to help you build complex automations.
                </p>
                <button className="btn-primary" onClick={() => window.alert('Support ticketing is mocked for MVP.')}>
                  Contact Support
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="article"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button 
                onClick={() => setSelectedArticle(null)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
              >
                <Icon className="text-[18px]">arrow_back</Icon> Back to Help Center
              </button>

              <article className="premium-card p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="text-2xl">{selectedArticle.icon}</Icon>
                  </div>
                  <div>
                    <p className="text-xs text-primary uppercase tracking-widest font-bold mb-1">{selectedArticle.category}</p>
                    <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{selectedArticle.title}</h1>
                  </div>
                </div>

                <div className="prose prose-sm md:prose-base dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-a:text-primary max-w-none">
                  {selectedArticle.content.split('\n').map((paragraph, idx) => {
                    const parseText = (text) => {
                      let html = text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-xs text-primary">$1</code>');
                      return <span dangerouslySetInnerHTML={{ __html: html }} />;
                    };

                    if (paragraph.startsWith('### ')) {
                      return <h3 key={idx} className="text-xl mt-8 mb-4">{paragraph.replace('### ', '')}</h3>;
                    }
                    if (paragraph.startsWith('- ')) {
                      return <li key={idx} className="ml-4 mb-2">{parseText(paragraph.replace('- ', ''))}</li>;
                    }
                    if (paragraph.match(/^\d+\.\s/)) {
                      return <li key={idx} className="ml-4 mb-2">{parseText(paragraph.replace(/^\d+\.\s/, ''))}</li>;
                    }
                    if (paragraph.startsWith('> ')) {
                      return <blockquote key={idx} className="border-l-4 border-primary/50 pl-4 italic my-4 text-gray-600 dark:text-gray-400 bg-black/5 dark:bg-white/5 py-2 rounded-r-lg">{parseText(paragraph.replace('> ', ''))}</blockquote>;
                    }
                    return paragraph.trim() ? <p key={idx} className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{parseText(paragraph)}</p> : null;
                  })}
                </div>
              </article>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
