import { ParsedOpenAPISpec, PathItem } from './openapi-parser';

export interface TestRequest {
  method: string;
  path: string;
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
}

export function generateTestRequests(spec: ParsedOpenAPISpec): TestRequest[] {
  const testRequests: TestRequest[] = [];
  
  for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
    for (const operation of pathItem.methods) {
      const testRequest: TestRequest = {
        method: operation.method,
        path: pathKey,
        url: `${spec.baseUrl}${pathKey}`,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenAPI-Spec-Tester/0.1.0',
        },
      };
      
      // Handle path parameters
      let url = testRequest.url;
      if (operation.parameters) {
        const pathParams = operation.parameters.filter(p => p.in === 'path');
        const queryParams: Record<string, string> = {};
        
        for (const param of operation.parameters) {
          if (param.in === 'path') {
            // Replace path parameter with a sample value
            url = url.replace(`{${param.name}}`, `sample_${param.name}`);
          } else if (param.in === 'query' && param.required) {
            queryParams[param.name] = `sample_${param.name}`;
          }
        }
        
        if (Object.keys(queryParams).length > 0) {
          testRequest.queryParams = queryParams;
          const queryString = new URLSearchParams(queryParams).toString();
          url = `${url}?${queryString}`;
        }
      }
      
      testRequest.url = url;
      
      // Generate request body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(operation.method) && operation.requestBody) {
        testRequest.body = generateSampleRequestBody(operation.requestBody);
      }
      
      testRequests.push(testRequest);
    }
  }
  
  return testRequests;
}

function generateSampleRequestBody(requestBody: any): Record<string, unknown> {
  const sampleBody: Record<string, unknown> = {};
  
  if (requestBody.content && requestBody.content['application/json']) {
    const jsonSchema = requestBody.content['application/json'].schema;
    if (jsonSchema && jsonSchema.properties) {
      for (const [key, property] of Object.entries(jsonSchema.properties)) {
        sampleBody[key] = generateSampleValue((property as any).type);
      }
    }
  }
  
  return sampleBody;
}

function generateSampleValue(type: string): unknown {
  switch (type) {
    case 'string':
      return 'sample_value';
    case 'integer':
      return 1;
    case 'number':
      return 1.0;
    case 'boolean':
      return true;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}
