import { createRoot } from 'react-dom/client';

export class ReactRenderer {
  static render(component: React.ReactElement<any>, dom: HTMLElement) {
    const root = createRoot(dom);
    root.render(component);

    return {
      destroy: () => root.unmount(),
    };
  }
}
