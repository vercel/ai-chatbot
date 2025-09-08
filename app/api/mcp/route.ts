import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod/v4';

import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://intentional-oil-65-staging.authkit.app/oauth2/jwks'),
);

// Create the MCP handler
const handler = createMcpHandler(
  (server) => {
    server.tool(
      'echo',
      'Echo back the input text',
      {
        text: z.string().describe('The text to echo back'),
      },
      async ({ text }, extra) => {
        return {
          content: [
            {
              type: 'text',
              text: `Echo: ${text}${
                extra.authInfo?.clientId
                  ? ` (authenticated as ${extra.authInfo.clientId})`
                  : ''
              }`,
            },
          ],
        };
      },
    );
  },
  {},
  {
    basePath: '/api',
  },
);

// Token verification function using WorkOS
const verifyToken = async (
  req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  try {
    const { payload } = await jwtVerify(bearerToken, JWKS, {
      issuer: 'https://intentional-oil-65-staging.authkit.app',
    });

    return {
      token: bearerToken,
      clientId: payload.sub as string,
      scopes: payload.scope ? (payload.scope as string).split(' ') : [],
      extra: {
        userId: payload.sub,
        email: payload.email,
      },
    };
  } catch (err) {
    console.error('Token verification failed:', err);
    return undefined;
  }
};

// Wrap with MCP auth
const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
});

export { authHandler as GET, authHandler as POST };
