import React from "react";

export interface ValidateInput{
    validation:boolean,
    messages: string[]
}

export interface InputState<T>{
    value:T,
    validate?():ValidateInput
}
export interface InputProps<T> extends React.InputHTMLAttributes<HTMLInputElement>{
    state:InputState<T>,
    setState:React.Dispatch<React.SetStateAction<InputState<T>>>,
    required:boolean,
    customValidation?(value:T):ValidateInput
}

export function InputCanBeValidated(input: any): input is InputProps<any>{
    if(input === undefined || input === null) return false;

    return "state" in input
    && "setState" in input
    && "required" in input
}

const reservedProperties = ["type", "value", "onChange", "required", "state", "setState", "customValidation"];

export interface InputTextInterface extends InputProps<any>{
    minLength?:number,
    maxLength?:number
}

export class InputText extends React.Component<InputTextInterface>{
    rProperties = reservedProperties.concat(["minLength", "maxLength", "min", "max"]);
    inputProps: React.InputHTMLAttributes<HTMLInputElement> = {};

    render(){
        let props = this.props;

        return <input
            type="text"
            value={props.state.value}
            onChange={(e) => props.setState({value:e.target.value, validate:this.validate})}
            required={props.required}
            max={props.maxLength}
            min={props.maxLength}
            {...this.inputProps}
        />
    }
    constructor(props:InputTextInterface){
        super(props);
        props.setState({value:props.state.value, validate:this.validate});

        let keys =  Object.keys(props);
        
        for(let key in keys){
            let value = keys[key];
            if(this.rProperties.indexOf(value) > -1) continue;
            this.inputProps[value] = props[value];
        }
    }

    validate():ValidateInput{
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