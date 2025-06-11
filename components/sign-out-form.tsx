/**
 * @file components/sign-out-form.tsx
 * @description Форма для выхода пользователя из системы.
 * @version 1.0.1
 * @date 2025-06-07
 * @updated Изменен URL перенаправления после выхода на `/login`.
 */

/** HISTORY:
 * v1.0.1 (2025-06-07): Изменен редирект на `/login` для корректного выхода.
 * v1.0.0 (2025-05-25): Начальная версия.
 */
import Form from 'next/form'

import { signOut } from '@/app/app/(auth)/auth'

export const SignOutForm = () => {
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server'

        await signOut({
          redirectTo: '/login',
        })
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  )
}

// END OF: components/sign-out-form.tsx
