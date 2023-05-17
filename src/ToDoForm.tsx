import { useState } from "react"

export function ToDoForm(props:{"addToDo":(value:string)=>void}){
  const [newItem, setNewItem] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(newItem === "") return;

    props.addToDo(newItem);

    setNewItem("");
  }
  return <form className="new-item-form" onSubmit={handleSubmit}>
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
}