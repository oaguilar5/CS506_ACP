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
    Form,
    Table,
    Jumbotron,
    Container
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
            assignments: [],
            query_table_info: []
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
                //update index.js global email
                this.props.updateGlobals(null, email);
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

    checkForAssignments = user => {
        try {
            let assignments = [];
            firebase.firestore().collection('assignments').where('created_by', '==', user).where('is_complete', '==', false).orderBy('create_date', 'desc').get()
                .then(query => {
                    //since forEach is async, keep count and update state once all have been traversed
                    let count = 0;
                    query.forEach(doc => {
                        count++;
                        let title = doc.get('title');
                        let dueDate = doc.get('due_date').toDate().toString();
                        let description = doc.get('description');
                        let status = doc.get('status')
                        let createdBy = doc.get('created_by');
                        let thisObj = {
                            id: doc.id,
                            title: title,
                            dueDate: dueDate,
                            description: description,
                            status: status,
                            createdBy: createdBy
                        };
                        assignments.push(thisObj)
                        if (count >= query.size) {
                            this.setState({ assignments })
                        }
                    })
                });
        } catch (err) {
            console.log("Caught exception in checkForAssignments(): " + err)
        }
    }

    getUserAssignments = () => {
        try {
            let user = this.state.user;
            let query_results = [];
            firebase.firestore().collection("assignments").where('created_by', '==', user).limit(10).get()
                .then(query => {
                    query.forEach(doc => {
                        let thisObj = {
                            id: doc.id,
                            title: doc.get('title'),
                            dueDate: doc.get('due_date').toDate().toString(),
                            description: doc.get('description'),
                            status: doc.get('status'),
                            createdBy: doc.get('created_by'),
                            progress: doc.get('progress'),
                        };
                        query_results.push(thisObj);
                        this.setState({ query_table_info: query_results });
                        console.log(this.state.query_table_info);
                    })
                });
        }
        catch (err) {
            console.log("Caught exception in getUserAssignments(): " + err)
        }
    }

    userLogout = () => {
        firebase.auth().signOut().then(function () {
            console.log("successfully logged out")
        }).catch(function (error) {
            // An error happened.
            console.log("error logging out: " + error)
            this.setState({ modal: true, infoMsg: "Error signing out" });
        });
    }

    render() {
        return (
            <>
                <div>
                    <Navbar color="light" light expand="lg">
                        <div className="logo">
                            <a href="/home"><img src="/images/logo_1.png" alt="ACP" /></a>
                        </div>
                        <NavbarToggler />
                        <Collapse navbar>
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
                <div style={{ textAlign: "center", paddingTop: '5%' }}>
                    <Button color="primary" onClick={this.getUserAssignments}>My Assignments</Button>
                </div>
                <div className="query-table" style={{ paddingTop: "5%", paddingLeft: '5%', paddingRight: '5%' }}>
                    <Jumbotron>
                        <Container fluid style={{ textAlign: "left", paddingBottom: '2%' }}>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Description</th>
                                        <th>Created By</th>
                                        <th>Status</th>
                                        <th>Progress</th>
                                        <th>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...this.state.query_table_info].map(item => (
                                        <tr key={item.id}>
                                            <td scope="row">{item.title}</td>
                                            <td scope="row">{item.description}</td>
                                            <td scope="row">{item.createdBy}</td>
                                            <td scope="row">{item.status}</td>
                                            <td scope="row">{item.progress}</td>
                                            <td scope="row">{item.dueDate}</td>
                                        </tr>
                                    ))}
                                </tbody>

                            </Table>
                        </Container>

                    </Jumbotron>


                </div>
                {/*
                <div style={{ textAlign: "center", paddingTop: '5%' }}>
                    <Form>
                        <input type="text" placeholder="Search" className="mr-sm-2" />
                        <Button color="primary">Search Assignment</Button>
                    </Form>

                </div>
                <div style={{ textAlign: "center", paddingTop: '5%' }}>
                    <Form>
                        <input type="text" placeholder="Search" className="mr-sm-2" />
                        <Button color="primary">Search Student</Button>
                    </Form>

                </div>
                */}
            </>
        );
    }
}

export default Search;
