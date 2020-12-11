import React from 'react';
import { shallow } from 'enzyme';
import { render, screen } from '@testing-library/react';
import Files from './../Files.jsx';
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

test('should test Files component', () => {
    const wrapper = shallow(<Files />);
    expect(wrapper).toMatchSnapshot();
});

test('should test Files componentDidMount', () => {
    let assignmentId = "12345";
    const wrapper = shallow(<Files assignmentId={assignmentId}/>);
    const instance = wrapper.instance();
    jest.spyOn(instance, 'retrieveFiles')
    let ref = firebase.firestore().collection('assignments').doc(assignmentId).collection('files');
    instance.componentDidMount();
    expect(instance.retrieveFiles).toHaveBeenCalled();
});
