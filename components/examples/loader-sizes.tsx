'use client';

import { Loader } from '@/components/elements/loader';

const Example = () => (
  <div className="flex items-center gap-8 p-8">
    <div className="text-center">
      <p className="mb-2 text-gray-600 text-sm">Small (16px)</p>
      <Loader size={16} />
    </div>

    <div className="text-center">
      <p className="mb-2 text-gray-600 text-sm">Medium (24px)</p>
      <Loader size={24} />
    </div>

    <div className="text-center">
      <p className="mb-2 text-gray-600 text-sm">Large (32px)</p>
      <Loader size={32} />
    </div>

    <div className="text-center">
      <p className="mb-2 text-gray-600 text-sm">Extra Large (48px)</p>
      <Loader size={48} />
    </div>
  </div>
);

export default Example;
