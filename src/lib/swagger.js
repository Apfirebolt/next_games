// src/lib/swagger.js
import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', // Scans route files in this folder
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LevelVault API Documentation',
        version: '1.0.0',
        description: 'Backend REST API services for LevelVault user authentication and profiles',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT access token.',
          },
        },
        schemas: {
          UserResponse: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '66e1f0b9c3f4e201b1a7d890' },
              firstName: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              username: { type: 'string', example: 'player_one' },
              email: { type: 'string', example: 'john@example.com' },
              isAdmin: { type: 'boolean', example: false },
            },
          },
          AuthSuccess: {
            allOf: [
              { $ref: '#/components/schemas/UserResponse' },
              {
                type: 'object',
                properties: {
                  access: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                },
              },
            ],
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              detail: { type: 'string', example: 'Invalid credentials or request error.' },
            },
          },
        },
      },
      security: [],
    },
  });
  return spec;
};