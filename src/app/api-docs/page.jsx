// src/app/api-docs/page.jsx
import { getApiDocs } from '../../lib/swagger';
import ReactSwagger from './react-swagger';

export const metadata = {
  title: 'API Documentation - LevelVault',
  description: 'Interactive API reference and OpenAPI specification',
};

export default function ApiDocsPage() {
  const spec = getApiDocs();

  return (
    <main>
      <ReactSwagger spec={spec} />
    </main>
  );
}
