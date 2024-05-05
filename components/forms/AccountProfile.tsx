'use client'

import { createOrUpdateUser } from '@/lib/user.actions'
import { UserValidation } from '@/lib/validations'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { IconSpinner } from '../ui/icons'
import { IUser } from '@/lib/types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

export default function AccountProfile({ user }: { user: IUser }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<z.infer<typeof UserValidation>>({
    resolver: zodResolver(UserValidation),
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      companyName: user.companyName ?? ''
    }
  })

  const onSubmit: SubmitHandler<
    z.infer<typeof UserValidation>
  > = async data => {
    setIsLoading(true)
    try {
      const updatedUser = await createOrUpdateUser({
        ...data,
        id: user.id,
        onboarded: true
      })
      if (updatedUser) {
        router.push('/')
        toast.success('Success.')
      }
    } catch (error: any) {
      toast.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col text-center mb-5">
        <h3 className="font-bold text-[26px] lg:text-[30px] text-light-1">
          Welcome to Augmative
        </h3>
        <p className="text-light-1 text-base">
          Let&apos;s set up your profile.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-8 justify-start"
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="text-light-2 font-semibold">
                  First Name
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    className="bg-dark-3 text-light-1 border border-dark-4 no-focus"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="text-light-2 font-semibold">
                  Last Name
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    className="bg-dark-3 text-light-1 border border-dark-4 no-focus"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="text-light-2 font-semibold">
                  Company Name
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    className="bg-dark-3 text-light-1 border border-dark-4 no-focus"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="bg-light-1 text-dark-2 w-full hover:bg-light-2"
          >
            {isLoading ? <IconSpinner /> : 'Continue'}
          </Button>
        </form>
      </Form>
    </>
  )
}
