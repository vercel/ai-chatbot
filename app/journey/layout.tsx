import { JourneyProvider } from '@/apps/web/lib/journey/context';

export default function Layout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <JourneyProvider>{children}</JourneyProvider>;
}
