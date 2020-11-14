import React from 'react';
import { shallow } from 'enzyme';
import Assignment from './../Assignment.jsx';
import firebase from "firebase/app";

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


test('should test Assignment component', () => {
    const updateGlobals = jest.fn();
    const wrapper = shallow(<Assignment assignmentId={"12345"} user={"email@none.com"} updateGlobals={updateGlobals}/>);
    expect(wrapper).toMatchSnapshot();
});