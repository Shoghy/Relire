import NavBar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
import { auth } from '../../utilities/DBclient';
import { useEffect, useState } from "react"
import { IForeingKey, ColumnType, ColumnDerived } from "../../utilities/types";
import { LogIn } from "../../utilities/PageLocations";
import "./styles.css"

interface IColumn2 {
  name: string,
  type: ColumnDerived,
  notNull: boolean,
  useDefault: boolean,
  default: any,
  unique: boolean,
  useForeingKey: boolean,
  foreingKey: IForeingKey
}

export default function CreateTable() {
  const ColumTypeArray = ColumnType.types;
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