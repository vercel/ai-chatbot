import { z } from 'zod'

export const UserValidation = z.object({
  firstName: z.string().min(2, 'First Name is required'),
  lastName: z.string().min(2, 'Last Name is requried'),
  companyName: z.string().min(2, 'Invalid company name')
})
