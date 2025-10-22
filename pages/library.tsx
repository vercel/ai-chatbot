import { LeftRail } from "@/components/nav/LeftRail";
import { Badge } from "@/components/ui/badge";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { LIBRARY_SEED } from "@/data/library";

export default function LibraryPage() {
  return (
    <div className="flex h-screen">
      <LeftRail />
      <main className="flex min-h-full flex-1 flex-col overflow-auto">
        <div className="mx-auto max-w-6xl p-8">
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-3xl">Library</h1>
            <p className="text-muted-foreground">
              Read-only resource collection
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-semibold">Title</th>
                  <th className="p-4 text-left font-semibold">Type</th>
                  <th className="p-4 text-left font-semibold">Added By</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {LIBRARY_SEED.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index !== LIBRARY_SEED.length - 1 ? "border-b" : ""}
                  >
                    <td className="p-4 font-medium">{item.title}</td>
                    <td className="p-4 text-muted-foreground">{item.type}</td>
                    <td className="p-4 text-muted-foreground">{item.addedBy}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 dark:ring-1 dark:ring-green-500/20 dark:ring-inset">
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-auto"><LegalFooter /></div>
      </main>
    </div>
  );
}
