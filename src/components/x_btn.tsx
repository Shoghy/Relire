import styles from "./x_btn.module.css";

export enum XBtnPosition{
  TopRight = "top-right",
  TopLeft = "top-left",
  BottomRight = "bottom-right",
  BottomLeft = "bottom-left"
}

export interface XBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{
  position?: XBtnPosition
}

export default function XButton({
  position = XBtnPosition.TopRight,
  className,
  ...props
}: XBtnProps){
  return (
    <button {...props} className={`peach-circle ${styles["btn-x"]} ${styles[position]} ${className ?? ""}`}>
      <i className="fa fa-times" aria-hidden="true"></i>
    </button>
  );
}