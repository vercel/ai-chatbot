import Link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <div>
      <h1>Page Not Found - 404</h1>
      <Link href="/">Go back to Home</Link>
    </div>
  );
}