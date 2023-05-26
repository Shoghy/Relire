import React from "react";
import copyProperties from "./copyProperties";

export interface ValidationReturn {
  validation: boolean,
  messages: string[]
}

export interface InputState<T> {
  value: T,
  validate?(): ValidationReturn
}

export interface InputProps<T> extends React.InputHTMLAttributes<HTMLInputElement> {
  state: InputState<T>,
  setState: React.Dispatch<React.SetStateAction<InputState<T>>>,
  required: boolean,
  genericValidation?: boolean
  customValidation?(value: T): ValidationReturn
}

export function InputCanBeValidated(input: any): input is InputProps<any> {
  if (!(input instanceof Object)) return false;

  return "state" in input
    && "setState" in input
    && "required" in input
}

const reservedProperties = ["type", "value", "onChange", "required", "state", "setState", "customValidation"];

function GenericTextValidation(props: InputProps<string>): ValidationReturn {
  let value = props.state.value;
  let required = props.required;
  let maxLength = props.maxLength;
  let minLength = props.minLength;

  let validation = true;
  let messages: string[] = [];

  if (value === "" || value === undefined) {
    if (required) return { validation: false, messages: ["This input is required"] };
    return { validation: true, messages: [] };
  }
  if (maxLength != undefined) {
    if (value.length > maxLength) {
      validation = false;
      messages.push(`You can put a maximun of ${maxLength} character(s)`);
    }
  }
  if (minLength != undefined) {
    if (value.length < minLength) {
      validation = false;
      messages.push(`You need to put at least ${minLength} character(s)`);
    }
  }

  return { validation, messages };
}

export class InputText extends React.Component<InputProps<string>>{
  inputProps: React.InputHTMLAttributes<HTMLInputElement> = {};

  render() {
    let props = this.props;

    return <input
      type="text"
      value={props.state.value}
      onChange={(e) => props.setState({ value: e.target.value, validate: props.state.validate })}
      required={props.required}
      {...this.inputProps}
    />
  }
  constructor(props: InputProps<string>) {
    super(props);
    let self = this;

    function validate(): ValidationReturn {
      let customValidation = self.props.customValidation;
      let result: ValidationReturn = { validation: true, messages: [] };

      if (self.props.genericValidation === undefined || self.props.genericValidation) {
        result = GenericTextValidation(self.props)
      }

      if (customValidation !== undefined) {
        let cResult = customValidation(self.props.state.value);
        if (!cResult.validation) {
          result.validation = false;
        }
        result.messages = result.messages.concat(cResult.messages);
      }

      return result;
    }
    props.setState({ value: props.state.value, validate: validate });

    copyProperties(props, this.inputProps, reservedProperties);
  }
}

export class InputPassword extends InputText {
  render() {
    let props = this.props;

    return <input
      type="password"
      value={props.state.value}
      onChange={(e) => props.setState({ value: e.target.value, validate: props.state.validate })}
      required={props.required}
      {...this.inputProps}
    />
  }
}

const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
export class InputEmail extends React.Component<InputProps<string>>{
  inputProps: React.InputHTMLAttributes<HTMLInputElement> = {};

  render() {
    let props = this.props;
    return <input
      type="email"
      value={props.state.value}
      onChange={(e) => props.setState({ value: e.target.value, validate: props.state.validate })}
      required={props.required}
      {...this.inputProps}
    />
  }

  constructor(props: InputProps<string>) {
    super(props);
    let self = this;

    function validate(): ValidationReturn {
      let value = self.props.state.value;
      let customValidation = self.props.customValidation;
      let result: ValidationReturn = { validation: true, messages: [] };

      if (self.props.genericValidation !== undefined || self.props.genericValidation) {
        result = GenericTextValidation(self.props);
      }

      if (!value.match(validEmailRegex) && value !== "") {
        result.validation = false;
        result.messages.push("Invalid Email");
      }

      if (customValidation !== undefined) {
        let cResult = customValidation(props.state.value);
        if (!cResult.validation) {
          result.validation = false;
        }
        result.messages = result.messages.concat(cResult.messages);
      }

      return result;
    }

    props.setState({ value: props.state.value, validate: validate });

    copyProperties(props, this.inputProps, reservedProperties);
  }
}