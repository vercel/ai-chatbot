/// <reference types="next" />
/// <reference types="next/navigation" />
/// <reference types="next/server" />
/// <reference types="next/image" />
/// <reference types="next/link" />
/// <reference types="next/app" />

import { ReactNode } from 'react';

// Extend JSX namespace to fix JSX element type issues
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Extend React namespace to include ReactNode
declare global {
  namespace React {
    interface ReactNode {
      children?: ReactNode;
    }
  }
}
