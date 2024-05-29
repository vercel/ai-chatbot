'use client';

import { Input } from '@/components/ui/input';
import { SearchIcon, Spinner } from '@/components/assets/icons';
import { useRouter } from 'next/navigation';
import { useTransition, useEffect, useRef, useState } from 'react';

export function Search(props: { value?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(props.value);
  const [isPending, startTransition] = useTransition();

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     console.log('value', value);
//     if (value === undefined) {
//       return;
//     } else if (value) {
//       params.set('q', value);
//     } else {
//       params.delete('q');
//     }

//     startTransition(() => {
//       // All navigations are transitions automatically
//       // But wrapping this allow us to observe the pending state
//       router.replace(`/?${params.toString()}`);
//     });
//   }, [router, value]);

  return (
    <div className="relative">
      <SearchIcon className="absolute left-2.5 top-3 h-4 w-4 text-gray-500" />
      <Input
        ref={inputRef}
        value={value ?? ''}
        // onInput={(e) => {
        //   setValue(e.currentTarget.value);
        // }}
        spellCheck={false}
        className="w-full bg-white shadow-none appearance-none pl-8"
        placeholder="Search users..."
      />
      {isPending && <Spinner />}
    </div>
  );
}