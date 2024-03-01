import { useState } from "react";
import styles from "./loading_curtain.module.css";

export default function LoadingCurtain(){
  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <div className={styles.loader}/>
      </div>
    </div>
  );
}

export interface SelfLoadingCurtain{
  Element: () => React.JSX.Element
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function selfLoadingCurtain(open: boolean = false){
  const o: SelfLoadingCurtain = {
    Element,
    isOpen: open,
    open: () => {return;},
    close: () => {return;},
    toggle: () => {return;},
    setOpen: () => {return;}
  };

  function Element(){
    const [open, setOpen] = useState(o.isOpen);

    o.isOpen = open;
    o.setOpen = setOpen;
    o.open = () => setOpen(true);
    o.close = () => setOpen(false);
    o.toggle = () => setOpen((c) => !c);

    if(!open) return <></>;

    return (
      <LoadingCurtain/>
    );
  }

  return o;
}