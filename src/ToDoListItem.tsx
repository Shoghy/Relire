import { ToDoListElement } from "./types";

export function ToDoListItem({
  todo,
  toggleTodo,
  deleteTodo
}:{
  todo: ToDoListElement,
  toggleTodo: (id:string, value:boolean) => void,
  deleteTodo: (id:string)=>void
}){
  return (
    <li key={todo.id}>
      <label>
        <input
        type="checkbox"
        checked={todo.completed}
        onChange={e =>toggleTodo(todo.id, e.target.checked)}
        />
        {todo.title}
      </label>
      <button
      className="btn btn-danger"
      onClick={() => deleteTodo(todo.id)}
      >Delete</button>
    </li>
  );
}