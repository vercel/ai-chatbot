import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL('https://intentional-oil-65-staging.authkit.app/oauth2/jwks'));

const WWW_AUTHENTICATE_HEADER = [
  'Bearer error="unauthorized"',
  'error_description="Authorization needed"',
  `resource_metadata="https://servant-ai.vercel.app/.well-known/oauth-protected-resource"`,
].join(', ');

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.match(/^Bearer (.+)$/)?.[1];
  
  if (!token) {
    return NextResponse.json(
      { error: 'No token provided.' },
      { 
        status: 401,
        headers: { 'WWW-Authenticate': WWW_AUTHENTICATE_HEADER }
      }
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'https://intentional-oil-65-staging.authkit.app',
    });
    return { userId: payload.sub };
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid bearer token.' },
      { 
        status: 401,
        headers: { 'WWW-Authenticate': WWW_AUTHENTICATE_HEADER }
      }
    );
  }
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'echo',
      'Echo back the input text',
      {
        text: z.string().describe('The text to echo back'),
      },
      async ({ text }) => {        
        return {
          content: [
            {
              type: 'text',
              text: `Echo: ${text}`,
            },
          ],
        };
      }
    );
  },
  {},
  {
    basePath: '/api',
  }
);

async function GET(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  return handler(req);
}

async function POST(req: NextRequest) {
  const authResult = await verifyToken(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  return handler(req);
}

export { GET, POST };