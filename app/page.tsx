import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import LandingImg from '../public/images/landing.png';

export default async function Page() {
  return (
    <div className="h-screen flex flex-col">
      <div className="landing mt-4">
        <Image
          src={LandingImg}
          alt="Find a Workplace Where You Belong"
          className="w-full"
        />
      </div>
      <div className="text-center p-12">
        <h2 className="mb-4">Find a Workplace Where You Belong</h2>
        <p className="mb-4">
          Aura helps you discover workplaces where you can thrive—not just work.
          Let us guide you in finding companies that match your values, work
          style, and well-being needs.
        </p>
        <Button asChild>
          <Link href="/explore">Find Your Perfect Fit</Link>
        </Button>
      </div>
    </div>
  );
}
