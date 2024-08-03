import { TodoTaskList } from '@microsoft/microsoft-graph-types'
import { Client } from '@microsoft/microsoft-graph-client';
import { auth, EnrichedSession } from 'auth';
  
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