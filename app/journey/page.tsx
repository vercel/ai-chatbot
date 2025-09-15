import { redirect } from 'next/navigation';
import { getPhaseRoute, phases } from '@/apps/web/lib/journey/map';

export default function Page() {
  redirect(getPhaseRoute(phases[0]));
}
