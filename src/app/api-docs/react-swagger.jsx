// src/app/api-docs/react-swagger.jsx
'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to prevent SSR evaluation
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-gray-500">Loading API documentation...</p>,
});

export default function ReactSwagger({ spec }) {
  return (
    <div className="bg-white min-h-screen">
      <SwaggerUI spec={spec} />
    </div>
  );
}