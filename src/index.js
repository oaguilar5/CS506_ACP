
//CORE REACT
import React from 'react';
import ReactDOM from 'react-dom';
import { createBrowserHistory } from "history";
import { Router, Route, Switch, Redirect } from "react-router-dom";



//CSS FILES
import './index.css';
import './assets/css/app.css';
import 'bootstrap/dist/css/bootstrap.min.css';

//ROUTE COMPONENTS
import App from './App.jsx';
import Sample from './Sample.jsx'
import * as serviceWorker from './serviceWorker';

//Firebase Web SDK
import firebase from "firebase/app";
import "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBzz9AcmhUB4jGzFG8icMUuIiWHW2WXzIo",
  authDomain: "cs506-acp.firebaseapp.com",
  databaseURL: "https://cs506-acp.firebaseio.com",
  projectId: "cs506-acp",
  storageBucket: "cs506-acp.appspot.com",
  messagingSenderId: "308127919776",
  appId: "1:308127919776:web:6676bbc8c779620764e3c5",
  measurementId: "G-55EJHMNLPH"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);



const hist = createBrowserHistory();

ReactDOM.render(
  <Router history={hist}>
    <Switch>
      <Route path="/app" render={props => <App {...props}  />} />
      <Route path="/sample" render={props => <Sample {...props}  />} />
      <Redirect from="/" to="/app"/>
    </Switch>
  </Router>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
