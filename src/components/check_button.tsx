import styles from "./check_button.module.css";

export interface CheckButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value">{
  value: boolean
}

export default function CheckButton({value, className = "", style, ...props}: CheckButtonProps){
  return (
    <button
      className={`${styles["check-btn"]} ${className}`}
      style={{
        color: value ? "var(--yellow)" : "var(--dark-green)",
        ...style
      }}
      {...props}
    >
      <i className={`fa ${value ? "fa-check" : "fa-times"}`} aria-hidden="true"></i>
    </button>
  );
}