/**
 * Next.js Specific Mocks
 * Mocks for Next.js APIs and components used in tests
 */

// Mock Next.js navigation
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  basePath: '',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

export const mockUseRouter = () => mockRouter;

export const mockUseSearchParams = (params: Record<string, string> = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });
  return searchParams;
};

export const mockUsePathname = (pathname: string = '/') => pathname;

export const mockUseParams = (params: Record<string, string> = {}) => params;

// Mock Next.js Image component
export const mockImage = ({ src, alt, ...props }: any) => {
  return <img src={src} alt={alt} {...props} />;
};

// Mock Next.js Link component
export const mockLink = ({ href, children, ...props }: any) => {
  return <a href={href} {...props}>{children}</a>;
};

// Mock Next.js dynamic imports
export const mockDynamic = (fn: () => any, options: any = {}) => {
  const Component = (props: any) => {
    const DynamicComponent = fn();
    if (DynamicComponent.then) {
      // If it's a promise, return loading state
      return options.loading ? options.loading() : <div>Loading...</div>;
    }
    return <DynamicComponent {...props} />;
  };
  
  Component.displayName = 'MockedDynamicComponent';
  return Component;
};

// Mock Next.js Head component
export const mockHead = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Mock Next.js Script component
export const mockScript = ({ src, strategy, onLoad, onError, ...props }: any) => {
  return <script src={src} {...props} />;
};

// Mock Next.js metadata API
export const mockMetadata = {
  title: 'Test App',
  description: 'Test application for Jest',
  keywords: ['test', 'jest', 'nextjs'],
  openGraph: {
    title: 'Test App',
    description: 'Test application',
    images: ['/test-og-image.jpg'],
  },
};

// Mock Next.js redirect
export const mockRedirect = jest.fn((url: string, type?: 'replace' | 'push') => {
  return {
    redirect: {
      destination: url,
      permanent: type === 'replace',
    },
  };
});

// Mock Next.js notFound
export const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

// Mock Next.js revalidatePath
export const mockRevalidatePath = jest.fn((path: string, type?: 'layout' | 'page') => {
  console.log(`Mock revalidating path: ${path} (${type})`);
});

// Mock Next.js revalidateTag
export const mockRevalidateTag = jest.fn((tag: string) => {
  console.log(`Mock revalidating tag: ${tag}`);
});

// Mock Next.js cookies
export const mockCookies = () => {
  const cookieStore = new Map<string, string>();

  return {
    get: jest.fn((name: string) => {
      const value = cookieStore.get(name);
      return value ? { name, value } : undefined;
    }),
    set: jest.fn((name: string, value: string, options?: any) => {
      cookieStore.set(name, value);
    }),
    delete: jest.fn((name: string) => {
      cookieStore.delete(name);
    }),
    has: jest.fn((name: string) => cookieStore.has(name)),
    getAll: jest.fn(() => {
      return Array.from(cookieStore.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    }),
  };
};

// Mock Next.js headers
export const mockHeaders = () => {
  const headerStore = new Map<string, string>([
    ['user-agent', 'Jest Test Environment'],
    ['x-forwarded-for', '127.0.0.1'],
    ['x-real-ip', '127.0.0.1'],
    ['host', 'localhost:3033'],
    ['content-type', 'application/json'],
  ]);

  return {
    get: jest.fn((name: string) => headerStore.get(name.toLowerCase())),
    has: jest.fn((name: string) => headerStore.has(name.toLowerCase())),
    set: jest.fn((name: string, value: string) => {
      headerStore.set(name.toLowerCase(), value);
    }),
    entries: jest.fn(() => Array.from(headerStore.entries())),
    keys: jest.fn(() => Array.from(headerStore.keys())),
    values: jest.fn(() => Array.from(headerStore.values())),
    forEach: jest.fn((callback: (value: string, key: string) => void) => {
      headerStore.forEach(callback);
    }),
  };
};

// Mock Next.js server actions
export const mockServerAction = (fn: (...args: any[]) => any) => {
  const mockAction = jest.fn(fn);
  mockAction.toString = () => 'server-action';
  return mockAction;
};

// Mock Next.js middleware
export const mockMiddleware = (handler: (req: Request) => Response | Promise<Response>) => {
  return jest.fn(handler);
};

// Mock Next.js API route helpers
export const mockApiRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
  PATCH: jest.fn(),
  HEAD: jest.fn(),
  OPTIONS: jest.fn(),
};

// Mock Next.js config
export const mockNextConfig = {
  env: {
    NODE_ENV: 'test',
  },
  publicRuntimeConfig: {},
  serverRuntimeConfig: {},
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    appDir: true,
  },
};

// Mock useSearchParams hook behavior
export const createMockSearchParams = (initialParams: Record<string, string> = {}) => {
  const params = new URLSearchParams(initialParams);
  
  return {
    get: jest.fn((key: string) => params.get(key)),
    getAll: jest.fn((key: string) => params.getAll(key)),
    has: jest.fn((key: string) => params.has(key)),
    set: jest.fn((key: string, value: string) => params.set(key, value)),
    delete: jest.fn((key: string) => params.delete(key)),
    append: jest.fn((key: string, value: string) => params.append(key, value)),
    entries: jest.fn(() => params.entries()),
    keys: jest.fn(() => params.keys()),
    values: jest.fn(() => params.values()),
    toString: jest.fn(() => params.toString()),
    [Symbol.iterator]: jest.fn(() => params[Symbol.iterator]()),
  };
};

// Mock form actions
export const mockFormAction = (action: string | ((formData: FormData) => void)) => {
  if (typeof action === 'string') {
    return action;
  }
  
  return jest.fn(action);
};

// Mock Next.js cache functions
export const mockCache = jest.fn(<T extends (...args: any[]) => any>(fn: T): T => {
  const cached = jest.fn((...args: Parameters<T>) => {
    return fn(...args);
  }) as T;
  
  cached.toString = () => `cached(${fn.name || 'anonymous'})`;
  return cached;
});

export const mockUnstableCache = jest.fn(<T extends (...args: any[]) => any>(
  fn: T,
  keyParts?: string[],
  options?: {
    tags?: string[];
    revalidate?: number | false;
  }
): T => {
  const cached = jest.fn((...args: Parameters<T>) => {
    return fn(...args);
  }) as T;
  
  cached.toString = () => `unstable_cache(${fn.name || 'anonymous'})`;
  return cached;
});

// Export all mocks
export default {
  mockRouter,
  mockUseRouter,
  mockUseSearchParams,
  mockUsePathname,
  mockUseParams,
  mockImage,
  mockLink,
  mockDynamic,
  mockHead,
  mockScript,
  mockMetadata,
  mockRedirect,
  mockNotFound,
  mockRevalidatePath,
  mockRevalidateTag,
  mockCookies,
  mockHeaders,
  mockServerAction,
  mockMiddleware,
  mockApiRoute,
  mockNextConfig,
  createMockSearchParams,
  mockFormAction,
  mockCache,
  mockUnstableCache,
};