import { CSSProperties } from "react";
import styles from "./main.module.css";

export type DBButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  containerClassName?: string
  cotainerStyles?: CSSProperties
  showXButton?: boolean
  onXBtnClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => any
};

export default function DBButton({children, className, containerClassName, cotainerStyles, showXButton = true, onXBtnClick, ...props}:DBButtonProps){
  function XButton(){
    if(!showXButton) return <div></div>;

    return (
      <div onClick={onXBtnClick} className={`peach-circle ${styles["db-x-btn"]}`}>
        <i className="fa fa-times" aria-hidden="true"></i>
      </div>
    );
  }

  return (
    <button {...props} className={`${styles["dbb-background"]} ${className ?? ""}`}>
      <div
        style={cotainerStyles}
        className={`${styles["dbb-container"]} ${containerClassName ?? ""}`}
      >
        {children}
      </div>
      <XButton />
    </button>
  );
}