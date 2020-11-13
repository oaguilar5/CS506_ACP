import React from 'react';
import './App.css';
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";
import classnames from 'classnames';

//Reactstrap library (with a few sample components)
//https://reactstrap.github.io/components/
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardText,
    Col,
    CustomInput,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    UncontrolledDropdown,
    Form,
    Input,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Nav,
    Navbar,
    NavItem,
    NavbarToggler,
    NavbarText,
    Collapse,
    NavLink,
    Progress,
    TabContent, 
    TabPane,
    Row

  
} from "reactstrap";

var ps;

class Assignment extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            avatar: "",
            user: "",
            modal: false,
            infoMsg: "",
            buttonColor: "primary",
            activeTab: '1',
            statusVisible: "block",
            subtaskVisible: "block",
            collabVisible: "block",
            assignments: [],
            title: "",
            dueDate: "",
            isPrivate: false,
            dod: "",
            description: "",
            status: "",
            isComplete: false,
            progress: 0,
            infoDisabled: true
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
                this.setState({user: email, isAuthenticated: true})
                //DEBUG
                console.log("profile pic: " + profilePic);
                //retrieve profile pic
                if (profilePic === "") {
                    //default if not set
                    profilePic = 'student-user.png'
                }
                firebase.storage().ref(profilePic).getDownloadURL()
                    .then(avatar => {
                        this.setState({ avatar })
                    })
                //check if an assignment was passed down as a prop
                let assignmentId = this.props.assignmentId;
                if (typeof assignmentId !== 'undefined') {
                    this.retrieveAssignmentDetails(assignmentId);
                }
            } else {
                //redirect to home page
                window.location.href = "/login"
            }
        });

        if (this.state.authenticated && navigator.platform.indexOf("Win") > -1) {
            document.documentElement.className += " perfect-scrollbar-on";
            document.documentElement.classList.remove("perfect-scrollbar-off");
            let tables = document.querySelectorAll(".scroll-area");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i]);
            }
          }

    }

    componentDidUpdate(e) {
        if (e.history.action === "PUSH" || e.history.action === "POP") {
          if (navigator.platform.indexOf("Win") > -1) {
            let tables = document.querySelectorAll(".scroll-area");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i]);
            }
          }
        }
      }

    componentWillUnmount() {
        if (ps && navigator.platform.indexOf("Win") > -1) {
          ps.destroy();
          document.documentElement.className += " perfect-scrollbar-off";
          document.documentElement.classList.remove("perfect-scrollbar-on");
        }
      }

      retrieveAssignmentDetails = id => {
        firebase.firestore().collection('assignments').doc(id).get()
            .then(doc =>{
                let title = doc.get('title');
                let dueDate = doc.get('due_date').toDate().toString();
                let description = doc.get('description');
                let status = doc.get('status')
                let isPrivate =  doc.get('is_private');
                let dod =  doc.get('dod');
                let isComplete =  doc.get('is_complete');
                let progress =  doc.get('progress');
                let infoDisabled =  false;
                this.setState({title, dueDate, description, status, isPrivate, dod, isComplete, progress, infoDisabled})
            })
      }

    toggle = tab => {
        if(this.state.activeTab !== tab) {
            this.setState({activeTab: tab})
        }
      }

      toggleInfoCards = card => {
        let newState = "block";
        if (this.state.[card] === "block") {
            newState = "none";
        }
        this.setState({[card]: newState})
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

                <div className="assignment-page" ref="mainPanel">
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
                                <NavLink href="">Search</NavLink>
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
                    <div className="assignment-content">
                        <div className="assignment-sidebar">
                            <Card>
                                <CardHeader>My Open Assignments</CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col sm="12" md={{ size: 6, offset: 3 }}>
                                            <Button
                                                type="submit"
                                                color={this.state.buttonColor}
                                                >
                                                Create Assignment
                                            </Button>
                                        </Col>
                                    </Row>
                                    <Card className="sidebar-card">
                                        <CardHeader>Assignment Test</CardHeader>
                                        <CardBody>
                                            <p><b>Due Date: </b>12/24/2020 </p>
                                            <p><b>Status: </b>Pending </p>
                                        </CardBody>
                                    </Card>
                                    <Card className="sidebar-card">
                                        <CardHeader>Assignment Test # 2</CardHeader>
                                        <CardBody>
                                            <p><b>Due Date: </b>12/28/2020 </p>
                                            <p><b>Status: </b>In-Progress </p>
                                        </CardBody>
                                    </Card>
                                </CardBody>
                                <CardFooter></CardFooter>
                            </Card>
                        </div>
                        <div className="assignment-middle">
                            <h5>Assignment</h5>
                            <div className="assignment-general">
                                <Row>
                                    <Col md="12">
                                        <Label>Title</Label>
                                        <Input type="text" value={this.state.title} disabled={this.state.infoDisabled}/>
                                    </Col>
                                    
                                </Row>
                                <Row>
                                    <Col md="8">
                                        <Label>Due Date</Label>
                                        <Input name="dueDate" type="datetime-local" value={this.state.dueDate} disabled={this.state.infoDisabled}/>
                                    </Col>
                                    <Col md="4">
                                        <CustomInput id="isPrivate" type="switch" label="Private" checked={this.state.isPrivate} disabled={this.state.infoDisabled}/>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md="12">
                                        <Label>Definition of Done</Label>
                                        <Input type="textarea" value={this.state.dod} disabled={this.state.infoDisabled}/>
                                    </Col>
                                    
                                </Row>
                                <Row>
                                    <Col md="12">
                                        <Label>Description</Label>
                                        <Input type="textarea" value={this.state.description} disabled={this.state.infoDisabled}/>
                                    </Col>
                                    
                                </Row>
                            </div>
                            <div className="assignment-comments">
                            <Nav tabs>
                                <NavItem>
                                <NavLink
                                    className={classnames({ active: this.state.activeTab === '1' })}
                                    onClick={() => { this.toggle('1'); }}
                                >
                                    Comments
                                </NavLink>
                                </NavItem>
                                <NavItem>
                                <NavLink
                                    className={classnames({ active: this.state.activeTab === '2' })}
                                    onClick={() => { this.toggle('2'); }}
                                >
                                    Files
                                </NavLink>
                                </NavItem>
                            </Nav>
                            <TabContent activeTab={this.state.activeTab}>
                                <TabPane tabId="1">
                                <Row>
                                    <Col sm="12">
                                    <h4>Comments Section TODO</h4>
                                    </Col>
                                </Row>
                                </TabPane>
                                <TabPane tabId="2">
                                <Row>
                                    <Col sm="6">
                                    <Card body>
                                        <CardText>With supporting text below as a natural lead-in to additional content.</CardText>
                                        <Button>Go somewhere</Button>
                                    </Card>
                                    </Col>
                                    <Col sm="6">
                                    <Card body>
                                        <CardText>With supporting text below as a natural lead-in to additional content.</CardText>
                                        <Button>Go somewhere</Button>
                                    </Card>
                                    </Col>
                                </Row>
                                </TabPane>
                            </TabContent>
                            </div>
                        </div>
                        <div className="assignment-info">
                            <div className="scroll-area">
                                <Card className="status-card">
                                    <CardHeader onClick={() => this.toggleInfoCards('statusVisible')}>Progression</CardHeader>
                                    <CardBody style={{display: this.state.statusVisible}}>
                                        <Row>
                                            <Col md="2"><Label>Status</Label></Col>
                                            <Col md="10">
                                                <Input type="text" value={this.state.status} disabled={this.state.infoDisabled}/>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md="2"><Label style={{position: 'relative', top: '40%'}}>Complete</Label></Col>
                                            <Col md="4">
                                            <CustomInput id="isComplete" type="switch" label="" checked={this.state.isComplete} disabled={this.state.infoDisabled}/>
                                            </Col>
                                            <Col md="5">
                                                <Button
                                                    type="submit"
                                                    color={this.state.buttonColor}
                                                    size="sm"
                                                    disabled={this.state.infoDisabled}
                                                    >
                                                        Complete Assignment
                                                    </Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md="12">
                                                <Label>Progress</Label>
                                                <Progress animated color="success" value={this.state.progress}>{this.state.progress}%</Progress>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                                <Card className="subtask-card">
                                    <CardHeader onClick={() => this.toggleInfoCards('subtaskVisible')}>Subtasks</CardHeader>
                                    <CardBody style={{display: this.state.subtaskVisible}}>
                                        <Row>
                                            <Col sm="12" md={{ size: 6, offset: 4 }}>
                                                <Button
                                                    type="submit"
                                                    color={this.state.buttonColor}
                                                    disabled={this.state.infoDisabled}
                                                    >
                                                    Create Subtask
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col sm="12" md={{ size: 8, offset: 3 }}>
                                                <p className="text-muted">No Subtasks for this Assignment</p>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                                <Card className="collaborator-card">
                                    <CardHeader onClick={() => this.toggleInfoCards('collabVisible')}>Collaborators</CardHeader>
                                    <CardBody style={{display: this.state.collabVisible}}>
                                        <Row>
                                            <Col md="8">
                                                <Input type="text" placeholder="Search Students" disabled={this.state.infoDisabled}/>
                                            </Col>
                                            <Col md="4">
                                            <Button
                                                    type="submit"
                                                    color={this.state.buttonColor}
                                                    disabled={this.state.infoDisabled}
                                                    >
                                                    Invite
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col sm="12" md={{ size: 9, offset: 2 }}>
                                                <p className="text-muted">No Collaborators for this Assignment</p>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default Assignment;
