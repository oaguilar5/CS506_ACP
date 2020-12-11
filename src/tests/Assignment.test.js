import React from 'react';
import { shallow } from 'enzyme';
import { render, screen } from '@testing-library/react';
import Assignment from './../Assignment.jsx';
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

test('should test Assignment component', () => {
    const updateGlobals = jest.fn();
    const wrapper = shallow(<Assignment assignmentId={"12345"} user={"email@none.com"} updateGlobals={updateGlobals}/>);
    expect(wrapper).toMatchSnapshot();
});


test('should test Assignment componentDidMount', () => {
  //perform log in
  let email = 'oscar@test.com';
  let password = 'testing123'
  let assignmentId = '12345'
  console.log("Initiating login")
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then((user) => {
    console.log(`successfully logged in as ${user}`)
      //mock func
      const updateGlobals = jest.fn();
      //render the component
      const wrapper = shallow(<Assignment assignmentId={assignmentId} user={email} updateGlobals={updateGlobals}/>);
      const instance = wrapper.instance();
      jest.spyOn(auth, 'onAuthStateChanged')
      jest.spyOn(instance, 'checkForAssignments')
      jest.spyOn(instance, 'selectAssignment')
      instance.componentDidMount();
      expect(auth.onAuthStateChanged).toHaveBeenCalled();
      expect(updateGlobals).toHaveBeenCalled();
      expect(instance.checkForAssignments).toHaveBeenCalled();
      expect(instance.selectAssignment).toHaveBeenCalled();
      expect(wrapper.state.user).toEqual(email);
      expect(wrapper.state.assignmentId).toEqual(assignmentId)
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(`Error logging in. errorCode: ${errorCode}, errorMessage: ${errorMessage}`)
  });

});


test('should test Assignment componentDidUpdate and componentWillUnmount', () => {
  let email = 'oscar@test.com';
  let assignmentId = '12345'
  //mock func
  const updateGlobals = jest.fn();
  let e = {
    history: {
      action: "PUSH"
    }
  }
  //render the component
  const wrapper = shallow(<Assignment assignmentId={assignmentId} user={email} updateGlobals={updateGlobals}/>);
  const instance = wrapper.instance();
  expect(wrapper.ps).toBeUndefined()
  instance.componentDidMount();
  instance.componentDidUpdate(e);

  instance.componentWillUnmount();
  expect(wrapper.find(".perfect-scrollbar-on").length).toEqual(0);
  expect(wrapper.ps).toBeUndefined()
});

//tG51BatlqpLJUj2n5l0I
test('should test Assignment retrieveAssignmentDetails', () => {
  //perform log in
  let email = 'oscar@test.com';
  let password = 'testing123'
  let assignmentId = 'tG51BatlqpLJUj2n5l0I'
  console.log("Initiating login")
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then((user) => {
    console.log(`successfully logged in as ${user}`)
    //mock func
    const updateGlobals = jest.fn();
    //render the component
    const wrapper = shallow(<Assignment assignmentId={assignmentId} user={email} updateGlobals={updateGlobals}/>);
    const instance = wrapper.instance();
    jest.spyOn(instance, 'retrieveAssignmentDetails');
    jest.spyOn(instance, 'retrieveCollaborators');
    instance.componentDidMount();
    expect(instance.retrieveAssignmentDetails).toHaveBeenCalled();
    let ref = firebase.firestore().collection('assignments').doc(assignmentId);
    instance.retrieveAssignmentDetails(assignmentId);
    expect(ref.get).toHaveBeenCalled();
    expect(instance.retrieveCollaborators).toHaveBeenCalled();
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(`Error logging in. errorCode: ${errorCode}, errorMessage: ${errorMessage}`)
  });

});

//tG51BatlqpLJUj2n5l0I
test('should test Assignment retrieveSubtaskDetails', () => {
  //perform log in
  let email = 'oscar@test.com';
  let password = 'testing123'
  let assignmentId = 'tG51BatlqpLJUj2n5l0I'
  let subtaskId = "12345"
  console.log("Initiating login")
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then((user) => {
    console.log(`successfully logged in as ${user}`)
    //mock func
    const updateGlobals = jest.fn();
    //render the component
    const wrapper = shallow(<Assignment assignmentId={assignmentId} user={email} updateGlobals={updateGlobals}/>);
    const instance = wrapper.instance();
    jest.spyOn(instance, 'retrieveSubtaskDetails');
    instance.componentDidMount();
    expect(instance.retrieveSubtaskDetails).toHaveBeenCalled();
    let ref = firebase.firestore().collection('assignments').doc(assignmentId).collection('subtasks').doc(subtaskId);
    instance.retrieveSubtaskDetails(assignmentId);
    expect(ref.get).toHaveBeenCalled();
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(`Error logging in. errorCode: ${errorCode}, errorMessage: ${errorMessage}`)
  });

});