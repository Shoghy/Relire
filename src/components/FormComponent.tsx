import React from "react";
import { InputCanBeValidated } from "./FormInputs"

export default function FormComponent({children}:{children?: React.ReactElement | React.ReactElement[]}){
    function onSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        if(children === undefined) return;
        let childrenList: React.ReactElement[] = [];
        childrenList.concat(children);
    }

    if(children instanceof Array){
        console.log(InputCanBeValidated(children[0].props));
    }

    return <form onSubmit={(e) => onSubmit(e)}>
        {children}
    </form>
}
