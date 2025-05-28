// components/sidebar-search-input.tsx
export function SidebarSearchInput() {
  return (
    <div className="px-1">
      <input
        type="text"
        placeholder="Search Chats"
        className="w-full px-2 py-1.5 text-sm rounded-md border bg-white text-gray-500"
      />
    </div>
  );
}
