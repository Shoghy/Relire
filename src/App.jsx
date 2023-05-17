import { useState } from "react"
import "./styles.css"

export default function App(){
  const [newItem, setNewItem] = useState("");
  const [todos, setTodos] = useState([]);

  function handleSubmit(e){
    e.preventDefault();
    if(newItem === "") return;

    setTodos((currentTodos) => {
      return [...currentTodos, {id: crypto.randomUUID(), title: newItem, completed: false},]
    })
    setNewItem("");
  }
  function deleteTodo(id){
    setTodos(currentTodos => {
      return currentTodos.filter(todo => todo.id !== id);
    });
  }
  function toggleTodo(id, completed){
    setTodos((currentTodos) => {
      return currentTodos.map(todo => {
        if(todo.id === id){
          return {...todo, completed};
        }
        return todo;
      });
    });
  }

  return <>
  <form className="new-item-form" onSubmit={handleSubmit}>
    <div className="form-row">
      <label htmlFor="item">New Item</label>
      <input
      type="text"
      id="item"
      value={newItem}
      onChange={e => setNewItem(e.target.value)}
      />
    </div>
    <button className="btn">Add</button>
  </form>
  <h1>Todo List</h1>
  <ul className="list">
    {(() => {
      let listItem = [];
      if(todos.length === 0){
        return <h3>There are no todos</h3>
      }
      for(let i = 0; i < todos.length; ++i){
        let todo = todos[i];
        listItem.push(<li key={todo.id}>
          <label>
            <input type="checkbox" checked={todo.completed} onChange={e =>toggleTodo(todo.id, e.target.checked)}/>
            {todo.title}
          </label>
          <button className="btn btn-danger" onClick={() => deleteTodo(todo.id)}>Delete</button>
        </li>);
      }
      return listItem;
    })()}
  </ul>
  </>
}
