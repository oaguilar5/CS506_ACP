import React from 'react';
import './App.css';
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";

import {
    Button,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    Collapse,
    Nav,
    NavItem,
    NavLink,
    DropdownItem,
    UncontrolledDropdown,
    DropdownMenu,
    DropdownToggle,
    Form
} from "reactstrap"

class Search extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            avatar: "",
            user: "",
            modal: false,
            infoMsg: "",
            buttonColor: "primary",
            assignments: []
        }
    }

    componentDidMount() {
        //initial auth check
        firebase.auth().onAuthStateChanged(user => {
          if (user) {
            user.updateProfile({
              photoURL: "student-user.png"
            })
            let email = user.email;
            let profilePic = user.photoURL;
            this.checkForAssignments(email);
            this.setState({ user: email, isAuthenticated: true })
            //DEBUG
            console.log("profile pic: " + profilePic);
            //retrieve profile pic
            if (profilePic === null) {
              //this is a new user created through the firestoreui, create the user doc
              let displayName = user.displayName
              this.createUserDoc(email, displayName);
              profilePic = 'student-user.png';
            } else if (profilePic === "") {
              //default if not set
              profilePic = 'student-user.png'
            }
            firebase.storage().ref(profilePic).getDownloadURL()
              .then(avatar => {
                this.setState({ avatar })
              })
          } else {
            //redirect to home page
            window.location.href = "/login"
          }
        });
    
      }

    render() {
        return (
            <>
                <div>
                    <Navbar color="light" light expand="lg">
                        <NavbarBrand href="/">Unite</NavbarBrand>
                        <NavbarToggler onClick="" />
                        <Collapse isOpen="" navbar>
                            <Nav className="mr-auto" navbar>
                                <NavItem>
                                    <NavLink href="/components/">Home</NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink href="">Assignments</NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink href="">Collaborators</NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink href="/search/">Search</NavLink>
                                </NavItem>
                            </Nav>
                            <div className="account-link">
                                <UncontrolledDropdown>
                                    <DropdownToggle
                                        color="default"
                                        data-toggle="dropdown"
                                        caret
                                    >
                                        <div className="user-photo">
                                            <img alt="..." src={this.state.avatar} />
                                        </div>
                                        <p className="d-lg-none">Log out</p>
                                    </DropdownToggle>
                                    <DropdownMenu className="dropdown-navbar" right tag="ul">
                                        <DropdownItem header >{this.state.user}</DropdownItem>
                                        <DropdownItem divider tag="li" />
                                        <NavLink tag="li" >
                                            <DropdownItem className="nav-item" onClick={this.userLogout}>Log out</DropdownItem>
                                        </NavLink>
                                    </DropdownMenu>
                                </UncontrolledDropdown>
                            </div>
                        </Collapse>
                    </Navbar>
                </div>
                <div style={{ textAlign: "center", paddingTop:'5%' }}>
                    <Form>
                        <input type="text" placeholder="Search" className="mr-sm-2" />
                        <Button color="primary">Search Assignment</Button>
                    </Form>

                </div>
                <div style={{ textAlign: "center", paddingTop:'5%' }}>
                    <Form>
                        <input type="text" placeholder="Search" className="mr-sm-2" />
                        <Button color="primary">Search Student</Button>
                    </Form>
                    
                </div>
            </>
        );
    }
}

export default Search;
