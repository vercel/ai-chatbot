import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-6xl text-foreground">404</h1>
        <h2 className="mb-4 font-semibold text-2xl text-foreground">
          This page could not be found.
        </h2>
        <p className="mb-8 text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
          href="/"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
