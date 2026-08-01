import { execute } from './src/workflow-engine/nodes/Action_SendEmail.js';
import dotenv from 'dotenv';

// Load the .env file from the backend root
dotenv.config();

async function runTest() {
  console.log('Testing Resend Integration...');
  console.log('API Key exists:', !!process.env.RESEND_API_KEY);

  const testNode = {
    id: 'test-email-node',
    data: {
      to: 'vidushprakashs@gmail.com', // Your real email
      subject: 'AutomataX Connection Test',
      body: 'This is a test to verify Resend is properly hooked up to the workflow engine.'
    }
  };

  const testContext = {
    executionId: 'test-execution-001',
    userId: 'system',
    orgId: 'system-org',
    global: {},
    nodes: {}
  };

  try {
    const result = await execute(testNode, testContext);
    console.log('\n--- Result ---');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ TEST PASSED: Resend successfully processed the email!');
    } else {
      console.log('\n❌ TEST FAILED: Please check your API key.');
    }
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  process.exit(0);
}

runTest();
