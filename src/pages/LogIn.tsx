import {Formik, Form, Field, ErrorMessage, FormikHelpers} from "formik";
import { useState } from "react";
import { logIn } from "../DBclient"

interface ILogIn{
  email?: string,
  password?: string
}

export default function LogInForm(){
  const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  const [sendedForm, changeSendedForm] = useState(false);

  function validate(values:ILogIn){
    let errors: ILogIn = {};

    //Validar email
    if(values.email === undefined || !values.email.match(validEmailRegex)){
      errors.email = "Add a valid email";
    }
    
    //Validar contraseña
    if(values.password === undefined){
      errors.password = "Debes añadir una contraseña";
    }else if(values.password.length < 6){
      errors.password = "Passwords are at least 6 characters long";
    }

    return errors;
  }

  function onSubmit(values:ILogIn, helpers : FormikHelpers<ILogIn>){
    changeSendedForm(true);
    if(values.email === undefined || values.password === undefined){
      changeSendedForm(false);
      return "";
    }
    logIn(values.email, values.password);
  }

  const initialValues: ILogIn = {email: "", password: ""};
  return <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
    {({errors}) => (
      <Form>
        <Field type="email" name="email" disabled={sendedForm}/>
        <ErrorMessage name="email" component={() => <p>{errors.email}</p>}/>
        <Field type="password" name="password" disabled={sendedForm}/>
        <ErrorMessage name="password" component={() => <p>{errors.password}</p>}/>
      </Form>
    )}
  </Formik>
}