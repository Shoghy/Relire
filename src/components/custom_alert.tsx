import { CSSProperties, useState } from "react";
import styles from "./custom_alert.module.css";
import XButton from "./x_btn";

interface CustomAlertProperties{
  children?: React.ReactNode
  open?: boolean
  className?: string
  style?: CSSProperties
}

export default function CustomAlert({children, open = false, className, style}: CustomAlertProperties){
  if(!open) return <></>;

  return (
    <div className={styles.background}>
      <div
        style={style}
        className={`${styles.container} ${className ?? ""}`}>
        {children}
      </div>
    </div>
  );
}

export interface SelfCustomAlertElementProps extends Omit<CustomAlertProperties, "open">{
  dontShowCloseButton?: boolean
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

  function Element({dontShowCloseButton = false, children, onXClick, ...props}: SelfCustomAlertElementProps){
    const [open, setOpen] = useState(o.isOpen);

    o.setOpen = setOpen;
    o.isOpen = open;
    o.toggle = () => setOpen((current) => !current);
    o.open = () => setOpen(true);
    o.close = () => setOpen(false);

    function CloseButton(){
      if(dontShowCloseButton) return <></>;
      return (
        <XButton onClick={(e) => {
          if(onXClick){
            onXClick(e);
          }
          if(e.defaultPrevented) return;
          setOpen(false);
        }}
        />
      );
    }

    return (
      <CustomAlert open={open} {...props}>
        {children}
        <CloseButton/>
      </CustomAlert>
    );
  }

  return o;
}

export interface SelfDAlertButton{
  text: string
  onClick?: (e: SelfDAlert) => any
}

export interface SelfDAlert{
  Element: (props: SelfDAlertElementProps) => React.JSX.Element

  isOpen: boolean
  title: string
  message?: string
  buttons?: SelfDAlertButton[]

  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  setTitle: React.Dispatch<React.SetStateAction<string>>
  setMessage: React.Dispatch<React.SetStateAction<string | undefined>>
  setButtons:  React.Dispatch<React.SetStateAction<SelfDAlertButton[] | undefined>>

  open: () => void
  close: () => void
  toggle: () => void
  openWith: (props: Omit<SelfDAlertProps, "open">) => void
  openMerge: (props: Omit<SelfDAlertProps, "open">) => void
}

export interface SelfDAlertProps{
  title?: string
  message?: string
  open?: boolean
  buttons?: SelfDAlertButton[]
}

export interface SelfDAlertElementProps{
  onClose?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => any
  showCloseButton?: boolean
}

export function selfDAlert({open = false, title="", ...props}: SelfDAlertProps){
  const o: SelfDAlert = {
    Element,
    isOpen: open,
    title: title,
    setOpen: () => {return;},
    setTitle: () => {return;},
    setMessage: () => {return;},
    setButtons: () => {return;},
    open: () => {return;},
    close: () => {return;},
    toggle: () => {return;},
    openWith: () => {return;},
    openMerge: () => {return;},
    ...props
  };

  function Element({onClose, showCloseButton = true}:SelfDAlertElementProps){
    const [open, setOpen] = useState(o.isOpen);
    const [title, setTitle] = useState(o.title);
    const [message, setMessage] = useState(o.message);
    const [buttons, setButtons] = useState(o.buttons);
    
    o.isOpen = open;
    o.title = title;
    o.message = message;
    o.buttons = buttons;

    o.setOpen = setOpen;
    o.setTitle = setTitle;
    o.setMessage = setMessage;
    o.setButtons = setButtons;

    o.open = () => setOpen(true);
    o.close = () => setOpen(false);
    o.toggle = () => setOpen((c) => !c);
    o.openWith = ({buttons, message, title = ""}) => {
      o.setButtons(buttons);
      o.setMessage(message);
      o.setTitle(title);
    };
    o.openMerge = ({buttons, message, title}) => {
      if(buttons !== undefined){
        setButtons(buttons);
      }
      if(message !== undefined){
        setMessage(message);
      }
      if(title !== undefined){
        setTitle(title);
      }
    };

    function CloseButton(){
      if(!showCloseButton) return <></>;
      return (
        <XButton
          onClick={(e) => {
            if(onClose){
              onClose(e);
            }

            if(e.defaultPrevented) return;

            setOpen(false);
          }}
        />
      );
    }

    return (
      <CustomAlert open={open}>
        <div className={styles["dalert-container"]}>
          <h1>{title}</h1>
          {
            !!message
            &&
            <span
              className={styles["dalert-body"]}
            >
              {message}
            </span>
          }
          <div className={styles["dalert-button-container"]}>
            {
              !!buttons
              &&
              buttons.map(
                (v, i) => (
                  <button
                    className={styles["dalert-button"]}
                    key={i}
                    onClick={() => {
                      if(!v.onClick) return;
                      v.onClick(o);
                    }}
                  >
                    {v.text}
                  </button>
                )
              )
            }
          </div>
        </div>
        <CloseButton/>
      </CustomAlert>
    );
  }

  return o;
}
