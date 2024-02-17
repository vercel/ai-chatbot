import { Sidebar } from '@/components/sidebar'

// import { auth } from '@/autooh'
import { ChatHistory } from '@/components/chat-history'

export async function SidebarDesktop() {
  // const session = await auth()
  // const sessionData = localStorage.getItem('session');

  // let session = null;
  // // if (!session?.user?.id) {
  // //   return null
  // // }

  // if (sessionData) {
  //   try {
  //     // Parse the session data from string to an object
  //     session = JSON.parse(sessionData);
  //   } catch (error) {
  //     console.error('Error parsing session data', error);
  //     // Handle parsing error (e.g., corrupted data)
  //   }
  // }

  // // If there is no valid session, return null to not render the Sidebar
  // if (!session || !session.user || !session.user.id) {
  //   return null;
  // }

  return (
    <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      {/* @ts-ignore */}
      {/* <ChatHistory userId={session.user.id} /> */}
    </Sidebar>
  )
}
