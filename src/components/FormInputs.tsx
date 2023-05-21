import React from "react";
import copyProperties from "./copyProperties";

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
    if(!(input instanceof Object)) return false;

    return "state" in input
    && "setState" in input
    && "required" in input
}

const reservedProperties = ["type", "value", "onChange", "required", "state", "setState", "customValidation"];

interface GenericValidationInterface{
    value: string,
    required?:boolean,
    maxLength?:number,
    minLength?:number,
    customValidation?(value:string):ValidateReturn
}
function GenericValidation({
    value,
    required,
    maxLength,
    minLength,
    customValidation}:GenericValidationInterface):ValidateReturn{
    let validation = true;
    let messages: string[] = [];

    if(value === "" || value === undefined){
        if(required) return {validation:false, messages:["This input is required"]};
        return {validation:true, messages:[]};
    }
    if(maxLength != undefined){
        if(value.length > maxLength){
            validation = false;
            messages.push(`You can put a maximun of ${maxLength} character(s)`);
        }
    }
    if(minLength != undefined){
        if(value.length < minLength){
            validation = false;
            messages.push(`You need to put at least ${minLength} character(s)`);
        }
    }
    if(customValidation != undefined){
        let cValidation = customValidation(value);
        if(!cValidation.validation){
            validation = cValidation.validation;
        }
        messages = messages.concat(cValidation.messages);
    }

    return {validation, messages};
}

export class InputText extends React.Component<InputProps<string>>{
    inputProps: React.InputHTMLAttributes<HTMLInputElement> = {};

    render(){
        let props = this.props;

        return <input
            type="text"
            value={props.state.value}
            onChange={(e) => props.setState({value:e.target.value, validate:props.state.validate})}
            required={props.required}
            {...this.inputProps}
        />
    }
    constructor(props:InputProps<string>){
        super(props);
        let self = this;
        function validate(): ValidateReturn{
            let value = self.props.state.value;
            let maxLength = self.props.maxLength;
            let minLength = self.props.minLength;
            let customValidation = self.props.customValidation;
            let required = self.props.required;

            let result = GenericValidation({
                value,
                maxLength:maxLength,
                minLength:minLength,
                required:required,
                customValidation
            })

            return result;
        }
        props.setState({value:props.state.value, validate:validate});

        copyProperties(props, this.inputProps, reservedProperties);
    }
}

export class InputPassword extends InputText{
    render(){
        let props = this.props;

        return <input
        type="password"
        value={props.state.value}
        onChange={(e) => props.setState({value:e.target.value, validate:props.state.validate})}
        required={props.required}
        {...this.inputProps}
        />
    }
}

const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
export class InputEmail extends React.Component<InputProps<string>>{
    inputProps: React.InputHTMLAttributes<HTMLInputElement> = {};

    render(){
        let props = this.props;
        return <input
        type="email"
        value={props.state.value}
        onChange={(e) => props.setState({value:e.target.value, validate:props.state.validate})}
        required={props.required}
        {...this.inputProps}
        />
    }

    constructor(props: InputProps<string>){
        super(props);
        let self = this;

        function validate():ValidateReturn{
            let value = self.props.state.value;
            let maxLength = self.props.maxLength;
            let minLength = self.props.minLength;
            let customValidation = self.props.customValidation;
            let required = self.props.required;

            let result = GenericValidation({
                value,
                maxLength:maxLength,
                minLength:minLength,
                required,
                customValidation
            });

            if(!value.match(validEmailRegex) && value !== ""){
                result.validation = false;
                result.messages.push("Invalid Email");
            }

            return result;
        }

        props.setState({value:props.state.value, validate:validate});

        copyProperties(props, this.inputProps, reservedProperties);
    }
}