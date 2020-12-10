import React from 'react';
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";

// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

import {
    Button,
    Navbar,
    NavbarToggler,
    Col,
    Collapse,
    Nav,
    NavItem,
    NavLink,
    DropdownItem,
    UncontrolledDropdown,
    DropdownMenu,
    DropdownToggle,
    Table,
    Jumbotron,
    Container,
    Input,
    Label,
    Card,
    CardBody,
    CardHeader,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Row
} from "reactstrap"

var className="search-page"
var ps;

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
                this.props.updateGlobals(null, email, null);
                let profilePic = user.photoURL;
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

            document.documentElement.className += " perfect-scrollbar-on";
            document.documentElement.classList.remove("perfect-scrollbar-off");
            let tables = document.querySelectorAll(".jumbotron");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i], {
                suppressScrollX: true
              });
            }

    }

    componentDidUpdate(e) {
        if (e.history.action === "PUSH" || e.history.action === "POP") {
            let tables = document.querySelectorAll(".jumbotron");
            for (let i = 0; i < tables.length; i++) {
                ps = new PerfectScrollbar(tables[i], {
                    suppressScrollX: true
                  });
            }
        }
      }

    componentWillUnmount() {
        if (ps) {
          ps.destroy();
          document.documentElement.className += " perfect-scrollbar-off";
          document.documentElement.classList.remove("perfect-scrollbar-on");
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
                            createdOn: doc.get('create_date').toDate().toString(),
                            dueDate: doc.get('due_date').toDate().toString(),
                            description: doc.get('description'),
                            status: doc.get('status'),
                            createdBy: doc.get('created_by'),
                            progress: doc.get('progress'),
                            isPrivate: doc.get('is_private')
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
                    let creator = doc.get('created_by');
                    let collaborators = doc.get('collaborators');
                    if (thisUser !== creator && !collaborators.includes(thisUser)) {
                        
                        firebase.firestore().collection('assignments').doc(assignmentId)
                            .collection('requests').where('requestor', '==', thisUser).where('ack', '==', false).get()
                            .then(query => {
                                if (query.size === 0) {
                                    //create new request under this assignment
                                    let requestBody = {
                                        request_date: new Date(),
                                        requestor: thisUser,
                                        ack: false,
                                        accepted: false
                                    }
                                    docRef.collection('requests').add(requestBody)
                                        .then(() => {
                                            this.setState({
                                                modal: true, 
                                                infoMsg: "Successfully requested access to this assignment. Please wait while the creator or a collaborator review the request."
                                            })
                                        });
                                } else {
                                    this.setState({modal: true, infoMsg: "You already have a pending request for this assignment."})
                                }
                            });
                    } else {
                        this.setState({ modal: true, infoMsg: "You already have access to this assignment." })
                    }
                });
        }
        catch (err) {
            console.log("Caught exception in requestCollab(): " + err)
            this.setState({modal: true, infoMsg: "Failed to request access, please try again later."})
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

            if (user !== "") {
                query = query.where('created_by', '==', user)
            }
            if (progress !== "") {
                query = query.where('progress', '==', progress)
            }
            if (status !== "") {
                query = query.where('status', '==', status)
            }
            if (title !== "") {
                query = query.where('title', '==', title)
            }

            query.get().then(q => {
                q.forEach(doc => {
                    let id = doc.id;
                    let isPrivate = doc.get('is_private')
                    let title = doc.get('title');
                    let createdBy = doc.get('created_by');
                    let collaborators = doc.get('collaborators');
                    let createdOn, dueDate, description, status, progress;
                    if (isPrivate && (createdBy !== this.state.user && !collaborators.includes(this.state.user))) {
                        createdOn= dueDate= description= status= progress = "Private";
                    } else {
                        createdOn = doc.get('create_date').toDate().toString();
                        dueDate = doc.get('due_date').toDate().toString();
                        description = doc.get('description');
                        status = doc.get('status');
                        progress= doc.get('progress');
                    }
                    
                    let thisObj = {
                        id,
                        isPrivate,
                        title,
                        createdBy,
                        createdOn,
                        dueDate,
                        description,
                        status,
                        progress
                    };

                    if (date !== "") {
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

    selectAssignment = id => {
        //first update the index.js global var for assignmentId
        this.props.updateGlobals(id, null, null);
        //save the active assignmentId to the user's doc for reference
        let user = this.state.user;
        firebase.firestore().collection('acp_users').doc(user).update({ active_id: id });
        //then redirect the user to the assignment page
        this.props.history.push("/assignment");
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
                            <NavLink href="/home">Home</NavLink>
                            </NavItem>
                            <NavItem>
                            <NavLink href="/assignment">Assignments</NavLink>
                            </NavItem>
                            <NavItem>
                            <NavLink href="#!" onClick={() => {this.props.updateGlobals(null, null, "Notifications"); this.props.history.push("/profile")}}>Notifications</NavLink>
                            </NavItem>
                            <NavItem>
                            <NavLink href="/search">Search</NavLink>
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
                            </DropdownToggle>
                            <DropdownMenu className="dropdown-navbar" right tag="ul">
                                <DropdownItem header >{this.state.user}</DropdownItem>
                                <DropdownItem divider tag="li" />
                                <NavLink tag="li"  >
                                <DropdownItem className="nav-item"  onClick={() => {this.props.updateGlobals(null, null, "Profile"); this.props.history.push("/profile")}}>Profile</DropdownItem>
                                </NavLink>
                                <NavLink tag="li" >
                                <DropdownItem className="nav-item" onClick={this.userLogout}>Log out</DropdownItem>
                                </NavLink>
                            </DropdownMenu>
                            </UncontrolledDropdown>
                        </div>
                        </Collapse>
                    </Navbar>
                </div>
                <div className={className}>
                    <Card className="search-card">
                        <CardHeader>Custom Search</CardHeader>
                        <CardBody className="add-scrollbar">
                            <Row>
                                <Col md="4">
                                    <Label>User</Label>
                                    <Input type="text" id="custom_user" placeholder="me2@me.com" onChange={this.inputOnChange}></Input>
                                </Col>
                                <Col md="4">
                                    <Label>Title</Label>
                                    <Input type="text" id="custom_title" placeholder="Assignment" onChange={this.inputOnChange}></Input>
                                </Col>
                                <Col md="4">
                                    <Label>Status</Label>
                                    <Input type="text" id="custom_status" placeholder="Pending" onChange={this.inputOnChange}></Input>
                                </Col>
                                <Col md="4">
                                    <Label>Progress</Label>
                                    <Input type="text" id="custom_progress" placeholder="0" onChange={this.inputOnChange}></Input>
                                </Col>
                                <Col md="4">
                                    <Label>Due Date</Label>
                                    <Input name="custom_date" id="custom_date" type={navigator.userAgent.indexOf("Firefox") !== -1 ? "date" : "datetime-local"} onChange={this.inputOnChange}></Input>
                                </Col>
                                <Col className="col-button" md="2">
                                    <Button color="info" onClick={this.customSearch}>Search</Button>
                                </Col>
                                <Col className="col-button" md="2">
                                    <Button color="primary" onClick={this.getUserAssignments}>My Assignments</Button>
                                </Col>
                            </Row>
                            
                        </CardBody>
                    </Card>
                    
                    <div className="query-table">
                    <Row>
                        <Col md="2">
                            <Button color="secondary" onClick={() => this.selectAssignment(this.state.collab_assignment_id)} disabled={!this.state.collab_assignment_id}>View Assignment</Button>
                        </Col>
                        <Col md="2">
                            <Button color="success" onClick={this.requestCollab} disabled={!this.state.collab_assignment_id}>Request Access</Button>
                        </Col>
                        
                    </Row>
                        <Jumbotron>
                            <Container fluid style={{ textAlign: "left", paddingBottom: '2%' }}>
                                <Table striped hover>
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Description</th>
                                            <th>Created On</th>
                                            <th>Created By</th>
                                            <th>Private</th>
                                            <th>Status</th>
                                            <th>Progress</th>
                                            <th>Due Date (on or before)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...this.state.query_table_info].map(item => (
                                            <tr 
                                                key={item.id} 
                                                onClick={() => {this.setState({ collab_assignment_id: item.id })}}
                                                className={this.state.collab_assignment_id === item.id ? "row-selected" : ""}
                                            >
                                                <td >{item.title}</td>
                                                <td >{item.description}</td>
                                                <td >{item.createdOn}</td>
                                                <td >{item.createdBy}</td>
                                                <td >{item.isPrivate ? "Yes" : "No"}</td>
                                                <td >{item.status}</td>
                                                <td >{item.isPrivate ? item.progress : `${item.progress}%`}</td>
                                                <td >{item.dueDate}</td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </Table>
                            </Container>
                        </Jumbotron>

                    </div>
                </div>
                
            </>
        );
    }
}
export default Search;