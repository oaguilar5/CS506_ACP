
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
import Login from './Login.jsx'
import Home from './Home.jsx'
import Assignment from './Assignment.jsx'
import TOS from './TOS.jsx'
import PP from './PP.jsx'
import Search from './Search.jsx'
import Profile from './Profile.jsx'

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

//GLOBAL PROPS
var assignmentId;
var user;
var profileView;

//function to update our global props
function updateGlobals (id, email, view) {
  if (id !== null) assignmentId = id;
  if (email !== null) user = email;
  if (view !== null) profileView = view;
  //notify({alert_position: "tr", alert_type: "info", alert_message: "Hi there!", alert_icon: "/images/notify.png", alert_duration: 5})
}



ReactDOM.render(
    
    <Router history={hist}>
    <Switch>
      <Route path="/login" render={props => <Login {...props}  />} />
      <Route path="/home" render={props => <Home {...props} updateGlobals={updateGlobals}  />} />
      <Route path="/terms-of-service" render={props => <TOS {...props}/>}/>
      <Route path="/privacy-policy" render={props => <PP {...props}/>}/>
      <Route path="/assignment" render={props => <Assignment {...props} assignmentId={assignmentId} user={user} updateGlobals={updateGlobals}  />} />
      <Route path="/search" render={props => <Search {...props} updateGlobals={updateGlobals}/>}/>
      <Route path="/profile" render={props => <Profile {...props} view={profileView} updateGlobals={updateGlobals} />}/>
      <Redirect from="/" to="/login"/>
    </Switch>
  </Router>
  ,
  document.getElementById("root") || document.createElement('div')
);



// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
//serviceWorker.unregister();


