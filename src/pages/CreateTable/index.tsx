import NavBar from "../../components/NavBar";
import { useNavigate, useParams } from "react-router-dom";
import { GetTables, auth, database } from "../../utilities/DBclient";
import { ref, update } from "firebase/database"
import { useEffect, useState } from "react"
import { ColumnType, IForeingKey, IColumn, Dictionary, ColumnValue } from "../../utilities/types";
import DBGetDefaultCath from "../../utilities/DBGetDefaultCatch";
import { AsyncAttempter, GetEnumValues, TitleCase } from "../../utilities/functions";
import { LogIn } from "../../utilities/PageLocations";
import ColumnInput from "../../components/ColumnInput";
import "./styles.css"

interface IColumn2 {
  name: string,
  type: ColumnType,
  notNull: boolean,
  default: ColumnValue,
  useDefault: boolean,
  enum: string
  autoIncrement: boolean,
  unique: boolean,
  useForeingKey: boolean,
  foreingKey: IForeingKey
}

export default function CreateTable() {

  const ColumTypeArray = ["string", "int", "float", "bool", "date", "datetime", "enum"];
  const navigate = useNavigate();
  const params = useParams();

  const [dbTables, setdbTables] = useState<[string, Dictionary<IColumn>][]>([]);
  const [columns, setColumns] = useState<IColumn2[]>([]);
  const [tableName, setTableName] = useState<string>("");
  const [errorElement, setErrorElement] = useState<React.JSX.Element>();

  /*Run just once*/
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate(LogIn);
        return;
      }
      start();
    });
  }, [])

  async function start(){
    const idDB = params.idDB as string;
    let [response, error] = await AsyncAttempter(
      () => GetTables(
        auth.currentUser?.uid as string,
        idDB
      )
    );

    if(error || !response){
      DBGetDefaultCath(error, errorElement, setErrorElement, navigate);
      return;
    }

    let tables = response.child("tables").val();
    if(!tables) return;
    setdbTables(Object.entries<Dictionary<IColumn>>(tables));
  }


  function AddColumn() {
    setColumns((currentColumns) => {
      let foreingKey: IForeingKey = { column: "", tableName: "" }
      if (dbTables.length > 0) {
        foreingKey.column = Object.keys(dbTables[0][1])[0];
        foreingKey.tableName = dbTables[0][0];
      }
      return [...currentColumns, {
        name: "",
        type: "string",
        default: "",
        unique: false,
        notNull: false,
        useDefault: false,
        autoIncrement: false,
        enum: "",
        foreingKey: foreingKey,
        useForeingKey: false
      }]
    });
  }

  function setColumnPropertie(index: number, key: string, value: ColumnValue) {
    setColumns((currentColumns: any) => {
      currentColumns[index][key] = value;
      return [...currentColumns];
    });
  }

  async function CrearTable() {
    let errors: string[] = [];

    if (!tableName) {
      errors.push("Table has no name")
    }

    dbTables.forEach((table) => {
      if (table[0].toLowerCase() === tableName.toLowerCase()) {
        errors.push("Ese nombre de tabla ya está siendo utilizado");
        return;
      }
    });

    let tableColums: Dictionary<IColumn> = {};
    let uniqueColumnNames: string[] = [];
    columns.forEach((column, index) => {
      tableColums[column.name] = {
        type: column.type,
        notNull: column.notNull,
        unique: column.unique
      };
      if(column.type === "bool") tableColums[column.name].unique = false;
      if (uniqueColumnNames.indexOf(column.name.toLowerCase()) > -1) {
        errors.push(`${index + 1}: nombre de columna repetido`)
      } else {
        uniqueColumnNames.push(column.name.toLowerCase());
      }

      if (!column.name) {
        errors.push(`${index + 1}: Column has no name`);
      }

      if (column.useDefault) {
        tableColums[column.name].default = column.default;

        if (!column.default) {
          errors.push(`${index + 1}: Disable default or add a value to default`);
        }
      }

      if (column.type === "int") {
        tableColums[column.name].autoIncrement = column.autoIncrement;
      } else if (column.type === "enum") {
        tableColums[column.name].unique = false;
        tableColums[column.name].enum = GetEnumValues(column.enum);
        if (!column.enum) {
          errors.push(`${index + 1}: You need to add at least one value on enum`);
        }
      }

    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
    try{
      await update(ref(database, `/${auth.currentUser?.uid}/${params.idDB}/tables/${tableName}`), tableColums)

      setTableName("");
      setColumns([]);

      alert("Table was succesfully created")
    }catch(e){
      alert("Something went wrong, try again later.")
      return;
    }
  }

  function CanBeUnique(column: IColumn2){
    if(column.type === "enum" || column.type === "bool") return <></>;
    return (
      <>
        <div>Unique</div>
        <input type="checkbox" name="" id="" />
      </>
    )
  }

  if(errorElement){
    return errorElement;
  }

  return (
    <>
      <NavBar />
      <label htmlFor="tableName">
        Table Name: <input type="text" name="tableName" value={tableName} onChange={(e) => { setTableName(e.target.value) }} />
      </label><br />
      <div className="container">
      {(() => {
        let columnsJSX: React.JSX.Element[] = [];

        columns.forEach((column, index) => {
          columnsJSX.push(
            <div className="columna" key={index}>
              <span>#</span>
              <center>{index}</center>
              <span>Column Name</span>
              <input type="text" />
              <span>Column Type</span>
              <select value={column.type} onChange={(e) => {
                setColumnPropertie(index, "type", e.target.value);
                setColumnPropertie(index, "default", "");
              }} key={`type-select-${index}`}>
                {(() => {
                  let options: React.JSX.Element[] = [];
                  ColumTypeArray.forEach((tipo) => {
                    options.push(<option value={tipo} key={`type-select-${index}-${tipo}`}>{TitleCase(tipo)}</option>)
                  });
                  return options;
                })()}
              </select>
              {CanBeUnique(column)}
              <span>Not Null</span>
              <input type="checkbox" name="" id="" />
            </div>
          )
        });

        return columnsJSX;
      })()}
      </div>
      <br />
      <button className="btn" onClick={AddColumn}>Add Column</button>
      <br />
      <br />
      <button className="btn" onClick={CrearTable}>Crear</button>
    </>
  )
}