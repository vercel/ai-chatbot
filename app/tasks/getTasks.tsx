import { TodoTask } from '@microsoft/microsoft-graph-types'
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
