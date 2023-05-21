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
    if(!(input instanceof Object)) return false;

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
            onChange={(e) => props.setState({value:e.target.value, validate:props.state.validate})}
            required={props.required}
            maxLength={props.maxLength}
            minLength={props.minLength}
            {...this.inputProps}
        />
    }
    constructor(props:InputProps<string>){
        super(props);
        let self = this;
        function validate(){
            let value = self.props.state.value;
            let maxLength = self.props.maxLength;
            let minLength = self.props.minLength;
            let customValidation = self.props.customValidation;

            let validation = true;
            let messages: string[] = [];

            if(value === "" || value === undefined){
                if(self.props.required) return {validation:false, messages:["This input is required"]};
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
                    messages.push(`You need to put at least ${maxLength} character(s)`);
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
        props.setState({value:props.state.value, validate:validate});
        
        for(let key in props){
            if(this.rProperties.indexOf(key) > -1) continue;
            this.inputProps[key] = props[key];
        }
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
        maxLength={props.maxLength}
        minLength={props.minLength}
        {...this.inputProps}
        />
    }
}