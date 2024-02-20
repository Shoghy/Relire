import NavBar from "@/components/NavBar";
import { ChangeBodyColor } from "@/utilities/functions";
import styles from "./create_table.module.css";
import { selfColumnComponent } from "./column";
import { ColumnType, IForeingKey, ColumnValue } from "@/utilities/types";

export interface CreateColumnInfo{
  name: string
  type: ColumnType
  notNull: boolean
  default: ColumnValue
  useDefault: boolean
  enum: string
  autoIncrement: boolean
  unique: boolean
  useForeingKey: boolean
  foreingKey: IForeingKey
  key: string
}

const SelfColumn = selfColumnComponent();
SelfColumn.AddNewColumn();
export default function CreateTable() {
  ChangeBodyColor("var(--nyanza)");

  return (
    <>
      <NavBar />
      <div className={styles.background}>
        <div className={styles.container}>
          <button onClick={() => SelfColumn.AddNewColumn()} className={styles["add-column-btn"]}>
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
          <SelfColumn.ShowColumns/>
        </div>
      </div>
    </>
  );
}