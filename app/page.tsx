
import { getTasks } from "./actions";
import { TodoList } from "../components/tasks/tasks"

export default async function Page() {
  const items = await getTasks();
  return (
    <TodoList tasks={items} />
  );
}
