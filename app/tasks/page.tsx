
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { auth, EnrichedSession } from 'auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { TodoTask } from '@microsoft/microsoft-graph-types'
import { JSX, SVGProps } from "react";


export default async function Tasks() {

  const session = (await auth()) as EnrichedSession;

  if (!session) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

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
        <div>{JSON.stringify(tasks)}</div>
      );
    }

    