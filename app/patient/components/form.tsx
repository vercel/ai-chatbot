'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { updateHeartRate } from '../actions/update-heartreate'
import { useState } from 'react'

const formSchema = z.object({
  heartrate: z.string().min(2, {
    message: 'heartrate must be at least 2 characters.'
  }),
  weight: z.string().min(2, {
    message: 'weight must be at least 2 characters.'
  })
})
export function ProfileForm() {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heartrate: '123',
      weight: '123'
    }
  })

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    await updateHeartRate({ newHeartRate: values.heartrate })
    setSubmitting(false)

    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="heartrate"
          render={({ field }) => (
            <>
              <FormItem>
                <FormLabel>heartrate</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="shadcn" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>weight</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="hello" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            </>
          )}
        />
        <Button disabled={submitting} type="submit">
          Submit
        </Button>
      </form>
    </Form>
  )
}
