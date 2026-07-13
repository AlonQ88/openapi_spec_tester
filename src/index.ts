import { parseOpenAPISpec } from './openapi-parser';
import { generateTestRequests } from './test-generator';
import { executeTests } from './api-client';

async function main(): Promise<void> {
  try {
    // Example usage - replace with actual OpenAPI spec path
    const specPath = process.argv[2] || './sample-api.yaml';
    
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

main();
