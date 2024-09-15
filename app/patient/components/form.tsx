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
import { updateProfile } from '../actions/update-profile'
import { useState } from 'react'

const formSchema = z.object({
  birthday: z.string().min(7, {
    message: 'Birthday should be in the form MM/DD/YY.'
  }),
  weight: z.string().min(2, {
    message: 'Weight must be at least 2 characters.'
  }),
  height: z.string().min(2, {
    message: 'Height must be at least 2 characters.'
  })
})

export function ProfileForm() {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      birthday: '01/01/00',
      weight: '150',
      height: '170'
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    await updateProfile({
      birthday: values.birthday,
      weight: values.weight,
      height: values.height
    })
    setSubmitting(false)

    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birthday (MM/DD/YY)</FormLabel>
              <FormControl>
                <Input type="string" placeholder="Enter birthday" {...field} />
              </FormControl>
              <FormDescription>
                This is your birthday in MMDDYY.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (lb)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter weight" {...field} />
              </FormControl>
              <FormDescription>This is your weight value.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height (cm)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter height" {...field} />
              </FormControl>
              <FormDescription>This is your height value.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={submitting} type="submit">
          Submit
        </Button>
      </form>
    </Form>
  )
}
