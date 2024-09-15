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
  gender: z.string().min(0, {
    message: 'Gender should be either M or F.'
  }),
  birthday: z.string().min(8, {
    message: 'Birthday should be in the form MM/DD/YYY.'
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
      gender: 'M',
      birthday: '01/01/2000',
      weight: '150',
      height: '170'
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    await updateProfile({
      gender: values.gender,
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
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender (M/F)</FormLabel>
              <FormControl>
                <Input type="string" placeholder="Enter gender" {...field} />
              </FormControl>
              <FormDescription>This is your gender in M/F.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birthday (MM/DD/YYYY)</FormLabel>
              <FormControl>
                <Input type="string" placeholder="Enter birthday" {...field} />
              </FormControl>
              <FormDescription>
                This is your birthday in MMDDYYYY.
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
