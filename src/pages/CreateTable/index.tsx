import NavBar from "../../components/NavBar";
import { useNavigate, useParams } from "react-router-dom";
import { GetTables, auth, GetDataInTable } from "../../utilities/DBclient";
import * as DBclient from "../../utilities/DBclient";
import { useEffect, useState } from "react";
import { ColumnType, IForeingKey, IColumn, Dictionary, ColumnValue, IColumForRequest } from "../../utilities/types";
import DBGetDefaultCath from "../../utilities/DBGetDefaultCatch";
import { AsyncAttempter, GetEnumValues, TitleCase } from "../../utilities/functions";
import { LogIn } from "../../utilities/PageLocations";
import ColumnInput from "../../components/ColumnInput";
import styles from "./styles.module.css";

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
  const ColumTypeArray = Object.values(ColumnType);
  const navigate = useNavigate();
  const params = useParams();

  const [loading, setLoading] = useState(true);
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
  }, []);

  async function Start() {
    const [response, error] = await AsyncAttempter(
      () => GetTables(
        auth.currentUser?.uid as string,
        params.idDB as string
      )
    );

    if (error || !response) {
      DBGetDefaultCath(error, errorElement, setErrorElement, navigate);
      return;
    }

    const tables: Dictionary<Dictionary<IColumn>> = response.val();
    if (!tables){
      setLoading(false);
      return;
    }
    setdbTables(Object.entries<Dictionary<IColumn>>(tables));
    GetUniqueColumns(tables);
  }

  async function GetUniqueColumns(tables: Dictionary<Dictionary<IColumn>>) {
    const uniqueColumns: Dictionary<Dictionary<IUniqueColumsWithValues>> = {};

    for (const tableName in tables) {
      const table = tables[tableName];

      const [tableRows, getDataError] = await AsyncAttempter(
        () => GetDataInTable(
          auth.currentUser?.uid as string,
          params.idDB as string,
          tableName
        )
      );
      if (getDataError) continue;
      if (!tableRows) continue;

      const columnsInfo: Dictionary<IUniqueColumsWithValues> = {};
      let tableHasUnique = false;
      tableRows.forEach((value) => {
        for (const columnName in table) {
          const column = table[columnName];
          if (!column.unique) continue;
          tableHasUnique = true;
          if (columnsInfo[columnName] === undefined) {
            columnsInfo[columnName] = {
              type: column.type,
              rows: []
            };
          }
          columnsInfo[columnName].rows.push(value.child(columnName).val());
        }

      });
      if(tableHasUnique){
        uniqueColumns[tableName] = columnsInfo;
      }
    }
    setCanForeignKeys(Object.keys(uniqueColumns).length > 0);
    setTablesWithUniqueColumns(uniqueColumns);
    setLoading(false);
  }


  function AddColumn() {
    setColumns((currentColumns) => {
      return [...currentColumns, {
        name: "",
        type: ColumnType.STRING,
        default: "",
        unique: false,
        notNull: false,
        useDefault: false,
        autoIncrement: false,
        enum: "",
        foreingKey: { column: "", tableName: "" },
        useForeingKey: false
      }];
    });
  }

  function setColumnPropertie(index: number, key: string, value: ColumnValue) {
    setColumns((currentColumns: any) => {
      currentColumns[index][key] = value;
      return [...currentColumns];
    });
  }

  async function CrearTable() {
    const errors: string[] = [];

    if (!tableName) {
      errors.push("Table has no name");
    }

    dbTables.forEach((table) => {
      if (table[0].toLowerCase() === tableName.toLowerCase()) {
        errors.push("Ese nombre de tabla ya está siendo utilizado");
        return;
      }
    });

    const tableColums: Dictionary<IColumForRequest> = {};

    const uniqueColumnNames: string[] = [];
    columns.forEach((column, index) => {
      tableColums[column.name] = {
        type: column.type,
        notNull: column.notNull,
        unique: column.unique,
        name: column.name
      };

      if(!column.name){
        errors.push(`${index}: Column has no name`);
      }else if (uniqueColumnNames.indexOf(column.name.toLowerCase()) > -1) {
        errors.push(`${index}: Repeated column name`);
      }else{
        uniqueColumnNames.push(column.name.toLowerCase());
      }

      if (column.useDefault && !column.default) {
        errors.push(`${index}: Disable default or add a value to default`);
      }else{
        tableColums[column.name].default = column.default;
      }

      switch(column.type){
        case ColumnType.INT:{
          tableColums[column.name].autoIncrement = column.autoIncrement;
          break;
        }
        case ColumnType.ENUM:{
          if (!column.enum) {
            errors.push(`${index}: You need to add at least one value on enum`);
          }else{
            tableColums[column.name].enum = GetEnumValues(column.enum);
          }
          break;
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
      const response = await DBclient.CreateTable(
        params.idDB as string,
        tableName,
        Object.values(tableColums)
      );
      if(!response.ok){
        throw new Error();
      }
      setTableName("");
      setColumns([]);

      alert("Table was succesfully created");
    } catch (e) {
      alert("Something went wrong, try again later.");
    }
  }

  function CanBeUnique(column: IColumn2, index: number) {
    if (column.type === ColumnType.ENUM || column.type === ColumnType.BOOL) return <></>;
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
    );
  }

  function CanUseForeignKeys(column: IColumn2, index: number) {
    if (!canForeignKeys) return <></>;

    for (const tableName in tablesWithUniqueColumns) {
      const table = tablesWithUniqueColumns[tableName];
      for (const columnName in table) {
        const dbColumn = table[columnName];
        if (dbColumn.type !== column.type) continue;
        return (
          <>
            <span>Use ForeignKey</span>
            <center>
              <input type="checkbox"
                checked={column.useForeingKey}
                onChange={(e) => setColumnPropertie(index, "useForeingKey", e.target.checked)}
              />
            </center>
          </>
        );
      }
    }

    return <></>;
  }

  function PosiblesForeignKeys(column: IColumn2, index: number){
    if(!column.useForeingKey) return <></>;

    const tablesWithColumns: Dictionary<string[]> = {};
    for (const tableName in tablesWithUniqueColumns) {
      const table = tablesWithUniqueColumns[tableName];

      for (const columnName in table) {
        const dbColumn = table[columnName];
        if(dbColumn.type !== column.type) continue;

        if(tableName in tablesWithColumns){
          tablesWithColumns[tableName].push(columnName);
        }else{
          tablesWithColumns[tableName] = [columnName];
        }
      }
    }

    const tablesNames = Object.keys(tablesWithColumns);

    if(column.foreingKey.tableName === ""){
      setColumns((currentColumns) => {
        currentColumns[index].foreingKey = {
          tableName: tablesNames[0],
          column: tablesWithColumns[tablesNames[0]][0]
        };
        return [...currentColumns];
      });
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
              };
              return [... current];
            });
          }}
        >
          {(() => {
            const options: React.JSX.Element[] = [];
            for(let i = 0; i < tablesNames.length; ++i){
              options.push(
                <option value={tablesNames[i]} key={`${tablesNames[i]}-${i}`}>
                  {tablesNames[i]}
                </option>
              );
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
              };
              return [...current];
            });
          }}
        >
          {(() => {
            if(column.foreingKey.tableName === "") return <option value=""></option>;

            const options: React.JSX.Element[] = [];
            const columnsNames = tablesWithColumns[column.foreingKey.tableName];

            if(!columnsNames) return <></>;
            for(let i = 0; i < columnsNames.length; ++i){
              options.push(
                <option
                  value={columnsNames[i]}
                  key={`${column.foreingKey.tableName}-${columnsNames[i]}-${i}`}
                >
                  {columnsNames[i]}
                </option>
              );
            }

            return options;
          })()}
        </select>
      </>
    );

  }

  if (errorElement) {
    return errorElement;
  }

  if(loading) return <h1>Loading...</h1>;

  return (
    <>
      <NavBar />
      <label htmlFor="tableName">
        Table Name: <input type="text" name="tableName" value={tableName} onChange={(e) => { setTableName(e.target.value); }} />
      </label>
      <br />
      <br />
      <button className="btn" onClick={AddColumn}>Add Column</button>
      <br />
      <br />
      <button className="btn" onClick={CrearTable}>Crear</button>
      <div className={styles.container}>
        {(() => {
          const columnsJSX: React.JSX.Element[] = [];

          columns.forEach((column, index) => {
            columnsJSX.push(
              <div style={{ position: "relative" }} key={index}>
                <button
                  className="btn-remove"
                  onClick={() => {
                    setColumns((currentColumns) => {
                      currentColumns.splice(index, 1);
                      return [...currentColumns];
                    });
                  }}
                >
                  <i className="fa fa-trash" aria-hidden="true"></i>
                </button>
                <div className={`${styles.columna} mask`}>
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
                    if(e.target.value === ColumnType.ENUM || e.target.value === ColumnType.BOOL){
                      setColumnPropertie(index, "unique", false);
                    }
                  }}>
                    {(() => {
                      const options: React.JSX.Element[] = [];
                      ColumTypeArray.forEach((tipo) => {
                        options.push(<option value={tipo} key={`type-select-${index}-${tipo}`}>{TitleCase(tipo)}</option>);
                      });
                      return options;
                    })()}
                  </select>
                  {column.type === ColumnType.INT &&
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
                  {column.type === ColumnType.ENUM &&
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
                        const columnInput = <ColumnInput
                          column={{
                            notNull: true,
                            type: column.type,
                            unique: column.unique,
                            autoIncrement: column.autoIncrement,
                            enum: GetEnumValues(column.enum)
                          }}
                          value={column.default}
                          setValue={(e) => setColumnPropertie(index, "default", e)} />;

                        if (column.type === ColumnType.BOOL) return <center>{columnInput}</center>;
                        return columnInput;
                      })()}
                    </>
                  }
                  {CanUseForeignKeys(column, index)}
                  {PosiblesForeignKeys(column, index)}
                </div>
              </div>
            );
          });

          return columnsJSX;
        })()}
      </div>
    </>
  );
}