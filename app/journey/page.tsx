import { redirect } from 'next/navigation';
import { phases } from '@/apps/web/lib/journey/map';

export default function Page() {
  redirect(`/journey/${phases[0]}`);
}
