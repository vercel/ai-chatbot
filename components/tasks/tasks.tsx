
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { auth, EnrichedSession } from 'auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { TodoTask } from '@microsoft/microsoft-graph-types'
import { JSX, SVGProps } from "react";


export default async function Tasks() {

  const session = (await auth()) as EnrichedSession;
  // console.log('Session inside the route ', session);

  if (!session) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  // const { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } = process.env;
  // const clientId = AUTH_GOOGLE_ID;
  // const clientSecret = AUTH_GOOGLE_SECRET;
  const accessToken = session?.accessToken;
  const refreshToken = session?.refreshToken;



  const client = Client.init({
    authProvider: (done) =>
      done(
        null,
        accessToken // WHERE DO WE GET THIS FROM?
      ),
  });
  
    const response = await client
        .api('/me/todo/lists/AAMkADhmYjY3M2VlLTc3YmYtNDJhMy04MjljLTg4NDI0NzQzNjJkMAAuAAAAAAAqiN_iXOf5QJoancmiEuQzAQAVAdL-uyq-SKcP7nACBA3lAAAAO9QQAAA=/tasks')
        .top(5)
        .get();
  
    const tasks: TodoTask[] = await response.value;

      return (
        <div className="bg-background text-foreground rounded-lg shadow-md p-6 w-full max-w-md mx-auto">
          <header className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Tasks</h1>
          </header>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input type="text" placeholder="Add a new task" className="flex-1" />
              <Button>Add</Button>
            </div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between bg-muted rounded-md p-3"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox id={task.id} defaultChecked={task.status === "completed"} />
                    <label
                      htmlFor={task.id}
                      className={`text-sm font-medium ${
                        task.status === "completed" ? 'line-through' : ''
                      }`}
                    >
                      {task.title}
                    </label>
                  </div>
                  <Button variant="ghost" size="icon">
                    <TrashIcon className="w-5 h-5" />
                    <span className="sr-only">Delete task</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    
function TrashIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}


function XIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

