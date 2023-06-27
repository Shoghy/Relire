import NavBar from "../components/NavBar";
import { useNavigate, useParams } from "react-router-dom";
import { auth, realtimeDB } from "../DBclient";
import PageLocations from "../components/PageLocations";
import { useState } from "react"
import { ColumnType, IForeingKey, IPageContent, IColumn, Dictionary } from "../Utilities/types";
import DBGetDefaultCath from "../Utilities/DBGetDefaultCatch";
import { TitleCase } from "../Utilities/functions";

interface IColumn2 {
  name: string,
  type: ColumnType,
  notNull: boolean,
  default: string | boolean | number,
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
  let dbTables: [string, Dictionary<IColumn>][] = [];
  const [columns, setColumns] = useState<IColumn2[]>([]);
  const [content, setContent] = useState<IPageContent>({
    element: (<></>),
    todoBien: true
  })

  auth.onAuthStateChanged((user) => {
    if (user === undefined || user === null) {
      navigate(PageLocations.LogIn);
      return;
    }
  });

  realtimeDB.get(params.idDB as string)
    .catch((error) => DBGetDefaultCath(error, content, setContent, navigate))
    .then((value) => {
      if (!(value instanceof Object)) return;
      dbTables = Object.entries<Dictionary<IColumn>>(value.child("tables").val());
    });

  function AddColumn() {
    setColumns((currentColumns) => {
      let foreingKey: IForeingKey = {column:"", tableName:""}
      if(dbTables.length > 0){
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

  function setColumnPropertie(index: number, key: string, value: any) {
    setColumns((currentColumns: any) => {
      currentColumns[index][key] = value;
      return [...currentColumns];
    });
  }

  return (
    <>
      <NavBar />
      {content.todoBien && (
        <>
          <label htmlFor="tableName">
            Table Name: <input type="text" name="tableName" />
          </label><br />
        </>
      )}
      {content.element}
      {content.todoBien && (() => {
        let columnsJSX: React.JSX.Element[] = [];

        columns.forEach((value, index) => {
          columnsJSX.push(
            <table>
              <thead>
                <tr>
                  <th>Column Name</th>
                  {value.type == "int" && <th>Auto-Increment</th>}
                  <th>Data-Type</th>
                  <th>Not-Null</th>
                  <th>Use Default</th>
                  {value.useDefault && <th>Defualt</th>}
                  {dbTables.length > 0 && <th>Use Foreign Key</th>}
                  {value.useForeingKey && <th>Table</th>}
                  {value.useForeingKey && <th>Column</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input type="text" name="name" value={value.name} onChange={(e) => setColumnPropertie(index, "name", e.target.value)} />
                  </td>
                  {
                    value.type == "int" && <td>
                      <input
                        type="checkbox"
                        checked={value.autoIncrement}
                        onChange={(e) => setColumnPropertie(index, "autoIncrement", e.target.checked)}
                      />
                    </td>}
                  <td>
                    <select value={value.type} onChange={(e) => setColumnPropertie(index, "type", e.target.value)}>
                      {(() => {
                        let options: React.JSX.Element[] = [];
                        ColumTypeArray.forEach((tipo) => {
                          options.push(<option value={tipo}>{TitleCase(tipo)}</option>)
                        });
                        return options;
                      })()}
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={value.notNull}
                      onChange={(e) => setColumnPropertie(index, "notNull", e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={value.useDefault}
                      onChange={(e) => setColumnPropertie(index, "useDefault", e.target.checked)}
                    />
                  </td>
                  {value.useDefault && <td>
                    {(() => {
                      let inputType = "";
                      switch (value.type) {
                        case "string": {
                          inputType = "text"
                          break;
                        }
                        case "date": {
                          inputType = "date"
                          break;
                        }
                        case "datetime": {
                          inputType = "datetime-local";
                          break;
                        }
                        case "float":
                        case "int": {
                          inputType = "number";
                          break;
                        }
                        case "bool": {
                          return <input type="checkbox" name="default-value" checked={value.default as boolean} onChange={(e) => setColumnPropertie(index, "default", e.target.checked)} />
                        }
                      }
                      return <input type={inputType} name="default-value" value={value.default as string} onChange={(e) => setColumnPropertie(index, "default", e.target.value)} />
                    })()}
                  </td>}
                  {dbTables.length > 0 &&
                    <td>
                      <input
                        type="checkbox"
                        checked={value.useForeingKey}
                        onChange={(e) => { setColumnPropertie(index, "useForeingKey", e.target.checked) }}
                      />
                    </td>}
                  {value.useForeingKey && <td>

                  </td>}
                </tr>
              </tbody>
            </table>
          )
        });

        return columnsJSX;
      })()}
      {content.todoBien && (
        <button className="btn" onClick={AddColumn}>Add Column</button>
      )}
    </>
  )
}