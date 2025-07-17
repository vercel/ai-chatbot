# Model Context Protocol


## Introduction

[Model Context Protocol](https://modelcontextprotocol.io/) (MCP) is a new protocol that standardizes how LLM-based clients can programmatically interact with applications. This includes querying data, in the form of resources, or taking direct actions in the application in the form of tools.

This guide is intended for application developers implementing an MCP _server_ that requires authentication. WorkOS and AuthKit can provide a secure way to manage access to your MCP server with minimal effort.

> If you have feedback or questions about MCP, we'd love to hear from you! Reach out to [WorkOS support](mailto:support@workos.com?subject=MCP%20Authentication%20with%20AuthKit) or via your team's WorkOS Slack channel.

## Authorization

The MCP specification builds on industry-standard protocols like [OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749) in order to secure access to an MCP server. It makes the following distinctions between entities in the authorization flow:

- **Resource Server** – This is your MCP server, which you may choose to build using the [official Model Context Protocol SDKs](https://github.com/modelcontextprotocol).
- **Authorization Server** – This is AuthKit, which is a spec-compatible OAuth authorization server. While the spec allows the authorization and resource server to be the same, it can be architecturally simpler to delegate to an existing authorization server like AuthKit.

Support for MCP authorization is built on top of [WorkOS Connect](/user-management/connect), which provides all of the necessary OAuth API endpoints MCP clients will use to authenticate. You can view your AuthKit metadata by making a request to its `/.well-known/oauth-authorization-server` endpoint:

```bash
curl https://intentional-oil-65-staging.authkit.app/.well-known/oauth-authorization-server | jq
{
  "authorization_endpoint": "https://intentional-oil-65-staging.authkit.app/oauth2/authorize",
  "code_challenge_methods_supported": ["S256"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "introspection_endpoint": "https://intentional-oil-65-staging.authkit.app/oauth2/introspection",
  "issuer": "https://intentional-oil-65-staging.authkit.app",
  "registration_endpoint": "https://intentional-oil-65-staging.authkit.app/oauth2/register",
  "scopes_supported": ["email", "offline_access", "openid", "profile"],
  "response_modes_supported": ["query"],
  "response_types_supported": ["code"],
  "token_endpoint": "https://intentional-oil-65-staging.authkit.app/oauth2/token",
  "token_endpoint_auth_methods_supported": [
    "none",
    "client_secret_post",
    "client_secret_basic"
  ]
}
```

## Integrating

AuthKit handles the authentication flow so your MCP server only needs to implement the following concerns:

1. Verifying access tokens issued by AuthKit for your MCP server.
1. Direct clients to AuthKit using standardized metadata endpoints.

### Enabling Dynamic Client Registration

The MCP protocol requires authorization servers (AuthKit) to implement the [OAuth 2.0 Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591). This allows MCP clients to discover and self-register without prior knowledge of the MCP server.

Dynamic Client Registration is off by default but can be enabled in the WorkOS Dashboard under _Applications_ → _Configuration_.

![A screenshot of the Applications Configuration page in the WorkOS Dashboard.](https://images.workoscdn.com/images/10ae97ec-770c-46b6-b7b1-4a9464392590.png)

### Token Verification

Your app needs to gate access to the MCP endpoints by verifying access tokens issued by AuthKit for your MCP server. This process is very similar to [the way any Connect JWT is verified](/user-management/connect/verifying-tokens), with one important addition:

```js
;

const JWKS = createRemoteJWKSet(new URL('https://intentional-oil-65-staging.authkit.app/oauth2/jwks'));

const WWW_AUTHENTICATE_HEADER = [
  'Bearer error="unauthorized"',
  'error_description="Authorization needed"',
  `resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"`,
].join(', ');

const bearerTokenMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) {
    return res
      .set('WWW-Authenticate', WWW_AUTHENTICATE_HEADER)
      .status(401)
      .json({ error: 'No token provided.' });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'https://intentional-oil-65-staging.authkit.app',
    });

    // Use access token claims to populate request context.
    // i.e. `req.userId = payload.sub;`

    next();
  } catch (err) {
    return res
      .set('WWW-Authenticate', WWW_AUTHENTICATE_HEADER)
      .status(401)
      .json({ error: 'Invalid bearer token.' });
  }
};
```

Note the addition of a [`WWW-Authenticate`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/WWW-Authenticate) header with the `resource_metadata` challenge parameter containing a `/.well-known/oauth-protected-resource` URL. This allows clients to dynamically discover the appropriate authorization server, enabling zero-config interoperability between different MCP clients and servers.

### Metadata

Your MCP server should implement `/.well-known/oauth-protected-resource` endpoint mentioned in the previous section, returning the following minimal JSON response:

```js
app.get('/.well-known/oauth-protected-resource', (req, res) =>
  res.json({
    resource: `https://mcp.example.com`,
    authorization_servers: ['https://intentional-oil-65-staging.authkit.app'],
    bearer_methods_supported: ['header'],
  }),
);
```

MCP clients that support metadata discovery will automatically fetch this metadata when they initially encounter a `401 Unauthorized` error from the middleware implemented above. Since AuthKit is included in the metadata under `authorization_servers` the MCP client will redirect the user to AuthKit in order for them to sign in.

![The authorization prompt users will be shown when giving access to an MCP client.](https://images.workoscdn.com/images/ce1d133c-503c-4abc-8422-c274bbd8786c.png)

Behind the scenes, AuthKit implements the necessary authorization, dynamic client registration, and token endpoints so that your application doesn't need to. You can read more in the [latest version of the MCP authorization spec](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/901ac03e1c72827acb8017f80eeb14e38ad8ba42/docs/specification/draft/basic/authorization.mdx) but most apps can consider them implementation details of AuthKit as the authorization server.

Upon successful authentication the client will receive credentials and can start making requests to your application's MCP endpoints.

## Compatibility

The MCP space is rapidly evolving and not every client may support the latest version of the specification.

In particular, some clients may not support [OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-resource-metadata-13) and its `/.well-known/oauth-protected-resource` endpoint, instead attempting to fetch [OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414) directly from your application's MCP server.

For these clients, your server can implement a metadata endpoint as a proxy with AuthKit as the upstream source of truth:

```js
app.get('/.well-known/oauth-authorization-server', async (req, res) => {
  const response = await fetch(
    'https://intentional-oil-65-staging.authkit.app/.well-known/oauth-authorization-server',
  );
  const metadata = await response.json();

  res.json(metadata);
});
```

Clients will use AuthKit as the authorization server and the rest of the flow will be identical.
