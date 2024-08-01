import { columns } from "./columns"
import { DataTable } from "./data-table"
import { Client } from '@microsoft/microsoft-graph-client';
import { auth, EnrichedSession } from 'auth';
import { TodoTask } from '@microsoft/microsoft-graph-types'

async function getData(): Promise<TodoTask[]> {
  // Fetch data from your API here.
  const session = (await auth()) as EnrichedSession;
  // console.log('Session inside the route ', session);

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

    return tasks; // Add this line to return the tasks array
}

export default async function Page() {
  const data: TodoTask[] = await getData()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
