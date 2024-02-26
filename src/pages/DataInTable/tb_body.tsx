import { ColumnValue, Dictionary, IColumn } from "@/utilities/types";
import styles from "./data_in_table.module.css";

export interface EnumarateRowsProps{
  rows: [string, Dictionary<ColumnValue>][]
  columns: [string, IColumn][]
  RemoveRow: (rowUID: string) => any
}

export default function EnumarateRows({rows, columns, RemoveRow}: EnumarateRowsProps){

  const rowElements: React.JSX.Element[] = [];
  for(let i = 0; i < rows.length; ++i){
    const rowUID = rows[i][0];
    const rowInfo = rows[i][1];
    const rowInfoElements: React.JSX.Element[] = [];
    
    for(let j = 0; j < columns.length; ++j){
      const columnName = columns[j][0];
      if(columnName in rowInfo){
        rowInfoElements.push(
          <td key={j} className={styles.tcell}>{rowInfo[columnName]}</td>
        );
      }else{
        rowInfoElements.push(
          <td key={j} className={styles.tcell}>
            <i className="fa fa-times" aria-hidden="true"></i>
          </td>
        );
      }
    }

    rowInfoElements.push(
      <td
        key="delete"
        className={`${styles.tcell} ${styles["tcell-delete"]}`}
        onClick={() => RemoveRow(rowUID)}
      >
        <i className="fa fa-trash" aria-hidden="true"></i>
      </td>
    );

    rowElements.push(<tr key={rowUID} className={styles.trow}>{rowInfoElements}</tr>);
  }
  return rowElements;
}
