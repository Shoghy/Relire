import NavBar from "../../components/NavBar";
import { useNavigate, useParams } from "react-router-dom";
import { auth, realtimeDB } from "../../Utilities/DBclient";
import { useEffect, useState } from "react"
import { ColumnType, IForeingKey, IColumn, Dictionary, ColumnValue } from "../../Utilities/types";
import DBGetDefaultCath from "../../Utilities/DBGetDefaultCatch";
import { AsyncAttempter, GetEnumValues, TitleCase } from "../../Utilities/functions";
import { DB, LogIn } from "../../Utilities/PageLocations";
import ColumnInput from "../../components/ColumnInput";

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
  useEffect(() => {(async () => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate(LogIn);
        return;
      }
    });
    let [response, error] = await AsyncAttempter(() => realtimeDB.get(params.idDB as string));

    if(error || !response){
      DBGetDefaultCath(error, errorElement, setErrorElement, navigate);
      return;
    }

    let tables = response.child("tables").val();
    if(!tables) return;
    setdbTables(Object.entries<Dictionary<IColumn>>(tables));
  })()}, [])


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

  function CrearTable() {
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

    realtimeDB.update(`/${params.idDB}/tables/${tableName}`, tableColums);
    navigate(DB(params.idDB as string));
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
      {(() => {
        let columnsJSX: React.JSX.Element[] = [];

        columns.forEach((column, index) => {
          columnsJSX.push(
            <table className="column-table">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Column Name</th>
                  {column.type !== "enum" && column.type !== "bool" && <th>Unique</th>}
                  {column.type === "int" && <th>Auto-Increment</th>}
                  <th>Data-Type</th>
                  {column.type === "enum" && <th>Enum</th>}
                  <th>Not-Null</th>
                  <th>Use Default</th>
                  {column.useDefault && <th>Defualt</th>}
                  {column.useForeingKey && <th>Table</th>}
                  {column.useForeingKey && <th>Column</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>
                    {index + 1}
                  </th>
                  <th>
                    <input type="text" name="name" value={column.name} onChange={(e) => setColumnPropertie(index, "name", e.target.value)} />
                  </th>
                  {column.type !== "enum" && column.type !== "bool" &&
                    <th>
                      <input type="checkbox" name="unique" checked={column.unique} onChange={(e) => setColumnPropertie(index, "unique", e.target.checked)} />
                    </th>
                  }
                  {
                    column.type == "int" && <th>
                      <input
                        type="checkbox"
                        checked={column.autoIncrement}
                        onChange={(e) => setColumnPropertie(index, "autoIncrement", e.target.checked)}
                      />
                    </th>}
                  <th>
                    <select value={column.type} onChange={(e) => {
                      setColumnPropertie(index, "type", e.target.value);
                      setColumnPropertie(index, "default", "");
                    }}>
                      {(() => {
                        let options: React.JSX.Element[] = [];
                        ColumTypeArray.forEach((tipo) => {
                          options.push(<option value={tipo}>{TitleCase(tipo)}</option>)
                        });
                        return options;
                      })()}
                    </select>
                  </th>
                  {column.type == "enum" &&
                    <th>
                      <textarea name="enum" value={column.enum} onChange={(e) => setColumnPropertie(index, "enum", e.target.value)} />
                    </th>
                  }
                  <th>
                    <input
                      type="checkbox"
                      checked={column.notNull}
                      onChange={(e) => setColumnPropertie(index, "notNull", e.target.checked)}
                    />
                  </th>
                  <th>
                    <input
                      type="checkbox"
                      checked={column.useDefault}
                      onChange={(e) => setColumnPropertie(index, "useDefault", e.target.checked)}
                    />
                  </th>
                  {column.useDefault && <th>
                    <ColumnInput
                    column={{
                      notNull: true,
                      type: column.type,
                      unique: column.unique,
                      autoIncrement: column.autoIncrement,
                      enum: GetEnumValues(column.enum)
                    }}
                    value={column.default}
                    setValue={(e) => setColumnPropertie(index, "default", e)}/>
                  </th>}
                  <th>
                    <button className="btn" onClick={() => {
                      setColumns((currentColumns) => {
                        currentColumns.splice(index, 1);
                        return [...currentColumns];
                      });
                    }}>Delete Column</button>
                  </th>
                </tr>
              </tbody>
            </table>
          )
        });

        return columnsJSX;
      })()}
      <br />
      <button className="btn" onClick={AddColumn}>Add Column</button>
      <br />
      <br />
      <button className="btn" onClick={CrearTable}>Crear</button>
    </>
  )
}