import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseOpenAPISpec } from './openapi-parser';
import { generateTestRequests } from './test-generator';
import { executeTests } from './api-client';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.post('/api/upload-spec', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    let spec: any;
    
    try {
      spec = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch {
      res.status(400).json({ error: 'Invalid JSON file' });
      return;
    }

    // Basic validation
    if (!spec.openapi && !spec.swagger) {
      res.status(400).json({ error: 'Not a valid OpenAPI/Swagger specification' });
      return;
    }

    res.json({
      success: true,
      title: spec.info?.title || 'Unknown API',
      version: spec.info?.version || 'Unknown',
      baseUrl: spec.servers?.[0]?.url || 'Unknown',
      pathCount: Object.keys(spec.paths || {}).length,
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/parse-spec', express.json({ limit: '10mb' }), async (req: Request, res: Response): Promise<void> => {
  try {
    const specData = req.body;
    
    if (!specData || typeof specData !== 'object') {
      res.status(400).json({ error: 'Invalid spec data' });
      return;
    }
    
    // Parse the spec
    const parsedSpec = await parseOpenAPISpec(specData);
    
    // Generate test requests
    const testRequests = generateTestRequests(parsedSpec);
    
    res.json({
      success: true,
      spec: parsedSpec,
      testRequests: testRequests,
      count: testRequests.length,
    });
  } catch (error) {
    console.error('Parse spec error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to parse spec' 
    });
  }
});

app.post('/api/run-tests', express.json(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { testRequests } = req.body;
    
    if (!Array.isArray(testRequests)) {
      res.status(400).json({ error: 'Invalid test requests' });
      return;
    }

    const results = await executeTests(testRequests);
    
    const summary = {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };

    res.json({
      success: true,
      results,
      summary,
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to execute tests' 
    });
  }
});

app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', message: 'OpenAPI Spec Tester is running' });
});

// Serve index.html for root path
app.get('/', (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
