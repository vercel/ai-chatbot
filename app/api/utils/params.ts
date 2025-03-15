/**
 * Safely get a parameter from a dynamic route
 * This handles the case where params may be a Promise in dev but not in prod
 */
export async function getParam<T>(param: T | Promise<T>): Promise<T> {
  if (param instanceof Promise) {
    return await param;
  }
  return param;
}

/**
 * Safely get the id parameter from a dynamic route
 * We need to await params to avoid the "sync-dynamic-apis" warning
 */
export async function getIdParam(params: { id: string | Promise<string> }): Promise<string> {
  // Make sure to await the params object first
  const resolvedParams = await params;
  return getParam(resolvedParams.id);
}
