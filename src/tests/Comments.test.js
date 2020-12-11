import React from 'react';
import { shallow } from 'enzyme';
import { render, screen } from '@testing-library/react';
import Comments from './../Comments.jsx';
import firebase from "firebase/app";
import "firebase/firestore";

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
  const auth = firebase.auth();
// Firebase previously initialized using firebase.initializeApp().
if (location.hostname === "localhost") {
  auth.useEmulator('http://localhost:9099/');
  firebase.firestore().useEmulator("localhost", 8080);
}

test('should test Comments component', () => {
    const wrapper = shallow(<Comments />);
    expect(wrapper).toMatchSnapshot();
});

test('should test Comments componentDidMount', () => {
    const wrapper = shallow(<Comments assignmentId={"12345"}/>);
    const instance = wrapper.instance();
    jest.spyOn(instance, 'retrieveComments')
    instance.componentDidMount();
    expect(instance.retrieveComments).toHaveBeenCalled();
});

test('should test Comments componentDidMount attempt to authenticate', () => {
    //perform log in
  let email = 'oscar@test.com';
  let password = 'testing123'
  console.log("Initiating login")
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then((user) => {
    console.log(`successfully logged in as ${user}`)
    const wrapper = shallow(<Comments />);
    const instance = wrapper.instance();
    instance.componentDidMount();
    let ref = firebase.firestore().collection('acp_users').doc(email);
    jest.spyOn(instance, 'retrieveComments')
    expect(auth.onAuthStateChanged).toHaveBeenCalled();
    expect(ref.get).toHaveBeenCalled();
    expect(instance.retrieveComments).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalled();
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(`Error logging in. errorCode: ${errorCode}, errorMessage: ${errorMessage}`)
  });
    
});