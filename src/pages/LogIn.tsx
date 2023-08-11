import {Formik, Form, Field, ErrorMessage, FormikHelpers} from "formik";
import { useState } from "react";
import { auth } from "../utilities/DBclient";
import { AuthErrorCodes } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { MainPage } from "../utilities/PageLocations";

interface ILogIn{
  email?: string,
  password?: string
}

export default function LogInForm(){
  const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const navigate = useNavigate();

  auth.onAuthStateChanged((user) => {
    if(user !== undefined && user !== null){
      navigate(MainPage);
    }
  });

  const [sendedForm, changeSendedForm] = useState<boolean>(false);
  const [authError, changeAuthError] = useState<string>();

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
    changeAuthError(undefined);

    if(values.email === undefined || values.password === undefined){
      changeSendedForm(false);
      return;
    }

    logIn(values.email, values.password)
    .catch((error) => {
      const errorCode = error.code;

      switch(errorCode){
        case AuthErrorCodes.USER_DELETED:{
          changeAuthError("User don't exist");
          helpers.resetForm();
          break;
        }case AuthErrorCodes.INVALID_PASSWORD:{
          changeAuthError("Constraseña incorrecta");
          helpers.setFieldValue("email", "", false);
          break;
        }
        default:{
          changeAuthError("Something went wrong");
          break;
        }
      }
    })
    .finally(() => {
      changeSendedForm(false);
    });
  }

  const initialValues: ILogIn = {email: "", password: ""};
  return <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
    {({errors}) => (
      <Form>
        {authError && <p>{authError}</p>}
        <Field type="email" name="email" disabled={sendedForm}/><br/>
        <ErrorMessage name="email" component={() => <p>{errors.email}</p>}/>
        <Field type="password" name="password" disabled={sendedForm}/><br/>
        <ErrorMessage name="password" component={() => <p>{errors.password}</p>}/>
        <button type="submit">Submit</button>
      </Form>
    )}
  </Formik>
}