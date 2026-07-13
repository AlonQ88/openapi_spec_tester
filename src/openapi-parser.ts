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

export async function parseOpenAPISpec(specPath: string): Promise<ParsedOpenAPISpec> {
  try {
    // Read the spec file
    const filePath = path.resolve(specPath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    let api: any;
    
    // Parse based on file type
    if (specPath.endsWith('.json')) {
      api = JSON.parse(fileContent);
    } else if (specPath.endsWith('.yaml') || specPath.endsWith('.yml')) {
      // For YAML files, we'll need to parse manually or use a simple approach
      // For now, we'll attempt JSON parsing first, then throw if it fails
      api = JSON.parse(fileContent);
    } else {
      // Try JSON first
      api = JSON.parse(fileContent);
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
