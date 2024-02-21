import NavBar from "@/components/NavBar";
import { ChangeBodyColor } from "@/utilities/functions";
import styles from "./create_table.module.css";
import { selfColumnComponent } from "./column";
import { ColumnType, IForeingKey, ColumnValue } from "@/utilities/types";
import { useEffect } from "react";

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

  useEffect(() => {
    addEventListener("resize", () => CalculateSize());
    CalculateSize();
  }, []);

  function CalculateSize(){
    const container = document.getElementById("container");
    if(!container) return;
    const computedStyles = window.getComputedStyle(container);
    const paddingLeft = parseInt(computedStyles.getPropertyValue("padding-left").replace("px", ""));
    const paddingRight = parseInt(computedStyles.getPropertyValue("padding-right").replace("px", ""));

    const parent = container.parentElement!;
    const maxWidth = parent.clientWidth;
    container.style.width = `${(370 * Math.floor((maxWidth - (paddingLeft + paddingRight))/370))}px`;
  }

  return (
    <>
      <NavBar />
      <div className={styles.background} >
        <div id="container" className={styles.container}>
          <button onClick={() => SelfColumn.AddNewColumn()} className={styles["add-column-btn"]}>
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
          <SelfColumn.ShowColumns/>
        </div>
      </div>
    </>
  );
}