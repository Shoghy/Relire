import React, { ReactNode, useState } from "react";

interface InputState{
    value:string,
    validate():boolean
}
interface InputProps{
    state:InputState | undefined,
    setState:React.Dispatch<React.SetStateAction<InputState | undefined>>
}

export class Zzzzz extends React.Component<InputProps> {
    render(): ReactNode {
        return <h1>Hola mundo</h1>;
    }
    constructor({state, setState}:InputProps){
        super({state, setState});
        setState({value:"", validate:this.validate})
    }
    validate():boolean{
        return true;
    }
}

export default function FormComponent({children}:{children?: React.ReactElement[]}){
    function onSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        if(children === undefined) return;
    }
    const [state, setState] = useState<InputState>();
    let x = <Zzzzz state={state} setState={setState} />
    let xProps: InputProps = x.props;
    console.log(xProps.state?.validate());
    return <form onSubmit={(e) => onSubmit(e)}>
        {x}
        {children}
    </form>
}
