'use server';

import { cookies } from 'next/headers';

export async function saveModel(model: string) {
  const cookieStore = cookies();
  cookieStore.set('model', model);
}
