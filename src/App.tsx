import { useState, useEffect } from "react"
import "./styles.css"
import { ToDoListElement } from "./types";
import { ToDoForm } from "./TodoForm";
import { ToDoList } from "./ToDoList";


export default function App(){
  const [todos, setTodos] = useState<ToDoListElement[]>(() => {
    let previousToDos = localStorage.getItem("TODOS");
    if(previousToDos === null) return [];
    return JSON.parse(previousToDos);
  });

  useEffect(() => {
    localStorage.setItem("TODOS", JSON.stringify(todos))
  },
  [todos]);

  function deleteTodo(id: string){
    setTodos(currentTodos => {
      return currentTodos.filter(todo => todo.id !== id);
    });
  }

  function toggleTodo(id:string, completed:boolean){
    setTodos((currentTodos) => {
      return currentTodos.map(todo => {
        if(todo.id === id){
          return {...todo, completed};
        }
        return todo;
      });
    });
  }

  function addToDo(value:string){
    setTodos((currentTodos) => {
      return [...currentTodos, {id: crypto.randomUUID(), title: value, completed: false}]
    })
  }

  return <>
  <ToDoForm addToDo={addToDo}/>
  <h1>Todo List</h1>
  <ToDoList
  todos={todos}
  deleteTodo={deleteTodo}
  toggleTodo={toggleTodo}
  />
  </>
}
