import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workflow from './src/models/Workflow.js';
import WorkflowExecution from './src/models/WorkflowExecution.js';
import User from './src/models/User.js';

dotenv.config();

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Seed 5 distinct users
    console.log('Seeding users...');
    const userNames = ['Admin System', 'Alice Engineer', 'Bob Developer', 'Charlie Ops', 'Diana Product'];
    const users = [];
    for (let i = 0; i < userNames.length; i++) {
      let u = await User.findOne({ email: `user${i}@system.local` });
      if (!u) {
        u = await User.create({
          name: userNames[i],
          email: `user${i}@system.local`,
          passwordHash: 'seedy-password-1234'
        });
      }
      users.push(u);
    }

    // Seed a few active workflows
    console.log('Seeding workflows...');
    const workflows = [];
    for (let i = 0; i < 25; i++) {
      workflows.push({
        name: `Automated Task Workflow ${i + 1}`,
        description: 'Mock data workflow generated for stats.',
        status: 'active',
        triggerType: 'schedule',
        createdBy: users[i % users.length]._id,
      });
    }
    const insertedWorkflows = await Workflow.insertMany(workflows);
    console.log(`Inserted ${insertedWorkflows.length} workflows.`);

    // Seed 15,000 executions to populate ticker metrics
    console.log('Seeding executions (this may take a few seconds)...');
    const executions = [];
    const BATCH_SIZE = 15000;
    
    for (let i = 0; i < BATCH_SIZE; i++) {
      const isFailed = Math.random() < 0.02; // 2% failure rate
      const workflow = insertedWorkflows[Math.floor(Math.random() * insertedWorkflows.length)];
      const execUser = users[Math.floor(Math.random() * users.length)];
      
      executions.push({
        workflowId: workflow._id,
        triggeredBy: execUser._id,
        status: isFailed ? 'failed' : 'completed',
        durationMs: Math.floor(Math.random() * 2000) + 150, // 150ms to 2150ms
        startedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Over the last 7 days
      });
    }
    
    await WorkflowExecution.insertMany(executions);
    console.log(`Inserted ${BATCH_SIZE} executions.`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
