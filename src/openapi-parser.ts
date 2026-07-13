import * as SwaggerParser from 'swagger-parser';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedOpenAPISpec {
  title: string;
  version: string;
  baseUrl: string;
  paths: Record<string, PathItem>;
}

export interface PathItem {
  path: string;
  methods: OperationDetail[];
}

export interface OperationDetail {
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: ParameterDetail[];
  requestBody?: RequestBodyDetail;
}

export interface ParameterDetail {
  name: string;
  in: string;
  required: boolean;
  schema?: Record<string, unknown>;
}

export interface RequestBodyDetail {
  required: boolean;
  content: Record<string, unknown>;
}

export async function parseOpenAPISpec(specPathOrObj: string | any): Promise<ParsedOpenAPISpec> {
  try {
    let api: any;

    // Handle both file path and object
    if (typeof specPathOrObj === 'string') {
      // Read from file
      const filePath = path.resolve(specPathOrObj);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      if (specPathOrObj.endsWith('.json')) {
        api = JSON.parse(fileContent);
      } else if (specPathOrObj.endsWith('.yaml') || specPathOrObj.endsWith('.yml')) {
        api = JSON.parse(fileContent);
      } else {
        api = JSON.parse(fileContent);
      }
    } else {
      // Already an object
      api = specPathOrObj;
    }
    
    const baseUrl = api.servers?.[0]?.url || 'http://localhost:3000';
    const title = api.info.title || 'Unknown API';
    const version = api.info.version || '1.0.0';
    
    const paths: Record<string, PathItem> = {};
    
    if (api.paths) {
      for (const pathKey of Object.keys(api.paths)) {
        const pathItem = api.paths[pathKey] as any;
        const methods: OperationDetail[] = [];
        
        for (const method of Object.keys(pathItem)) {
          const operation = pathItem[method];
          if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
            methods.push({
              method: method.toUpperCase(),
              operationId: operation?.operationId,
              summary: operation?.summary,
              description: operation?.description,
              parameters: operation?.parameters?.map((p: any) => ({
                name: p.name,
                in: p.in,
                required: p.required || false,
                schema: p.schema,
              })),
              requestBody: operation?.requestBody ? {
                required: operation.requestBody.required || false,
                content: operation.requestBody.content,
              } : undefined,
            });
          }
        }
        
        if (methods.length > 0) {
          paths[pathKey] = {
            path: pathKey,
            methods,
          };
        }
      }
    }
    
    return {
      title,
      version,
      baseUrl,
      paths,
    };
  } catch (error) {
    throw new Error(`Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`);
  }
}
