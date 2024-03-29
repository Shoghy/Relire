import { useEffect, useState } from "react";
import { auth } from "@/utilities/DBclient";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, MainPage } from "@/utilities/PageLocations";
import { Formik, Form, ErrorMessage, FormikHelpers, Field } from "formik";
import { AuthError, AuthErrorCodes, createUserWithEmailAndPassword } from "firebase/auth";
import { AsyncAttempter } from "@/utilities/functions";
import NavBar from "@/components/NavBar";
import styles from "./account.module.css";

interface IRegistro {
  email?: string
  password?: string
  confirmPassword?: string
}

export default function RegistroPage() {
  const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const navigate = useNavigate();
  const [sendedForm, changeSendedForm] = useState<boolean>(false);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user !== undefined && user !== null) {
        navigate(MainPage);
      }
    });
  }, []);

  async function onSubmit(values: IRegistro, helpers: FormikHelpers<IRegistro>) {
    changeSendedForm(true);

    if (values.email === undefined || values.password === undefined || values.confirmPassword === undefined) {
      changeSendedForm(false);
      return;
    }

    const creatingUser = createUserWithEmailAndPassword(auth, values.email, values.password);
    const [, creatingUserError] = await AsyncAttempter<AuthError>(() => creatingUser);

    if (!creatingUserError) {
      return;
    }

    if (creatingUserError.code === AuthErrorCodes.EMAIL_EXISTS) {
      helpers.resetForm();
      alert("That email is already in our databse. Please use another one.");
    } else {
      alert("An error ocurr, try again later.");
    }

    changeSendedForm(false);
  }

  function validate(values: IRegistro) {
    const errors: IRegistro = {};

    //Validar email
    if (values.email === undefined || !values.email.match(validEmailRegex)) {
      errors.email = "Add a valid email";
    }

    //Validar contraseña
    if (values.password === undefined) {
      errors.password = "You must add a password";
    } else if (values.password.length < 6) {
      errors.password = "Passwords are at least 6 characters long";
    }

    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords must be equals";
    }

    return errors;
  }

  const initialValues: IRegistro = { email: "", password: "", confirmPassword: "" };

  return (
    <>
      <NavBar/>
      <div className={styles.background}>
        <div className={styles.container}>
          <h1>Register</h1>
          <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
            {({ errors }) => (
              <Form className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="email">e-mail</label>
                  <Field className="input" type="email" name="email" disabled={sendedForm} /><br />
                  <ErrorMessage name="email" component={() => <p>{errors.email}</p>} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="password">password</label>
                  <Field className="input" type="password" name="password" disabled={sendedForm} /><br />
                  <ErrorMessage name="password" component={() => <p>{errors.password}</p>} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="confirmPassword">confirm password</label>
                  <Field className="input" type="password" name="confirmPassword" disabled={sendedForm} /><br />
                  <ErrorMessage name="confirmPassword" component={() => <p>{errors.confirmPassword}</p>} />
                </div>

                <button type="submit" className={`btn ${styles["submit-btn"]}`}>Submit</button>
              </Form>
            )}
          </Formik>
          <span className={styles.footer}>Do you already have an account? <Link to={LogIn}>Log In</Link></span>
        </div>
      </div>
    </>
  );
}