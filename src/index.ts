import app from './server';
import { parseOpenAPISpec } from './openapi-parser';
import { generateTestRequests } from './test-generator';
import { executeTests } from './api-client';

async function runCLI(): Promise<void> {
  try {
    // CLI usage - replace with actual OpenAPI spec path
    const specPath = process.argv[2] || './sample-api.json';
    
    console.log(`Parsing OpenAPI spec from: ${specPath}`);
    const openAPISpec = await parseOpenAPISpec(specPath);
    
    console.log('Generating test requests...');
    const testRequests = generateTestRequests(openAPISpec);
    
    console.log(`Generated ${testRequests.length} test requests`);
    console.log('Executing tests...');
    
    const results = await executeTests(testRequests);
    
    console.log('\n=== Test Results ===');
    results.forEach((result, index) => {
      console.log(`\nTest ${index + 1}: ${result.method} ${result.path}`);
      console.log(`Status: ${result.status}`);
      console.log(`Response Time: ${result.responseTime}ms`);
    });
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function runServer(): void {
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`🚀 OpenAPI Spec Tester Server running on http://localhost:${PORT}`);
  });
}

// Check if running as server or CLI
const args = process.argv.slice(2);
const shouldRunServer = args.includes('--server') || args.length === 0;

if (shouldRunServer) {
  // Run as server if --server flag is present or no args provided
  runServer();
} else {
  // Run as CLI with provided spec file
  runCLI();
}
