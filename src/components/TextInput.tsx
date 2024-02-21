
import { useState } from "react";
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

export type SelfElementProps = Omit<TextInputProps, | "value">;
export interface SelfTextInput{
  Element: (props: SelfElementProps) => React.JSX.Element
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  valueAsDate: Date | null
  valueAsNumber: number
}

export function selfTextInput(value: string = ""){
  const o: SelfTextInput = {
    Element,
    value,
    setValue: () => {return;},
    valueAsDate: null,
    valueAsNumber: NaN
  };

  function Element({onChange, ...props}: SelfElementProps){
    const [value, setValue] = useState(o.value);
    o.value = value;
    o.setValue = setValue;

    return (
      <TextInput
        value={value}
        onChange={(e) => {
          if(onChange){
            onChange(e);
          }

          if(e.defaultPrevented) return;

          setValue(e.currentTarget.value);
          o.valueAsDate = e.currentTarget.valueAsDate;
          o.valueAsNumber = e.currentTarget.valueAsNumber;
        }}
        {...props}
      />
    );
  }

  return o;
}