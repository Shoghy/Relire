import { useNavigate, useParams, Link } from "react-router-dom";
import { GetDataInTable, GetTables, auth } from "../../utilities/DBclient";
import { LogIn } from "../../utilities/PageLocations";
import DBGetDefaultCath from "../../utilities/DBGetDefaultCatch";
import { useEffect, useRef, useState } from "react";
import { ColumnType, ColumnValue, Dictionary, IColumn, TableRow } from "../../utilities/types";
import { AsyncAttempter, RandomString } from "../../utilities/functions";
import NavBar from "../../components/NavBar";
import "./styles.css";

export default function DataInTable(){
  const navigate = useNavigate();
  const params = useParams();

  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [columns, setColumns] = useState<React.JSX.Element[]>([<th key="Loading Columns">Loading columns...</th>]);
  const [rows, setRows] = useState<React.JSX.Element[]>([
    <tr key="Loading Rows" className="tr">
      <td>Loading Rows...</td>
    </tr>
  ]);

  const uniqueColums = useRef<string[]>([]);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user === undefined || user === null) {
        navigate(LogIn);
        return;
      }
      Start();
    });
  }, []);

  async function Start(){
    const [tableStructure, tableStrunctureError] = await AsyncAttempter(
      () => GetTables(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName
      )
    );

    if(tableStrunctureError){
      DBGetDefaultCath(tableStrunctureError, errorElement, setErrorElement, navigate);
      return;
    }

    if(!tableStructure){
      setErrorElement(<h1>Something went wrong </h1>);
      return;
    }

    const [tableData, tableDataError] = await AsyncAttempter(
      () => GetDataInTable(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName as string
      )
    );

    if(tableDataError){
      DBGetDefaultCath(
        tableDataError,
        errorElement,
        setErrorElement,
        navigate
      );
      return;
    }

    DBColumnsToJSXColumns(tableStructure.val());
    DBRowsToJSXRows(tableData?.val());
  }

  async function DBColumnsToJSXColumns(dbColumns: Dictionary<IColumn>){
    const JSXColumns: React.JSX.Element[] = [];

    for(const columnName in dbColumns){
      const dbColumn = dbColumns[columnName];
      const toolTip:string[] = [];
      toolTip.push(`Type: ${dbColumn.type}`);
      toolTip.push(`Unique: ${dbColumn.unique}`);
      toolTip.push(`Not-Null: ${dbColumn.notNull}`);

      switch(dbColumn.type){
        case ColumnType.INT:{
          toolTip.push(`Auto-Increment: ${dbColumn.autoIncrement}`);
          break;
        }
        case ColumnType.ENUM:{
          toolTip.push(`Enum: [${dbColumn.enum?.join(", ")}]`);
          break;
        }
      }
      
      if(dbColumn.default !== undefined){
        toolTip.push(`Default: ${dbColumn.default}`);
      }
      const key = RandomString(8);
      JSXColumns.push(<th title={toolTip.join("\n")} key={key}>{columnName}</th>);
    }

    JSXColumns.push(<th title="Delete" key={"deleteTable"}>Delete</th>);
    setColumns(JSXColumns);
  }

  async function DeleteRow(rowUID: string){
    
  }

  async function DBRowsToJSXRows(dbRows: TableRow){
    const JSXRows: React.JSX.Element[] = [];

    for(const rowUID in dbRows){
      const dbRow = dbRows[rowUID];

      const JSXRowValues: React.JSX.Element[] = [];
      for(const columnName in dbRow){
        let columnValue: ColumnValue = "Null";
        if(columnName in dbRow){
          columnValue = `${dbRow[columnName]}`;
        }
        JSXRowValues.push(<td key={`${rowUID}-${columnName}`}>{columnValue}</td>);
      }

      JSXRowValues.push(
        <td key={`Delete-${rowUID}`} style={{color: "#f00"}} onClick={() => DeleteRow(rowUID)}>
          <i className="fa fa-trash" aria-hidden="true"></i>
        </td>
      );
      JSXRows.push(<tr key={`${rowUID}`} className="tr">{JSXRowValues}</tr>);
    }
    setRows(JSXRows);
  }

  if(errorElement){
    return errorElement;
  }

  return (
    <>
      <NavBar />
      <Link to="insert">Insert Data</Link>
      <table id="table" className="mask" cellSpacing="0">
        <thead id="thead">
          <tr>
            {columns}
          </tr>
        </thead>
        <tbody id="tbody">
          {rows}
        </tbody>
      </table>
      <br />
      <br />
    </>
  );
}