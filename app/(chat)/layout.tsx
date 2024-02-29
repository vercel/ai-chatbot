import Component from '@/components/right-sidebar'
import { SidebarDesktop } from '@/components/sidebar-desktop'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <section className="relative flex h-screen overflow-hidden">
      <SidebarDesktop />
      <div className="group w-full overflow-auto pl-0 animate-in duration-300 ease-in-out peer-[[data-state=open]]:lg:ml-[220px] peer-[[data-state=open]]:xl:ml-[220px]">
        <article className="md:grid grid-cols-16 gap-1 mx-auto">
          <main className="col-start-1 col-end-12 relative">{children}</main>
          <aside className="col-span-5 col-start-12 overflow-y-scroll">
            <Component />
          </aside>
        </article>
      </div>
    </section>
  )
}
