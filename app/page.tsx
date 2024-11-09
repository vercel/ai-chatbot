import { Button } from '@/components/ui/button';

export default async function Page() {
  return (
    <div className="h-screen flex flex-col">
      <div className="landing mt-4 grow" />
      <div className="text-center p-12">
        <h2 className="mb-4">Find a Workplace Where You Belong</h2>
        <p className="mb-4">
          Aura helps you discover workplaces where you can thrive—not just work.
          Let us guide you in finding companies that match your values, work
          style, and well-being needs.
        </p>
        <Button>Find Your Perfect Fit</Button>
      </div>
    </div>
  );
}
