import React from "react";

export interface ValidateReturn{
    validation:boolean,
    messages: string[]
}

export interface InputState<T>{
    value:T,
    validate?():ValidateReturn
}

export interface InputProps<T> extends React.InputHTMLAttributes<HTMLInputElement>{
    state:InputState<T>,
    setState:React.Dispatch<React.SetStateAction<InputState<T>>>,
    required:boolean,
    customValidation?(value:T):ValidateReturn
}

export function InputCanBeValidated(input: any): input is InputProps<any>{
    if(input === undefined || input === null) return false;

    return "state" in input
    && "setState" in input
    && "required" in input
}

const reservedProperties = ["type", "value", "onChange", "required", "state", "setState", "customValidation"];

export class InputText extends React.Component<InputProps<string>>{
    rProperties = reservedProperties.concat(["minLength", "maxLength"]);
    inputProps: React.InputHTMLAttributes<HTMLInputElement> = {};

    render(){
        let props = this.props;

        return <input
            type="text"
            value={props.state.value}
            onChange={(e) => props.setState({value:e.target.value, validate:this.validate})}
            required={props.required}
            maxLength={props.maxLength}
            minLength={props.minLength}
            {...this.inputProps}
        />
    }
    constructor(props:InputProps<string>){
        super(props);
        props.setState({value:props.state.value, validate:this.validate});
        
        for(let key in props){
            if(this.rProperties.indexOf(key) > -1) continue;
            this.inputProps[key] = props[key];
        }
    }

    validate():ValidateReturn{
        let value = this.props.state.value;
        let maxLength = this.props.maxLength;
        let minLength = this.props.minLength;
        let customValidation = this.props.customValidation;

        let validation = true;
        let messages: string[] = [];

        if(value === "" || value === undefined){
            if(this.props.required) return {validation:false, messages:["This input is required"]};
            return {validation:true, messages:[]};
        }
        if(maxLength != undefined){
            validation = value.length <= maxLength;
        }
        if(minLength != undefined){
            validation = value.length >= minLength;
        }
        if(customValidation != undefined){
            let cValidation = customValidation(value);
            validation = cValidation.validation;
            messages = messages.concat(cValidation.messages);
        }

        return {validation, messages};
    }
}