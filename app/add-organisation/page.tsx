import { Input } from '@/components/ui/input'
import AddUserLayout from '../add-user/addUserLayout'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function AddOrginzationPage() {
  return (
    <AddUserLayout isAdmin>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Add Organisation</h1>
        <p className="mb-4 text-[14px] text-zinc-500">
          Fill up the organisation details
        </p>
        <div className="input-form max-w-[700px]">
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Your Name"
              className=" w-[350px]"
            />
            <Input
              type="text"
              placeholder="Organisation Name"
              className="w-[350px]"
            />
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="GST Number"
              className=" w-[350px]"
            />
            <Input
              type="text"
              placeholder="Billing Address"
              className="w-[350px]"
            />
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="City"
              className="w-[350px]"
            />
            <Input type="text" placeholder="State" className="w-[350px]" />
            {/* <Input type="text" placeholder="Designation" className='w-[350px]'/> */}
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Website URL"
              className=" w-[350px]"
            />
            <Input
              type="text"
              placeholder="Admin Email ID"
              className="w-[350px]"
            />
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              type="password"
              placeholder="Admin Password"
              className=" w-[350px]"
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              className="w-[350px]"
            />
          </div>

          <div className="mb-4">
            <Textarea
              cols={100}
              placeholder="Policies Content Box (a simple context box where they can put a lot of content just copy paste,
                this content will be kept to make users follow the company policies.)"
              className="w-full min-h-40"
            />
          </div>
          <div className="btn text-right">
            <Button variant="default" className="font-bold">
              Save Organization
            </Button>
          </div>
        </div>
      </div>
    </AddUserLayout>
  )
}
