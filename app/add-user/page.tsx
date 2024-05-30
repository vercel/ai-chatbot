import { Input } from '@/components/ui/input'
import AddUserLayout from './addUserLayout'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function AddUser() {
  return (
    <AddUserLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Add User</h1>
        <p className='mb-4 text-[14px] text-zinc-500'>Fill up the user details</p>
        <div className="input-form max-w-[700px]">
          <div className="flex gap-2 mb-4">
            <Input type="text" placeholder="First Name" className=" w-[350px]" />
            <Input type="text" placeholder="Last Name" className="w-[350px]" />
          </div>
          <div className="flex gap-2 mb-4">
            <Input type="email" placeholder="Email" className=" w-[350px]" />
            <Input
              type="text"
              placeholder="Employee Code"
              className="w-[350px]"
            />
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              type="password"
              placeholder="Password"
              className=" w-[350px]"
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              className="w-[350px]"
            />
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Designation"
              className="w-[350px]"
            />
            <Input type="text" placeholder="Department" className="w-[350px]" />
            {/* <Input type="text" placeholder="Designation" className='w-[350px]'/> */}
          </div>
          <div className="mb-4">
            <Textarea placeholder="Keyword Restrictions(Seperated by commas)" className="w-full" />
          </div>
          <div className='btn text-right'>
            <Button variant="default" className='font-bold'>Save Profile</Button>
          </div>
        </div>
      </div>
    </AddUserLayout>
  )
}
