import axios, { AxiosError } from 'axios';
import { TestRequest } from './test-generator';

export interface TestResult {
  method: string;
  path: string;
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  success: boolean;
  error?: string;
}

export async function executeTests(testRequests: TestRequest[]): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const testRequest of testRequests) {
    try {
      const startTime = Date.now();
      
      const response = await axios({
        method: testRequest.method.toLowerCase() as any,
        url: testRequest.url,
        headers: testRequest.headers,
        data: testRequest.body,
        validateStatus: () => true, // Don't throw on any status code
        timeout: 5000,
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results.push({
        method: testRequest.method,
        path: testRequest.path,
        url: testRequest.url,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        success: response.status >= 200 && response.status < 300,
      });
    } catch (error) {
      const startTime = Date.now();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results.push({
        method: testRequest.method,
        path: testRequest.path,
        url: testRequest.url,
        status: 0,
        statusText: 'Error',
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  return results;
}
