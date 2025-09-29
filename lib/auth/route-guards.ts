import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import type { Session } from "next-auth";

export type AuthSession = Session;
export type MaybeSession = Session | null;

type ApiContext = {
  request: Request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
};

type WithAuthApiOptions = {
  onUnauthorized?: () => Response | Promise<Response>;
};

type WithAuthApiHandler<T = Response> = (
  ctx: ApiContext & { session: AuthSession }
) => Promise<T> | T;

export function withAuthApi<T = Response>(
  handler: WithAuthApiHandler<T>,
  opts?: WithAuthApiOptions
) {
  return async function (request: Request, params?: unknown) {
    const session = await auth();

    if (!session?.user) {
      return (
        (await opts?.onUnauthorized?.()) ??
        new Response(
          JSON.stringify({ code: "unauthorized:api", message: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    return (await handler({ request, params, session })) as unknown as Response;
  };
}

type WithOptionalSessionApiHandler<T = Response> = (
  ctx: ApiContext & { session: MaybeSession }
) => Promise<T> | T;

export function withOptionalSessionApi<T = Response>(
  handler: WithOptionalSessionApiHandler<T>
) {
  return async function (request: Request, params?: unknown) {
    const session = await auth();
    return (await handler({ request, params, session })) as unknown as Response;
  };
}

/** For server components/pages. Redirects to /login if no session. */
export async function ensurePageSession() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Optional: For server actions that require auth. */
export function withAuthAction<TArgs extends unknown[], TResult>(
  action: (
    ...args: [...TArgs, { session: AuthSession }]
  ) => Promise<TResult> | TResult
) {
  return async (...args: TArgs) => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    return action(...args, { session });
  };
}
