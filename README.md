# OpenAPI Spec Tester

A Node.js/TypeScript POC application that takes OpenAPI specifications and generates test requests to APIs.

## Features

- **OpenAPI Parsing**: Validates and parses OpenAPI 3.0+ specifications
- **Test Generation**: Automatically generates test requests based on API endpoints defined in the spec
- **Test Execution**: Executes HTTP requests to the target API and collects results
- **Results Display**: Shows test results with response times and status codes

## Technology Stack

- **Runtime**: Node.js (v14+)
- **Language**: TypeScript
- **OpenAPI Parsing**: swagger-parser
- **HTTP Client**: axios
- **Test Framework**: Jest
- **Linting**: ESLint

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Usage

### Development

Build the TypeScript code:
```bash
npm run build
```

Run the application in development mode:
```bash
npm run dev -- <path-to-openapi-spec>
```

Example:
```bash
npm run dev -- ./sample-api.yaml
```

### Production

Build and run:
```bash
npm run build
npm start -- <path-to-openapi-spec>
```

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Run the compiled application
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix

## Project Structure

```
src/
├── index.ts              # Main entry point
├── openapi-parser.ts     # OpenAPI spec parser
├── test-generator.ts     # Test request generator
└── api-client.ts         # HTTP client and test executor
```

## How It Works

1. **Parse OpenAPI Spec**: The application reads and validates an OpenAPI specification file
2. **Extract Endpoints**: Identifies all API endpoints, methods, parameters, and request bodies
3. **Generate Tests**: Creates test requests for each endpoint with sample data
4. **Execute Tests**: Sends HTTP requests to the API endpoints
5. **Display Results**: Shows response codes, times, and success/failure status

## Example OpenAPI Spec

```yaml
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
servers:
  - url: https://api.example.com
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Success
    post:
      summary: Create user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                email:
                  type: string
```

## Error Handling

The application gracefully handles:
- Invalid OpenAPI specifications
- Network errors during test execution
- Missing or malformed request bodies
- Server connection failures

## Future Enhancements

- Support for authentication (API keys, OAuth)
- Custom test data generation
- Detailed response body validation
- Test result reporting (JSON, HTML)
- Performance benchmarking
- API contract validation

## License

MIT
