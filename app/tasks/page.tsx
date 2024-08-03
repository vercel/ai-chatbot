import { columns } from "./columns"
import { DataTable } from "./data-table"
import { TodoTask, TodoTaskList } from '@microsoft/microsoft-graph-types'
import { Combobox } from "@/components/combobox";
import { Client } from '@microsoft/microsoft-graph-client';
import { auth, EnrichedSession } from 'auth';

export async function getTasks(listId: string = "AAMkADhmYjY3M2VlLTc3YmYtNDJhMy04MjljLTg4NDI0NzQzNjJkMAAuAAAAAAAqiN_iXOf5QJoancmiEuQzAQAvfjoW0I9ATp98UxOeiWywAAYJfUG6AAA=") {
    // Fetch data from your API here.
    const session = (await auth()) as EnrichedSession;
    // console.log('Session inside the route ', session);
  
    const accessToken = session?.accessToken;
    // const refreshToken = session?.refreshToken; // Remove this line if refreshToken is not used
  
    const client = Client.init({
      authProvider: (done) =>
        done(
          null,
          accessToken // WHERE DO WE GET THIS FROM?
        ),
    });
    
    const response = await client
      .api(`/me/todo/lists/${listId}/tasks`)
      .top(5)
      .get();
    
    const tasks: TodoTask[] = await response.value;
  
    return tasks
  }

  export async function getLists() {
    // Fetch data from your API here.
    const session = (await auth()) as EnrichedSession;
    // console.log('Session inside the route ', session);
  
    const accessToken = session?.accessToken;
    // const refreshToken = session?.refreshToken; // Remove this line if refreshToken is not used
  
    const client = Client.init({
      authProvider: (done) =>
        done(
          null,
          accessToken // WHERE DO WE GET THIS FROM?
        ),
    });
    
    const response = await client.api('/me/todo/lists').get();
    
    const lists: TodoTaskList[] = await response.value;
  
  return lists
  }


interface Item {
  value: string;
  label: string;
}

export default async function Page() {
  const lists: TodoTaskList[] = await getLists();
  const tasks: TodoTask[] = await getTasks();

  const items: Item[] = lists
    .filter((list): list is TodoTaskList & { id: string, displayName: string } =>
      list.id !== undefined && list.displayName !== undefined)
    .map((list) => ({
      value: list.id,
      label: list.displayName
    }));
  return (
    <>
      <Combobox
        items={items}
        emptyMessage="No lists found"
        searchPlaceholder="Search lists..."
        placeholder="Select a list"
      />
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={tasks} />
      </div>
    </>
  );
}
