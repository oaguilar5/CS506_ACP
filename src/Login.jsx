/*!

=========================================================
* Main Login & Sign Up Page
=========================================================

Author: Oscar Aguilar
Resources: sited below

=========================================================


*/
import React from "react";



import firebase from "firebase/app";
import "firebase/firestore";
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import "firebase/auth";

//Reactstrap library (with a few sample components)
//https://reactstrap.github.io/components/
import {  
    Button,
    Col,
    Input,
    Form,
    Label,
    Modal, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Row
} from "reactstrap";

//global component className for parent div
const className= "main-login"
var uiConfig = {
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: '/sample',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: '/terms-of-service',
    // Privacy policy url.
    privacyPolicyUrl: '/privacy-policy'
  };

class MainLogin extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
        modal: false,
        infoMsg: "",
        signUp: false,
        optionText: "Create New Account",
        newEmail: "",
        newPass1: "",
        newPass2: ""
    }
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            //redirect to home page if already logged in
            window.location.href = "/home"
        }
    });
  }

  //set modal to its negated value
  toggleModal = () => {
    this.setState(prevState => {return {modal: !prevState.modal}})
}

  updateLoginOptions = e => {
    e.preventDefault();
      let signUp = this.state.signUp;
      if (signUp) {
        this.setState({signUp: !signUp, optionText: "Create New Account"})
      } else {
        this.setState({signUp: !signUp, optionText: "Login With Your Account"})
      }
      
  }

  handleCreateChange = (evt) => {
    try {
      let obj = evt.target.id;
      let value = evt.target.value;
      this.setState({[obj]: value});
    } catch (err) {
      console.log("Caught exception in handleCreateChange(): " + err)
    }
  }

  createNewUser = async evt => {
    try {
      evt.preventDefault();
      //check to see that the passwords match
      let email = this.state.newEmail;
      //check if email exists
      let userDoc = await firebase.firestore().collection('acp_users').doc(email).get();
      if (!userDoc.exists) {
        let pass1 = this.state.newPass1;
        let pass2 = this.state.newPass2;
        if (pass1 === pass2) {
          //create a new blank user doc
          let newUser = {
            email: email,
            display_name: "",
            profile_pic: "student-user.png",
            alert_settings: {
              alerts_on: true,
              comments: true,
              files: true,
              tasks: true
            }
        }
          firebase.firestore().collection('acp_users').doc(email).set(newUser);
          //create the new user in auth
          firebase.auth().createUserWithEmailAndPassword(email, pass1).catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                let errMsg = error.message;
                console.log("Error creating new user: error code=" + errorCode + ", error=" + errMsg)
              });
        } else {
            this.setState({modal : true, infoMsg: "Passwords do not match!", newPass1: "", newPass2: ""});
        }
      } else {
        this.setState({modal : true, infoMsg: "There is already an account with this email address", newPass1: "", newPass2: ""});
      }
    } catch (err) {
      console.log("Caught exception in createNewUser(): " + err)
    }

    
  }

    render() {
      
      return (
        <>
        <div className={className}>
        <Modal isOpen={this.state.modal} toggle={this.toggleModal}>
            <ModalHeader toggle={this.toggleModal}>Notice</ModalHeader>
            <ModalBody>
                {this.state.infoMsg}
            </ModalBody>
            <ModalFooter>
            <Button 
                className="firebaseui-id-submit firebaseui-button mdl-button mdl-js-button mdl-button--raised mdl-button--colored" 
                onClick={this.toggleModal}
            >
                Ok
            </Button>{' '}
            </ModalFooter>
        </Modal>
          <div className="login-form">
            {/* <div className="login-logo">
              <a href="/login"><img src="/images/logo_1.png" alt="Company Logo" /></a>

            </div> */}
            <div className="login-options">
              <a  href="!#" onClick={e => this.updateLoginOptions(e)}>
                      {this.state.optionText}
                      						
              </a>
              
            </div>

            {!this.state.signUp && 
                <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()}/>
            }
            {this.state.signUp && 
            <div id="firebaseui_container" className="sign-up">
                <div className="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-sign-in">
                    <h1 className="firebaseui-title">Create an Account</h1>
                    <Form onSubmit={this.createNewUser}>
                    <Row>
                        <Col md="8">
                            <Label>Email</Label>
                            
                            <Input 
                                type="email" 
                                name="create-email" 
                                id="newEmail" 
                                required
                                value={this.state.newEmail}
                                onChange={this.handleCreateChange}
                            />
                            
                        </Col>
                    </Row>
                    <Row>
                        <Col md="8">
                        <Label>Password</Label>
                            <Input 
                                type="password" 
                                name="create-pass1" 
                                id="newPass1" 
                                required 
                                value={this.state.newPass1}
                                onChange={this.handleCreateChange}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col md="8">
                        <Label>Re-Type Password</Label>
                            <Input 
                                type="password" 
                                name="create-pass2" 
                                id="newPass2" 
                                required 
                                value={this.state.newPass2}
                                onChange={this.handleCreateChange}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col md="8">
                            <Button 
                                type="submit"
                                size="md" 
                                color="primary" 
                                className="firebaseui-id-submit firebaseui-button mdl-button mdl-js-button mdl-button--raised mdl-button--colored"
                                
                            >
                                Create
                            </Button>
                        </Col>
                    </Row>
                    </Form>
                    <div className="firebaseui-card-footer">
                        <p className="firebaseui-tos firebaseui-tospp-full-message">
                            By continuing, you are indicating that you accept our 
                            <a href="/terms-of-service" className="firebaseui-link firebaseui-tos-link" target="_blank">Terms of Service </a> 
                            and 
                            <a href="/privacy-policy" className="firebaseui-link firebaseui-pp-link" target="_blank"> Privacy Policy</a>.
                        </p>
                    </div> 
                </div>
            </div>
            }
          </div>
        </div>
        </>
      );
    }
  }

  export default MainLogin;