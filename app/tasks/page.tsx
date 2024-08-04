import { columns } from "./columns"
import { DataTable } from "./data-table"
import { TodoTask, TodoTaskList } from '@microsoft/microsoft-graph-types'
import { Combobox } from "@/components/combobox";
import { Client } from '@microsoft/microsoft-graph-client';
import { getTasks, getLists } from "../actions";

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
