'use server';

import { cookies } from 'next/headers';

export async function saveModel(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model', model);
}
