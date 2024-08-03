
import { getTasks } from "../actions";
import { TodoList } from "../../components/tasks/tasks"
import { OptimisticTask } from "../../types";

export default async function Page() {
  const items: OptimisticTask[] = await getTasks();

  return (
    <TodoList tasks={items} />
  );
}
