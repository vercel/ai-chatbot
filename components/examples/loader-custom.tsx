'use client';

import { Loader } from '@/components/elements/loader';

const Example = () => {
  return (
    <div className="grid grid-cols-2 gap-6 p-8 md:grid-cols-4">
      <div className="text-center">
        <p className="mb-2 text-gray-600 text-sm">Blue</p>
        <Loader className="text-blue-500" size={24} />
      </div>

      <div className="text-center">
        <p className="mb-2 text-gray-600 text-sm">Green</p>
        <Loader className="text-green-500" size={24} />
      </div>

      <div className="text-center">
        <p className="mb-2 text-gray-600 text-sm">Purple</p>
        <Loader className="text-purple-500" size={24} />
      </div>

      <div className="text-center">
        <p className="mb-2 text-gray-600 text-sm">Orange</p>
        <Loader className="text-orange-500" size={24} />
      </div>

      <div className="text-center">
        <p className="mb-2 text-gray-600 text-sm">Slow Animation</p>
        <Loader
          className="animate-spin text-blue-500"
          size={24}
          style={{ animationDuration: '3s' }}
        />
      </div>

      <div className="text-center">
        <p className="mb-2 text-gray-600 text-sm">Fast Animation</p>
        <Loader
          className="animate-spin text-red-500"
          size={24}
          style={{ animationDuration: '0.5s' }}
        />
      </div>

      <div className="text-center">
        <p className="mb-2 text-gray-600 text-sm">With Background</p>
        <div className="flex items-center justify-center rounded-lg bg-gray-100 p-3">
          <Loader className="text-gray-700" size={24} />
        </div>
      </div>

      <div className="text-center">
        <p className="mb-2 text-gray-600 text-sm">Dark Background</p>
        <div className="flex items-center justify-center rounded-lg bg-gray-800 p-3">
          <Loader className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
};

export default Example;
