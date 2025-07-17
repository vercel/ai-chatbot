import {
  protectedResourceHandler,
  metadataCorsOptionsRequestHandler,
} from 'mcp-handler';

const handler = protectedResourceHandler({
  authServerUrls: ['https://intentional-oil-65-staging.authkit.app'],
});

export { handler as GET, metadataCorsOptionsRequestHandler as OPTIONS };
