import NavBar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
import { auth } from '../../utilities/DBclient';
import { useEffect, useState } from "react"
import { ColumnType, ColumnDerived, Dictionary } from "../../utilities/types";
import { LogIn } from "../../utilities/PageLocations";
import "./styles.css"

interface IColumn2 {
  columnName: string,
  type: ColumnDerived,
  notNull: boolean,
  useDefault: boolean,
  default: any,
  unique: boolean,
  aditionalProperties: Dictionary<any>
}

export default function CreateTable() {
  const ColumnTypeArray = ColumnType.types;
  const navigate = useNavigate();

  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<IColumn2[]>([]);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate(LogIn);
        return;
      }
      Start();
    });
  }, [])

  async function Start() { }

  function AddColumn() {
    setColumns((currentColumns) => {
      let aditionalProperties: Dictionary<any> = {};

      return [... currentColumns,{
        columnName: "",
        type: ColumnTypeArray[0],
        useDefault: false,
        default: "",
        notNull: false,
        unique: false,
        aditionalProperties: aditionalProperties
      }]
    });
  }

  return (
    <>
      <NavBar />
      <label htmlFor="tableName">
        Table Name: <input type="text" name="tableName" value={tableName} onChange={(e) => { setTableName(e.target.value) }} />
      </label>
      <br />
      <br />
      <button className="btn" onClick={() => AddColumn()}>Add Column</button>
      <br />
      <br />
    </>
  )
}