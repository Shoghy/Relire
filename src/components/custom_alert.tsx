import { useState } from "react";
import styles from "./custom_alert.module.css";

interface CustomAlertProperties{
  children?: React.ReactNode
  open?: boolean
}

export default function CustomAlert({children, open = false}: CustomAlertProperties){
  if(!open) return <></>;

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        {children}
      </div>
    </div>
  );
}

export interface SelfCustomAlertElementProps{
  dontShowCloseButton?: boolean
  children?: React.ReactNode
  onXClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => any 
}

export interface SelfCustomAlert{
  Element: (props: SelfCustomAlertElementProps) => React.JSX.Element
  isOpen: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export function selfCustomAlert(open: boolean = false): SelfCustomAlert{
  const o: SelfCustomAlert = {
    Element,
    isOpen: open,
    setOpen: () => {return;},
    toggle: () => {return;},
    open: () => {return;},
    close: () => {return;},
  };

  function Element({dontShowCloseButton = false, children, onXClick}: SelfCustomAlertElementProps){
    const [open, setOpen] = useState(o.isOpen);

    o.setOpen = setOpen;
    o.isOpen;
    o.toggle = () => setOpen((current) => !current);
    o.open = () => setOpen(true);
    o.close = () => setOpen(false);

    function CloseButton(){
      if(dontShowCloseButton) return <></>;
      return (
        <button onClick={(e) => {
          if(onXClick){
            onXClick(e);
          }
          if(e.defaultPrevented) return;
          setOpen(false);
        }} className={`peach-circle ${styles["close-btn"]}`}>
          <i className="fa fa-times" aria-hidden="true"></i>
        </button>
      );
    }

    return (
      <CustomAlert open={open}>
        {children}
        <CloseButton/>
      </CustomAlert>
    );
  }

  return o;
}