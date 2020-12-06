import React from 'react';
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
    Container,
    FormGroup,
    Label,
    Input,
    Card,
    CardBody,
    CardHeader,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
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
            query_table_info: [],
            custom_title: "",
            custom_date: "",
            custom_progress: "",
            custom_user: "",
            custom_status: "",
            collab_assignment_id: ""
        }
    }

    componentDidMount() {
        //initial auth check
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
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
                    })
                });
        }
        catch (err) {
            console.log("Caught exception in getUserAssignments(): " + err)
        }
    }

    toggleModal = () => {
        this.setState(prevState => { return { modal: !prevState.modal } })
    }

    requestCollab = () => {
        try {
            let assignmentId = this.state.collab_assignment_id
            let thisUser = this.state.user
            let docRef = firebase.firestore().collection('assignments').doc(assignmentId);
            console.log(assignmentId)
            //check to see if the assignment already has max # of collaborators
            firebase.firestore().collection('assignments').doc(assignmentId).get()
                .then(doc => {
                    let creator = doc.get('created_by')
                    if (thisUser !== creator) {
                        let collaborators = doc.get('collaborators');
                        if (collaborators.length < 10) {
                            if (!doc.get('is_complete')) {
                                //create new request under this assignment
                                let requestBody = {
                                    request_date: new Date(),
                                    requestor: thisUser,
                                    ack: false,
                                    accepted: false
                                }
                                docRef.collection('requests').add(requestBody)
                                    .then(() => {
                                        this.setState({ modal: true, infoMsg: "Requested to be added as a collaborator!" })
                                        //generate a success message to the user through your modal
                                });
                            } else {
                                this.setState({ modal: true, infoMsg: "Assignment has already been completed." })
                            }
                        } else {
                            this.setState({ modal: true, infoMsg: "Assignment already has max number of collaborators." })
                            //use your modal to present a msg to the user to let them know
                            //that max collaborators has been reached for this assignment
                        }
                    } else {
                        this.setState({ modal: true, infoMsg: "You already have access to this assignment." })
                    }
                });
        }
        catch (err) {
            console.log("Caught exception in requestCollab(): " + err)
        }
    }

    customSearch = () => {
        try {
            let user = this.state.custom_user
            let progress = this.state.custom_progress
            let status = this.state.custom_status
            let title = this.state.custom_title
            let date = this.state.custom_date

            let query_results = [];
            let query = firebase.firestore().collection("assignments")

            if (user != "") {
                query = query.where('created_by', '==', user)
            }
            if (progress != "") {
                query = query.where('progress', '==', progress)
            }
            if (status != "") {
                query = query.where('status', '==', status)
            }
            if (title != "") {
                query = query.where('title', '==', title)
            }

            query.get().then(q => {
                q.forEach(doc => {
                    let thisObj = {
                        id: doc.id,
                        title: doc.get('title'),
                        dueDate: doc.get('due_date').toDate().toString(),
                        description: doc.get('description'),
                        status: doc.get('status'),
                        createdBy: doc.get('created_by'),
                        progress: doc.get('progress'),
                    };

                    if (date != "") {
                        if (Date.parse(doc.get('due_date').toDate()) <= Date.parse(date)) {
                            query_results.push(thisObj);
                        }
                    }
                    else {
                        query_results.push(thisObj);
                    }
                })
                this.setState({ query_table_info: query_results });
            });

        }
        catch (err) {
            console.log("Caught exception in customSearch(): " + err)
        }
    }

    inputOnChange = evt => {
        var value = evt.target.value;
        try {
            let dataType = evt.target.type;
            //sanitize the value if number type
            if (dataType === 'number')
                value = parseInt(value);

            let id = evt.target.id;
            this.setState({ [id]: value })
        } catch (err) {
            console.log("Caught exception in inputOnChange(): " + err)
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
                <Modal isOpen={this.state.modal} toggle={this.toggleModal}>
                    <ModalHeader toggle={() => this.toggleModal('infoModal')}>Notice</ModalHeader>
                    <ModalBody>
                        {this.state.infoMsg}
                    </ModalBody>
                    <ModalFooter>
                        <Button color={this.state.buttonColor} onClick={() => this.toggleModal('infoModal')}>Ok</Button>{' '}
                    </ModalFooter>
                </Modal>
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
                                    <NavLink href="/home/">Assignments</NavLink>
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
                    <Button color="primary" onClick={this.getUserAssignments}>Show My Assignments</Button>
                </div>
                <div style={{ textAlign: "center", paddingTop: '5%' }}>
                    <Button color="primary" onClick={this.requestCollab}>Request To Collaborate (Select Assignment First)</Button>
                </div>
                <Card className="sample-card">
                    <CardHeader>Custom Search</CardHeader>
                    <CardBody className="add-scrollbar">
                        <h5>User</h5>
                        <Input type="text" id="custom_user" placeholder="me2@me.com" onChange={this.inputOnChange}></Input>
                        <h5>Title</h5>
                        <Input type="text" id="custom_title" placeholder="Assignment" onChange={this.inputOnChange}></Input>
                        <h5>Status</h5>
                        <Input type="text" id="custom_status" placeholder="Pending" onChange={this.inputOnChange}></Input>
                        <h5>Progress</h5>
                        <Input type="text" id="custom_progress" placeholder="0" onChange={this.inputOnChange}></Input>
                        <h5>Due Date</h5>
                        <Input name="custom_date" id="custom_date" type="datetime-local" onChange={this.inputOnChange}></Input>

                        <Button color="primary" onClick={this.customSearch}>Search</Button>
                    </CardBody>
                </Card>
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
                                        <th>Due Date (on or before)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...this.state.query_table_info].map(item => (
                                        <tr key={item.id} onClick={() => this.setState({ collab_assignment_id: item.id })}>
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
            </>
        );
    }
}
export default Search;