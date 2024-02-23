import { ColumnType, IColumn } from "@/utilities/types";
import styles from "./data_in_table.module.css";

export default function EnumarateColumns({columns}: {columns: [string, IColumn][]}){
  const columnElements: React.JSX.Element[] = [];
  for(let i = 0; i < columns.length; ++i){
    const columnName = columns[i][0];
    const columnInfo = columns[i][1];
    const toolTip: string[] = [];
    toolTip.push(`Type: ${columnInfo.type}`);
    toolTip.push(`Unique: ${columnInfo.unique}`);
    toolTip.push(`Not-Null: ${columnInfo.notNull}`);

    switch(columnInfo.type){
      case ColumnType.INT:{
        toolTip.push(`Auto-Increment: ${columnInfo.autoIncrement}`);
        break;
      }
      case ColumnType.ENUM:{
        toolTip.push(`Enum: [${columnInfo.enum?.join(", ")}]`);
        break;
      }
    }

    if(columnInfo.default !== undefined){
      toolTip.push(`Default: ${columnInfo.default}`);
    }

    columnElements.push(
      <th
        key={i}
        title={toolTip.join("\n")}
        className={styles["thead-cell"]}
      >
        {columnName}
      </th>
    );
  }
  columnElements.push(
    <th
      key="delete"
      className={styles["thead-cell"]}
    >
      Delete
    </th>
  );
  return columnElements;
}