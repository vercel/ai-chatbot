import {
  protectedResourceHandler,
  metadataCorsOptionsRequestHandler,
} from 'mcp-handler';

const handler = protectedResourceHandler({
  authServerUrls: ['https://intentional-oil-65-staging.authkit.app'],
});

export const GET = handler;

export async function OPTIONS(): Promise<Response> {
  return metadataCorsOptionsRequestHandler()();
}
