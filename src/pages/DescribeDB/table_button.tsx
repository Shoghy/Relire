import XButton from "@/components/x_btn";
import styles from "./describedb.module.css";

interface TableButtonProps{
  tableName: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => any
  onXClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => any
}

export default function TableButton({ tableName, onClick, onXClick }: TableButtonProps){
  return (
    <button onClick={onClick} className={styles["tbb-container"]}>
      <h3>{tableName}</h3>
      <div className={styles["table-looking-div"]}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <XButton onClick={(e) => {
        e.stopPropagation();
        if(onXClick){
          onXClick(e);
        }
      }}/>
    </button>
  );
}