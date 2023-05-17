import { ToDoListItem } from "./ToDoListItem";
import { ToDoListElement } from "./types";

export function ToDoList({
  todos,
  toggleTodo,
  deleteTodo
}: {
  "todos":ToDoListElement[],
  "toggleTodo": (id:string, value:boolean)=>void,
  "deleteTodo": (id:string) => void
}){
  return (
    <ul className="list">
    {(() => {
      let listItem = [];
      if(todos.length === 0){
        return <h3>There are no ToDos</h3>
      }
      for(let i = 0; i < todos.length; ++i){
        let todo = todos[i];
        listItem.push(
          <ToDoListItem
          todo={todo}
          key={todo.id}
          toggleTodo={toggleTodo}
          deleteTodo={deleteTodo}
          />
        );
      }
      return listItem;
    })()}
  </ul>
  );
}