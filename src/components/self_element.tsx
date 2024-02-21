import { useState } from "react";

export enum RenderChildren{
  Above,
  Below
}

export interface SelfElementComponentProps{
  children?: React.ReactNode
  renderChildren?: RenderChildren
}

export interface SelfElement{
  Element: (props: SelfElementComponentProps) => React.JSX.Element
  __element: React.JSX.Element
  setElement: React.Dispatch<React.SetStateAction<React.JSX.Element>>
}

export default function selfElement(element: React.JSX.Element = <></>){
  const o: SelfElement = {
    Element,
    __element: element,
    setElement: () => {return;}
  };

  function Element({children, renderChildren = RenderChildren.Below}: SelfElementComponentProps){
    const [element, setElement] = useState(o.__element);
    o.__element = element;
    o.setElement = setElement;

    if(renderChildren === RenderChildren.Below){
      return (
        <>
          {element}
          {children}
        </>
      );
    }else{
      return (
        <>
          {children}
          {element}
        </>
      );
    }
  }
  return o;
}