import React from "react";
import { InputCanBeValidated, InputProps, ValidationReturn } from "./FormInputs";
import copyProperties from "./copyProperties";

export interface ValidationResults {
  success: boolean,
  errors: { input: React.ReactElement, results: ValidationReturn }[]
}

interface FormComponentInterface extends React.HTMLAttributes<HTMLFormElement> {
  children?: React.ReactElement | React.ReactElement[],
  onValidation?(results: ValidationResults): any
}

export default function FormComponent(props: FormComponentInterface) {
  let children = props.children;
  let onValidate = props.onValidation;
  let formProperties: React.HTMLAttributes<HTMLFormElement> = {};

  copyProperties(props, formProperties, ["children", "onValidation", "onSubmit"]);

  let inputsList: React.ReactElement[] = [];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let information: ValidationResults = { success: true, errors: [] };

    for (let i = 0; i < inputsList.length; ++i) {
      let input = inputsList[i];
      if (!(input instanceof Object)) continue;

      let props: InputProps<any> = input.props;
      if (!(props instanceof Object)) continue;

      if (props.state.validate === undefined) continue;

      let results = props.state.validate();

      information.errors.push({ input: input, results: results });
      if (!results.validation) information.success = false;
    }

    if (onValidate !== undefined) {
      onValidate(information);
    }
  }

  function findInputs(inputs: React.ReactElement[]) {
    for (let i = 0; i < inputs.length; ++i) {
      let input = inputs[i];

      if (!(input instanceof Object) || !(input instanceof Object)) continue;

      if (InputCanBeValidated(input.props)) {
        inputsList.push(input);
      }
      if ("children" in input.props) {
        findInputs(input.props.children);
      }
    }
  }

  if (children instanceof Object) {
    let childrenList: React.ReactElement[] = [];
    childrenList = childrenList.concat(children);
    findInputs(childrenList);
  }

  return <form onSubmit={(e) => onSubmit(e)}
    {...formProperties}>
    {children}
  </form>
}
