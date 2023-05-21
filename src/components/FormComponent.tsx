import React from "react";
import { InputCanBeValidated, InputProps, ValidateReturn } from "./FormInputs";
import copyProperties from "./copyProperties";

interface ValidationResults{
    success:boolean,
    errors:{inputName:string, results:ValidateReturn}[]
}

interface FormComponentInterface extends React.HTMLAttributes<HTMLFormElement>{
    children?: React.ReactElement | React.ReactElement[],
    onValidate?(results: ValidationResults): any
}

export default function FormComponent(props:FormComponentInterface){
    let children = props.children;
    let onValidate = props.onValidate;
    let formProperties:React.HTMLAttributes<HTMLFormElement> = {};

    copyProperties(props, formProperties, ["children", "onValidate", "onSubmit"]);

    let inputsList: React.ReactElement[] = [];

    function onSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();

        let information:ValidationResults = {success:true, errors:[]};

        for(let i = 0; i < inputsList.length; ++i){
            let input = inputsList[i];
            if(!(input instanceof Object)) continue;

            let props: InputProps<any> = input.props;
            if(!(props instanceof Object)) continue;

            let inputName = "";
            if("name" in input.props){
                inputName = input.props.name;
            }

            if(props.state.validate === undefined) continue;

            let results = props.state.validate();
            
            information.errors.push({inputName:inputName, results:results});
            if(!results.validation) information.success = false;
        }
        console.log(information);
        if(onValidate !== undefined){
            onValidate(information);
        }
    }

    function findInputs(inputs: React.ReactElement[]){
        for(let i = 0; i < inputs.length; ++i){
            let input = inputs[i];
    
            if(!(input instanceof Object) || !(input instanceof Object)) continue;

            if(InputCanBeValidated(input.props)){
                inputsList.push(input);
            }
            if("children" in input.props){
                findInputs(input.props.children);
            }
        }
    }

    if(children instanceof Object){
        let childrenList: React.ReactElement[] = [];
        childrenList = childrenList.concat(children);
        findInputs(childrenList);
    }

    return <form onSubmit={(e) => onSubmit(e)}
    {...formProperties}>
        {children}
    </form>
}
