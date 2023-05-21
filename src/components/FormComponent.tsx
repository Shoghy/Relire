import React from "react";
import { InputCanBeValidated } from "./FormInputs"

interface FormComponentInterface{
    children?: React.ReactElement | React.ReactElement[],
    onValidate?(): any
}

export default function FormComponent({children, onValidate}:FormComponentInterface){
    let inputsList: React.ReactElement[] = [];

    function onSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        if(onValidate !== undefined){
            onValidate();
        }
    }

    function findInputs(inputs: React.ReactElement[]){
        for(let i = 0; i < inputs.length; ++i){
            let input = inputs[i];
    
            if(input === undefined || input.props === undefined) continue;

            if(InputCanBeValidated(input.props)){
                inputsList.push(input);
            }
            if("children" in input.props){
                findInputs(input.props.children);
            }
        }
    }

    if(children != undefined){
        let childrenList: React.ReactElement[] = [];
        childrenList = childrenList.concat(children);
        findInputs(childrenList);
    }

    return <form onSubmit={(e) => onSubmit(e)}>
        {children}
    </form>
}
