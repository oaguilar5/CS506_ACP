import React from 'react';
import './App.css';
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";

//Reactstrap library (with a few sample components)
//https://reactstrap.github.io/components/
import {
  Button,
  Jumbotron,
  Container,
  Nav,
  Navbar
} from "reactstrap";

class Home extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      avatar: "",
      modal: false,
      infoMsg: "",
      buttonColor: "primary",
      currentDoc: "",
      assignment_names: [],
      name: "",
      saveDisabled: true,
    }
  }

  componentDidMount() {
    //initial auth check
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        let email = user.email;
        this.setState({ user: email, isAuthenticated: true })
      } else {
        //redirect to home page
        window.location.href = "/login"
      }
    });

  }

  createUserDoc = (email, displayName) => {
    try {
      //parse name
      let nameArr = displayName.split(" ");
      let first = "";
      let last = "";
      if (nameArr.length > 1) {
        first = nameArr[0];
        last = nameArr[1];
      } else {
        //default
        first = displayName;
      }
      //create a new blank user doc
      let newUser = {
        address_1: "",
        address_2: "",
        email: email,
        first: first,
        last: last,
        phone: 0,
        //profile_pic: "bee-avatar.jpg",
        //hiveInfo: ["inspect", "health", "stores", "prod", "hequip", "loss", "gain"]
      }
      firebase.firestore().collection('users').doc(email).set(newUser);
    } catch (err) {
      console.log("Caught exception in createUserDoc(): " + err)
    }

  }

  render() {
    return (
      <div className="App">
        <div style={{ paddingLeft: '5%', paddingRight: '5%', paddingTop: '5%' }}>
          <Jumbotron>
            <Container fluid style={{ textAlign: "left", paddingBottom: '2%' }}>
              <h1>User Statistics</h1>

            </Container>
            <Container fluid style={{ display: "inline-block", textAlign: "left" }}>
              <h5>Number of Open Assignments</h5>
              <h6>A lot!</h6>
            </Container>
            <Container fluid style={{ display: "inline-block", textAlign: "center" }}>
              <h5>Number of Completed Assignments</h5>
              <h6>A lot!</h6>
            </Container>
            <Container fluid style={{ display: "inline-block", textAlign: "right" }}>
              <h5>Average Collaborators</h5>
              <h6>A lot!</h6>
            </Container>
          </Jumbotron>
        </div>
      </div>
    );
  }
}

export default Home;
