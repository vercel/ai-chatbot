# AuthKit


## Introduction {{ "visibility": "no-quick-nav" }}

Integrating AuthKit into your app is quick and easy. In this guide, we'll walk you through adding a hosted authentication flow to your application using AuthKit.

In addition to this guide, there are a variety of [example apps](/user-management/example-apps) available to help with your integration.

## Before getting started {{ "visibility": "no-quick-nav" }}

To get the most out of this guide, you'll need:

- A [WorkOS account](https://dashboard.workos.com/)
- Your WorkOS [API Key](/glossary/api-key) and [Client ID](/glossary/client-id)

Additionally you'll need to activate AuthKit in your WorkOS Dashboard if you haven't already. In the _Overview_ section, click the _Set up User Management_ button and follow the instructions.

![WorkOS dashboard with the User Management setup button highlighted](https://images.workoscdn.com/images/01c528be-f3ed-416d-b1c4-9f8cf923d138.png?auto=format&fit=clip&q=50)

---

## (1) Configure your project

Let's add the necessary dependencies and configuration in your WorkOS Dashboard.

<StackSelection />

### Install dependencies

- $ frontend="client-only"

  For a client-only approach, use the `authkit-react` library to integrate AuthKit directly into your React application. Start by installing the library to your project via `npm`.

  ```bash title="Install React SDK"
  npm install @workos-inc/authkit-react
  ```

- $ frontend="nextjs"

  For a Next.js integration, use the `authkit-nextjs` library. Start by installing it in your Next.js project via `npm`.

  ```bash title="Install Next.js SDK"
  npm install @workos-inc/authkit-nextjs
  ```


### Configure a redirect URI

A redirect URI is a callback endpoint that WorkOS will redirect to after a user has authenticated. This endpoint will exchange the authorization code returned by WorkOS for an authenticated [User object](/reference/user-management/user). We'll create this endpoint in the next step.

You can set a redirect URI in the _Redirects_ section of the [WorkOS Dashboard](https://dashboard.workos.com). While [wildcards](/sso/redirect-uris/wildcard-characters) in your URIs can be used in the staging environment, they and query parameters cannot be used in production.

- $ frontend="client-only"

  ![Dashboard redirect URI](https://images.workoscdn.com/images/1ca70f77-a7d1-4320-aa24-732dc77e89de.png?auto=format&fit=clip&q=50)

  > For the client-only integration, make sure to set the callback URI as the same route where you require auth.

- $ frontend="nextjs, remix, vanilla, react"

  ![Dashboard redirect URI](https://images.workoscdn.com/images/58232e3c-ab9f-41cc-99f4-1692214073fa.png?auto=format&fit=clip&q=80)

When users sign out of their application, they will be redirected to your app's [Logout redirect](/user-management/sessions/configuring-sessions/logout-redirect) location which is configured in the same dashboard area.

### Configure initiate login URL

- $ frontend="client-only"

  All login requests must originate at your application for the [PKCE](/reference/user-management/authentication/get-authorization-url/pkce) code exchange to work properly. In some instances, requests may not begin at your app. For example, some users might bookmark the hosted login page or they might be led directly to the hosted login page when clicking on a password reset link in an email.

- $ frontend="nextjs, remix, vanilla, react"

  Login requests should originate from your application. In some instances, requests may not begin at your app. For example, some users might bookmark the hosted login page or they might be led directly to the hosted login page when clicking on a password reset link in an email.

In these cases, AuthKit will detect when a login request did not originate at your application and redirect to your application's login endpoint. This is an endpoint that you define at your application that redirects users to sign in using AuthKit. We'll create this endpoint in the next step.

You can configure the initiate login URL from the _Redirects_ section of the WorkOS dashboard.

![Initiate login URL](https://images.workoscdn.com/images/ab7099e9-5577-4c53-afdb-e601f1e920ad.png?auto=format&fit=clip&q=50)

- $ frontend="client-only"

  ### Configure CORS

  Since your user's browser will be making calls to the WorkOS API directly, it is necessary to add your domain to the allow list in your WorkOS Settings. This can be configured in the _Configure CORS_ dialog on the _Authentication_ page of the WorkOS dashboard.

  ![Screenshot of the WorkOS dashboard showing the "Configure CORS" option in the "Authentication" section.](https://images.workoscdn.com/images/3b7863df-8c59-4d48-ab91-f537fd5c9f66.png?auto=format&fit=clip&q=50)

  While building your integration in the Staging environment you should add your local development URL here. In the example below we're adding `http://localhost:5173` to the list of allowed web origins.

  ![Screenshot of the WorkOS dashboard showing the CORS configuration panel.](https://images.workoscdn.com/images/e20fdbfb-965f-47b5-9c64-b83f6e6b8a39.png?auto=format&fit=clip&q=50)

- $ frontend="nextjs, remix"

  ### Set secrets

  To make calls to WorkOS, provide the API key and the client ID. Store these values as managed secrets and pass them to the SDKs either as environment variables or directly in your app's configuration depending on your preferences.

- $ frontend="nextjs"

  ```plain title="Environment variables"
  WORKOS_API_KEY='sk_example_123456789'
  WORKOS_CLIENT_ID='client_123456789'
  WORKOS_COOKIE_PASSWORD="<your password>" # generate a secure password here

  # configured in the WorkOS dashboard
  NEXT_PUBLIC_WORKOS_REDIRECT_URI="http://localhost:3000/callback"
  ```

  The `NEXT_PUBLIC_WORKOS_REDIRECT_URI` uses the `NEXT_PUBLIC` prefix so the variable is accessible in edge functions and middleware configurations. This is useful for configuring operations like Vercel preview deployments.

- $ frontend="remix"

  ```plain title="Environment variables"
  WORKOS_API_KEY='sk_example_123456789'
  WORKOS_CLIENT_ID='client_123456789'

  WORKOS_REDIRECT_URI="http://localhost:3000/callback" # configured in the WorkOS dashboard
  WORKOS_COOKIE_PASSWORD="<your password>" # generate a secure password here
  ```

- $ frontend="nextjs, remix"

  The SDK requires you to set a strong password to encrypt cookies. This password must be at least 32 characters long. You can generate a secure password by using the [1Password generator](https://1password.com/password-generator/) or the `openssl` library via the command line:

  ```bash title="Generate a strong password"
  openssl rand -base64 32
  ```


> The code examples use your staging API keys when [signed in](https://dashboard.workos.com)

---

## (2) Add AuthKit to your app

Let's integrate the hosted authentication flow into your app.


- $ frontend="nextjs"

  ### Provider

  The `AuthKitProvider` component adds protections for auth edge cases and is required to wrap your app layout.

  <CodeBlock file="authkit-nextjs-provider" title="/app/layout.tsx" />

  ### Middleware

  [Next.js middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) is required to determine which routes require authentication.

  #### Implementing the middleware

  When implementing, you can opt to use either the complete `authkitMiddleware` solution or the composable `authkit` method. You'd use the former in cases where your middleware is only used for authentication. The latter is used for more complex apps where you want to have your middleware perform tasks in addition to auth.

  - | Complete

    The middleware can be implemented in the `middleware.ts` file. This is a full middleware solution that handles all the auth logic including session management and redirects for you.

    With the complete middleware solution, you can choose between page based auth and middleware auth.

    #### Page based auth

    Protected routes are determined via the use of the `withAuth` method, specifically whether the `ensureSignedIn` option is used. Usage of `withAuth` is covered further down in the _Access authentication data_ section.

    <CodeBlock file="authkit-nextjs-middleware" title="middleware.ts" />

    #### Middleware auth

    In this mode the middleware is used to protect all routes by default, redirecting users to AuthKit if no session is available. Exceptions can be configured via an allow list.

    <CodeBlock
      file="authkit-nextjs-middleware-auth-mode"
      title="middleware.ts"
    />

    In the above example, the home page `/` can be viewed by unauthenticated users. The `/account` page and its children can only be viewed by authenticated users.

  - | Composable

    The middleware can be implemented in the `middleware.ts` file. This is a composable middleware solution that handles the session management part for you but leaves the redirect and route protection logic to you.

    <CodeBlock
      file="authkit-nextjs-middleware-composable"
      title="middleware.ts"
    />

  ### Callback route

  When a user has authenticated via AuthKit, they will be redirected to your app's callback route. Make sure this route matches the `WORKOS_REDIRECT_URI` environment variable and the configured redirect URI in your WorkOS dashboard.

  <CodeBlock file="callback-endpoint-nextjs" title="/app/callback/route.ts" />

  ### Initiate login route

  We'll need an initiate login endpoint to direct users to sign in using AuthKit before redirecting them back to your application. We'll do this by generating an AuthKit authorization URL server side and redirecting the user to it.

  <CodeBlock
    file="initiate-login-endpoint-nextjs"
    title="/app/login/route.ts"
  />

  ### Access authentication data

  AuthKit can be used in both server and client components.

  - | Server component

    The `withAuth` method is used to retrieve the current logged in user and their details.

    <CodeBlock
      file="authkit-nextjs-server-component"
      title="/app/home-page/page.jsx"
    />

  - | Client component

    The `useAuth` hook is used to retrieve the current logged in user and their details.

    <CodeBlock
      file="authkit-nextjs-client-component"
      title="/app/home-page/page.jsx"
    />

  ### Protected routes

  For routes where a signed in user is mandatory, you can use the `ensureSignedIn` option.

  - | Server component

    <CodeBlock
      file="authkit-nextjs-server-component-protected-route"
      title="/app/protected/page.tsx"
    />

  - | Client component

    <CodeBlock
      file="authkit-nextjs-client-component-protected-route"
      title="/app/protected/page.jsx"
    />

  ### Ending the session

  Finally, ensure the user can end their session by redirecting them to the logout URL. After successfully signing out, the user will be redirected to your app's [Logout redirect](/user-management/sessions/configuring-sessions/logout-redirect) location, which is configured in the WorkOS dashboard.

  <CodeBlock
    file="get-authkit-url-nextjs-logout"
    title="/app/home-page/page.jsx"
  />

- $ frontend="remix"

  ### Callback route

  When a user has authenticated via AuthKit, they will be redirected to your app's callback route. In your Remix app, [create a new route](https://remix.run/docs/en/main/discussion/routes) and add the following:

  <CodeBlock file="callback-endpoint-remix" title="/routes/callback.ts" />

  ### Initiate login route

  We'll need an initiate login endpoint to direct users to sign in using AuthKit before redirecting them back to your application. We'll do this by generating an AuthKit authorization URL server side and redirecting the user to it.

  <CodeBlock file="initiate-login-endpoint-remix" title="/routes/login.ts" />

  ### Access authentication data in your Remix application

  We'll need to direct users to sign in (or sign up) using AuthKit before redirecting them back to your application. We'll do this by generating an AuthKit authorization URL server side and redirecting the user to it.

  Use `authkitLoader` to configure AuthKit for your Remix application routes. You can choose to return custom data from your loader, like for instance the sign in and sign out URLs.

  <CodeBlock file="authkit-remix-example-full" title="/app/routes/_index.jsx" />

  ### Protected routes

  For routes where a signed in user is mandatory, you can use the `ensureSignedIn` option in your loader.

  <CodeBlock
    file="authkit-remix-example-protected-route"
    title="/app/protected/route.tsx"
  />

  ### Ending the session

  Finally, ensure the user can end their session by redirecting them to the logout URL. After successfully signing out, the user will be redirected to your app's [Logout redirect](/user-management/sessions/configuring-sessions/logout-redirect) location, which is configured in the WorkOS dashboard.

  <CodeBlock
    file="authkit-remix-example-logout"
    title="/app/routes/_index.jsx"
  />

- $ frontend="vanilla, react"

  ### Set up the frontend

  To demonstrate AuthKit, we only need a simple page with links to logging in and out.

- $ frontend="vanilla"

  <CodeBlock file="frontend-vanilla" title="index.html" />

- $ frontend="react"

  <CodeBlock file="frontend-react" title="App.js" />

- $ frontend="vanilla, react"

  Clicking the "Sign in" and "Sign out" links should invoke actions on our server, which we'll set up next.

- $ backend="nodejs, ruby, php, go, python, java"

  ### Add an initiate login endpoint

  We'll need an initiate login endpoint to direct users to sign in (or sign up) using AuthKit before redirecting them back to your application. This endpoint should generate an AuthKit authorization URL server side and redirect the user to it.

  You can use the optional state parameter to encode arbitrary information to help restore application `state` between redirects.

- $ backend="nodejs"

  For this guide we'll be using the `express` web server for Node. This guide won't cover how to set up an Express app, but you can find more information in the [Express documentation](https://expressjs.com/en/starter/installing.html).

  <CodeBlock file="get-authkit-url-express" title="server.js" />

- $ backend="ruby"

  For this guide we'll be using the `sinatra` web server for Ruby. This guide won't cover how to set up a Sinatra app, but you can find more information in the [Sinatra documentation](https://sinatrarb.com/intro.html).

  <CodeBlock file="get-authkit-url-sinatra" title="server.rb" />

- $ backend="python"

  For this guide we'll be using the `flask` web server for Python. This guide won't cover how to set up a Flask app, but you can find more information in the [Flask documentation](https://flask.palletsprojects.com/en/stable/).

  <CodeBlock file="get-authkit-url-flask" title="server.py" />

- $ backend="nodejs, ruby, python"

  > WorkOS will redirect to your [Redirect URI](/glossary/redirect-uri) if there is an issue generating an authorization URL. Read our [API Reference](/reference) for more details.

  ### Add a callback endpoint

  Next, let's add the callback endpoint (referenced in [Configure a redirect URI](/user-management/1-configure-your-project/configure-a-redirect-uri)) which will exchange the authorization code (valid for 10 minutes) for an authenticated User object.

- $ backend="nodejs"

  <CodeBlock file="callback-endpoint-express" title="server.js" />

- $ backend="ruby"

  <CodeBlock file="callback-endpoint-sinatra" title="server.rb" />

- $ backend="python"

  <CodeBlock file="callback-endpoint-flask" title="server.py" />

- $ backend="nodejs, ruby, python"

  ## (3) Handle the user session

  Session management helper methods are included in our SDKs to make integration easy. For security reasons, sessions are automatically "sealed", meaning they are encrypted with a strong password.

  ### Create a session password

  The SDK requires you to set a strong password to encrypt cookies. This password must be 32 characters long. You can generate a secure password by using the [1Password generator](https://1password.com/password-generator/) or the `openssl` library via the command line:

  ```bash title="Generate a strong password"
  openssl rand -base64 32
  ```

  Then add it to the environment variables file.

  ```plain title=".env"
  WORKOS_API_KEY='sk_example_123456789'
  WORKOS_CLIENT_ID='client_123456789'

  # +diff-start
  WORKOS_COOKIE_PASSWORD='<your password>'
  # +diff-end
  ```

  ### Save the encrypted session

  Next, use the SDK to authenticate the user and return a password protected session. The refresh token is considered sensitive as it can be used to re-authenticate, hence why the session is encrypted before storing it in a session cookie.

- $ backend="nodejs"

  <CodeBlock file="encrypt-session-express" title="server.js" />

  ### Protected routes

  Then, use middleware to specify which routes should be protected. If the session has expired, use the SDK to attempt to generate a new one.

  <CodeBlock file="auth-middleware-express" title="server.js" />

  Add the middleware to the route that should only be accessible to logged in users.

  <CodeBlock file="protect-route-express" title="server.js" />

  ### Ending the session

  Finally, ensure the user can end their session by redirecting them to the logout URL. After successfully signing out, the user will be redirected to your app's [Logout redirect](/user-management/sessions/configuring-sessions/logout-redirect) location, which is configured in the WorkOS dashboard.

  <CodeBlock file="log-out-express" title="server.js" />

- $ backend="ruby"

  <CodeBlock file="encrypt-session-sinatra" title="server.rb" />

  ### Protected routes

  Then, use a helper method to specify which routes should be protected. If the session has expired, use the SDK to attempt to generate a new one.

  <CodeBlock file="auth-middleware-sinatra" title="server.rb" />

  Call the helper method in the route that should only be accessible to logged in users.

  <CodeBlock file="protect-route-sinatra" title="server.rb" />

  ### Ending the session

  Finally, ensure the user can end their session by redirecting them to the logout URL. After successfully signing out, the user will be redirected to your app's [Logout redirect](/user-management/sessions/configuring-sessions/logout-redirect) location, which is configured in the WorkOS dashboard.

  <CodeBlock file="log-out-sinatra" title="server.rb" />

- $ backend="python"

  <CodeBlock file="encrypt-session-flask" title="server.py" />

  ### Protected routes

  Then, use a decorator to specify which routes should be protected. If the session has expired, use the SDK to attempt to generate a new one.

  <CodeBlock file="auth-middleware-flask" title="server.py" />

  Use the decorator in the route that should only be accessible to logged in users.

  <CodeBlock file="protect-route-flask.trunk-ignore" title="server.py" />

  ### Ending the session

  Finally, ensure the user can end their session by redirecting them to the logout URL. After successfully signing out, the user will be redirected to your app's Logout redirect location, which is configured in the WorkOS dashboard.

  <CodeBlock file="log-out-flask.trunk-ignore" title="server.py" />

> If you haven't configured a [Logout redirect](/user-management/sessions/configuring-sessions/logout-redirect) in the WorkOS dashboard, users will see an error when logging out.

### Validate the authentication flow

Navigate to the authentication endpoint we created and sign up for an account. You can then sign in with the newly created credentials and see the user listed in the _Users_ section of the [WorkOS Dashboard](https://dashboard.workos.com).

![Dashboard showing newly created user](https://images.workoscdn.com/images/54fa6e6c-4c6f-4959-9301-344aeb4eeac8.png?auto=format&fit=clip&q=80)
