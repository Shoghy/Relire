import NavBar from "../../components/NavBar";
import { useNavigate, useParams } from "react-router-dom";
import { GetTables, auth, database, GetDataInTable } from '../../utilities/DBclient';
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

interface IUniqueColumsWithValues {
  type: ColumnType,
  rows: ColumnValue[]
}

export default function CreateTable() {

  const ColumTypeArray = ["string", "int", "float", "bool", "date", "datetime", "enum"];
  const navigate = useNavigate();
  const params = useParams();

  const [dbTables, setdbTables] = useState<[string, Dictionary<IColumn>][]>([]);
  const [columns, setColumns] = useState<IColumn2[]>([]);
  const [tableName, setTableName] = useState<string>("");
  const [
    tablesWithUniqueColumns,
    setTablesWithUniqueColumns
  ] = useState<Dictionary<Dictionary<IUniqueColumsWithValues>>>({});
  const [canForeignKeys, setCanForeignKeys] = useState(false);
  const [errorElement, setErrorElement] = useState<React.JSX.Element>();

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate(LogIn);
        return;
      }
      Start();
    });
  }, [])

  async function Start() {
    let [response, error] = await AsyncAttempter(
      () => GetTables(
        auth.currentUser?.uid as string,
        params.idDB as string
      )
    );

    if (error || !response) {
      DBGetDefaultCath(error, errorElement, setErrorElement, navigate);
      return;
    }

    let tables: Dictionary<Dictionary<IColumn>> = response.val();
    if (!tables) return;
    setdbTables(Object.entries<Dictionary<IColumn>>(tables));
    GetUniqueColumns(tables);
  }

  async function GetUniqueColumns(tables: Dictionary<Dictionary<IColumn>>) {
    let uniqueColumns: Dictionary<Dictionary<IUniqueColumsWithValues>> = {};

    for (let tableName in tables) {
      let table = tables[tableName];

      let [tableRows, getDataError] = await AsyncAttempter(
        () => GetDataInTable(
          auth.currentUser?.uid as string,
          params.idDB as string,
          tableName
        )
      );
      if (getDataError) continue;
      if (!tableRows) continue;

      let columnsInfo: Dictionary<IUniqueColumsWithValues> = {};
      tableRows.forEach((value) => {
        for (let columnName in table) {
          let column = table[columnName];
          if (!column.unique) continue;
          if (columnsInfo[columnName] === undefined) {
            columnsInfo[columnName] = {
              type: column.type,
              rows: []
            }
          }
          columnsInfo[columnName].rows.push(value.child(columnName).val());
        }

      });
      uniqueColumns[tableName] = columnsInfo;
    }
    setCanForeignKeys(Object.keys(uniqueColumns).length > 0);
    setTablesWithUniqueColumns(uniqueColumns);
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

      if (column.type === "bool") tableColums[column.name].unique = false;
      if (uniqueColumnNames.indexOf(column.name.toLowerCase()) > -1) {
        errors.push(`${index}: Repeated column name`)
      } else {
        if(!column.name){
          errors.push(`${index}: Column has no name`);
        }else{
          uniqueColumnNames.push(column.name.toLowerCase());
        }
      }

      if (!column.name) {
        errors.push(`${index}: Column has no name`);
      }

      if (column.useDefault) {
        tableColums[column.name].default = column.default;

        if (!column.default) {
          errors.push(`${index}: Disable default or add a value to default`);
        }
      }

      if (column.type === "int") {
        tableColums[column.name].autoIncrement = column.autoIncrement;
      } else if (column.type === "enum") {
        tableColums[column.name].unique = false;
        tableColums[column.name].enum = GetEnumValues(column.enum);
        if (!column.enum) {
          errors.push(`${index}: You need to add at least one value on enum`);
        }
      }

      if(column.useForeingKey){
        tableColums[column.name].foreingKey = column.foreingKey;
      }
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
    try {
      await update(ref(database, `/${auth.currentUser?.uid}/${params.idDB}/tables/${tableName}`), tableColums)

      setTableName("");
      setColumns([]);

      alert("Table was succesfully created")
    } catch (e) {
      alert("Something went wrong, try again later.")
      return;
    }
  }

  function CanBeUnique(column: IColumn2, index: number) {
    if (column.type === "enum" || column.type === "bool") return <></>;
    return (
      <>
        <div>Unique</div>
        <center>
          <input
            type="checkbox"
            checked={column.unique}
            onChange={(e) => setColumnPropertie(index, "unique", e.target.checked)}
          />
        </center>
      </>
    )
  }

  function CanUseForeignKeys(column: IColumn2, index: number) {
    if (!canForeignKeys) return <></>;

    for (let tableName in tablesWithUniqueColumns) {
      let table = tablesWithUniqueColumns[tableName];
      for (let columnName in table) {
        let dbColumn = table[columnName];
        if (dbColumn.type !== column.type) continue;
        return (
          <>
            <span>Use Foreign Key</span>
            <center>
              <input type="checkbox"
                checked={column.useForeingKey}
                onChange={(e) => setColumnPropertie(index, "useForeingKey", e.target.checked)}
              />
            </center>
          </>
        )
      }
    }

    return <></>;
  }

  function PosiblesForeignKeys(column: IColumn2, index: number){
    if(!column.useForeingKey) return <></>;

    let tablesWithColumns: Dictionary<string[]> = {};
    for (let tableName in tablesWithUniqueColumns) {
      let table = tablesWithUniqueColumns[tableName];

      for (let columnName in table) {
        let dbColumn = table[columnName];
        if(dbColumn.type !== column.type) continue;
  
        if(tableName in tablesWithColumns){
          tablesWithColumns[tableName].push(columnName);
        }else{
          tablesWithColumns[tableName] = [columnName];
        }
      }
    }

    let tablesNames = Object.keys(tablesWithColumns);

    if(tablesNames.length === 0) return <></>;

    if(column.foreingKey.tableName === ""){
      setColumns((currentColumns) => {
        currentColumns[index].foreingKey = {
          tableName: tablesNames[0],
          column: tablesWithColumns[tablesNames[0]][0]
        };
        return [...currentColumns];
      })
    }

    return (
      <>
        <span>ForeignKey Table</span>
        <select
        value={column.foreingKey.tableName}
        onChange={(e) => {
          setColumns((current) => {
            current[index].foreingKey ={
              tableName: e.target.value,
              column: tablesWithColumns[e.target.value][0]
            }
            return [... current]
          });
        }}
        >
          {(() => {
            let options: React.JSX.Element[] = [];
            for(let i = 0; i < tablesNames.length; ++i){
              options.push(
                <option value={tablesNames[i]} key={`${tablesNames[i]}-${i}`}>
                  {tablesNames[i]}
                </option>
              )
            }
            return options;
          })()}
        </select>

        <span>ForeignKey Column</span>
        <select
        value={column.foreingKey.column}
        onChange={(e) => {
          setColumns((current) => {
            current[index].foreingKey ={
              tableName: current[index].foreingKey.tableName,
              column: e.target.value
            }
            return [...current]
          });
        }}
        >
          {(() => {
            if(column.foreingKey.tableName === "") return <option value=""></option>
            let options: React.JSX.Element[] = [];
            let columnsNames = tablesWithColumns[column.foreingKey.tableName];
            for(let i = 0; i < columnsNames.length; ++i){
              options.push(
                <option
                value={columnsNames[i]}
                key={`${column.foreingKey.tableName}-${columnsNames[i]}-${i}`}
                >
                  {columnsNames[i]}
                </option>
              )
            }

            return options
          })()}
        </select>
      </>
    )

  }

  if (errorElement) {
    return errorElement;
  }

  return (
    <>
      <NavBar />
      <label htmlFor="tableName">
        Table Name: <input type="text" name="tableName" value={tableName} onChange={(e) => { setTableName(e.target.value) }} />
      </label>
      <br />
      <br />
      <button className="btn" onClick={AddColumn}>Add Column</button>
      <br />
      <br />
      <button className="btn" onClick={CrearTable}>Crear</button>
      <div className="container">
        {(() => {
          let columnsJSX: React.JSX.Element[] = [];

          columns.forEach((column, index) => {
            columnsJSX.push(
              <div style={{ position: "relative" }} key={index}>
                <button
                  className="remove-columna"
                  onClick={() => {
                    setColumns((currentColumns) => {
                      currentColumns.splice(index, 1);
                      return [...currentColumns];
                    });
                  }}
                >
                  <i className="fa fa-trash" aria-hidden="true"></i>
                </button>
                <div className="columna mask">
                  <span>#</span>
                  <center>{index}</center>
                  <span>Column Name</span>
                  <input
                    type="text"
                    value={column.name}
                    onChange={(e) => setColumnPropertie(index, "name", e.target.value)}
                  />
                  <span>Column Type</span>
                  <select value={column.type} onChange={(e) => {
                    setColumnPropertie(index, "useForeingKey", false);
                    setColumnPropertie(index, "type", e.target.value);
                    setColumnPropertie(index, "default", "");
                  }}>
                    {(() => {
                      let options: React.JSX.Element[] = [];
                      ColumTypeArray.forEach((tipo) => {
                        options.push(<option value={tipo} key={`type-select-${index}-${tipo}`}>{TitleCase(tipo)}</option>)
                      });
                      return options;
                    })()}
                  </select>
                  {column.type === "int" &&
                    <>
                      <span>AutoIncrement</span>
                      <center>
                        <input
                          type="checkbox"
                          checked={column.autoIncrement}
                          onChange={(e) => setColumnPropertie(index, "autoIncrement", e.target.checked)} />
                      </center>
                    </>
                  }
                  {column.type === "enum" &&
                    <>
                      <span>Enum values</span>
                      <input
                        type="text"
                        value={column.enum}
                        onChange={(e) => setColumnPropertie(index, "enum", e.target.value)}
                      />
                    </>}
                  {CanBeUnique(column, index)}
                  <span>Not Null</span>
                  <center>
                    <input type="checkbox"
                      checked={column.notNull}
                      onChange={(e) => setColumnPropertie(index, "notNull", e.target.checked)}
                    />
                  </center>
                  <span>Use Default</span>
                  <center>
                    <input type="checkbox"
                      checked={column.useDefault}
                      onChange={(e) => setColumnPropertie(index, "useDefault", e.target.checked)}
                    />
                  </center>
                  {column.useDefault &&
                    <>
                      <span>Default</span>
                      {(() => {
                        let columnInput = <ColumnInput
                          column={{
                            notNull: true,
                            type: column.type,
                            unique: column.unique,
                            autoIncrement: column.autoIncrement,
                            enum: GetEnumValues(column.enum)
                          }}
                          value={column.default}
                          setValue={(e) => setColumnPropertie(index, "default", e)} />

                        if (column.type === "bool") return <center>{columnInput}</center>
                        return columnInput;
                      })()}
                    </>
                  }
                  {CanUseForeignKeys(column, index)}
                  {PosiblesForeignKeys(column, index)}
                </div>
              </div>
            )
          });

          return columnsJSX;
        })()}
      </div>
    </>
  )
}