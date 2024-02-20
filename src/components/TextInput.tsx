
import styles from "./TextInput.module.css";

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>;
export default function TextInput({className = "", ...props}: TextInputProps){
  return (
    <input
      className={`${styles.input} ${className}`}
      {...props}
    />
  );
}