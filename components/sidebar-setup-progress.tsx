// components/sidebar-setup-progress.tsx
export function SidebarSetupProgress() {
  return (
    <div className="p-2 px-2">
      <span className="text-xs text-muted-foreground">Finish setup</span>
      <br />
      <span className="text-black text-sm font-semibold">Next : Upgrade Plan</span>
      <div className="h-1.5 bg-gray-200 rounded overflow-hidden mt-1">
        <div
          className="h-full bg-black transition-all duration-300"
          style={{ width: '60%' }}
        ></div>
      </div>
    </div>
  );
}
