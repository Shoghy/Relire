import { CSSProperties } from "react";
import styles from "./main.module.css";
import XButton from "@/components/x_btn";

export type DBButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  containerClassName?: string
  cotainerStyles?: CSSProperties
  showXButton?: boolean
  onXBtnClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => any
};

export default function DBButton({children, className, containerClassName, cotainerStyles, showXButton = true, onXBtnClick, ...props}:DBButtonProps){
  function ShowXButton(){
    if(!showXButton) return <div></div>;

    return (
      <XButton onClick={onXBtnClick}/>
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
      <ShowXButton />
    </button>
  );
}