import React from 'react';
import firebase from "firebase/app";
import 'firebase/auth'
import "firebase/firestore";
import "firebase/storage";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";
import classnames from 'classnames';
import SimpleStorage from "react-simple-storage";

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
            assignmentId: this.props.assignmentId,
            infoModal: false,
            assignmentModal: false,
            subModal: false,
            infoMsg: "",
            buttonColor: "primary",
            activeTab: '1',
            statusVisible: "block",
            subtaskVisible: "block",
            collabVisible: "block",
            assignments: [],
            subtasks: [],
            subtasksComplete: 0,
            assignmentTitle: "",
            title: "",
            due_date: "",
            is_private: false,
            dod: "",
            description: "",
            status: "",
            is_complete: false,
            assignmentProgress: 0,
            progress: 0,
            infoDisabled: true,
            oldValue: null,
            assignmentView: true,
            subtaskId: "",
            progressLocked: false
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
                    this.selectAssignment(assignmentId);
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
                let due_date = doc.get('due_date').toDate().toLocaleString();
                let description = doc.get('description');
                let status = doc.get('status')
                let is_private =  doc.get('is_private');
                let dod =  doc.get('dod');
                let is_complete =  doc.get('is_complete');
                let progress =  doc.get('progress');
                let infoDisabled =  false;
                this.setState({assignmentTitle: title, title, due_date, description, status, is_private, dod, is_complete, progress, assignmentProgress: progress, infoDisabled})
            })
      }


      retrieveSubtaskDetails = id => {
        let assignmentId = this.state.assignmentId;
        firebase.firestore().collection('assignments').doc(assignmentId).collection('subtasks').doc(id).get()
            .then(doc =>{
                let title = doc.get('sub_title');
                let due_date = doc.get('sub_due_date').toDate().toLocaleString();
                let description = doc.get('sub_description');
                let status = doc.get('sub_status')
                let dod =  doc.get('sub_dod');
                let is_complete =  doc.get('sub_is_complete');
                let progress =  doc.get('sub_progress');
                let infoDisabled =  false;
                this.setState({assignmentView: false, subtaskId: id, title, due_date, description, status, dod, is_complete, progress, infoDisabled})
            })
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
                let dueDate = doc.get('due_date').toDate().toLocaleString();
                let status = doc.get('status')
                let thisObj = {
                  id: doc.id,
                  title: title,
                  dueDate: dueDate,
                  status: status,
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

      checkForSubtasks = id => {
          try {
            let subtasks = [];
            let subtasksComplete = 0;
            firebase.firestore().collection('assignments').doc(id).collection('subtasks').get()
                .then(query =>{
                    //since forEach is async, keep count and update state once all have been traversed
                    let count = 0;
                    query.forEach(doc => {
                        count++;
                        let sub_title = doc.get('sub_title');
                        let sub_due_date = doc.get('sub_due_date').toDate().toLocaleString();
                        let sub_status = doc.get('sub_status');
                        let subComplete = doc.get('sub_is_complete');
                        let thisObj = {
                            id: doc.id,
                            title: sub_title,
                            dueDate: sub_due_date,
                            status: sub_status,
                            isComplete: subComplete
                          };
                        
                        if (subComplete)
                            subtasksComplete++
                        subtasks.push(thisObj)
                        if (count >= query.size) {
                            this.setState({ subtasks, subtasksComplete })
                        }
                    });
                    
                });
          } catch(err) {
            console.log("Caught exception in checkForSubtasks(): " + err)
          }
         
      }

      createNewAssignment = async evt => {
        evt.preventDefault();
        try {
            let title = evt.target.elements.namedItem("title").value;
            let description = evt.target.elements.namedItem("description").value;
            let dod = evt.target.elements.namedItem("dod").value;
            let dueDate = new Date(evt.target.elements.namedItem("dueDate").value);
            let isPrivate = evt.target.elements.namedItem("isPrivate").checked;
            let creator = this.state.user;
            let createDate = new Date();
            console.log(dueDate)
            let body = {
              title: title,
              description: description,
              dod: dod,
              due_date: dueDate,
              is_private: isPrivate,
              create_date: createDate,
              created_by: creator,
              collaborators: [],
              is_complete: false,
              progress: 0,
              status: "Pending",
            }
            let doc = await firebase.firestore().collection('assignments').add(body);
            this.selectAssignment(doc.id);
            this.toggleModal('assignmentModal');
            let user = this.state.user;
            this.checkForAssignments(user);
            this.setState({infoModal: true, infoMsg: "Successfully created Assignment!"})
        } catch (err) {
            console.log("Caught exception in createNewAssignment(): " + err);
            this.setState({assignmentModal: false, infoModal: true, infoMsg: "Failed to create new assignment. Please try again later."})
        }
      }

      createNewSubtask = async evt => {
        evt.preventDefault();
        try {
            let title = evt.target.elements.namedItem("sub_title").value;
            let description = evt.target.elements.namedItem("sub_description").value;
            let dod = evt.target.elements.namedItem("sub_dod").value;
            let dueDate = new Date(evt.target.elements.namedItem("sub_dueDate").value);
            let assignee = evt.target.elements.namedItem("sub_assignee").value;
            let creator = this.state.user;
            let createDate = new Date();
            console.log(dueDate)
            let body = {
              sub_title: title,
              sub_description: description,
              sub_dod: dod,
              sub_status: "Pending",
              sub_due_date: dueDate,
              sub_create_date: createDate,
              sub_created_by: creator,
              sub_assignee: assignee,
              sub_is_complete: false,
              sub_progress: 0
            }
            let id = this.state.assignmentId;
            let doc = await firebase.firestore().collection('assignments').doc(id).collection('subtasks').add(body);
            this.toggleModal('subModal');
            this.retrieveSubtaskDetails(doc.id);
            let assignmentId = this.state.assignmentId;
            this.checkForSubtasks(assignmentId);
            this.setState({infoModal: true, infoMsg: "Successfully created Subtask!"})
        } catch(err) {
            console.log("Caught exception in createNewSubtask(): " + err);
            this.setState({subModal: false, infoModal: true, infoMsg: "Failed to create new subtask. Please try again later."})
        }
      }

      selectAssignment = id => {
        //update the index.js global var for assignmentId which will push down the prop
        this.props.updateGlobals(id, null);
        this.setState({assignmentView: true, assignmentId: id, subtasks: []})
        //reload the assignment page
        this.retrieveAssignmentDetails(id);
        this.checkForSubtasks(id);
        
      }

    //set modal to its negated value
    toggleModal = type => {
        this.setState(prevState => { return { [type]: !prevState[type] } })
    }

    toggle = tab => {
        if(this.state.activeTab !== tab) {
            this.setState({activeTab: tab})
        }
      }

      toggleInfoCards = card => {
        let newState = "block";
        if (this.state[card] === "block") {
            newState = "none";
        }
        this.setState({[card]: newState})
      }

      //function to capture the old value
    inputOnFocus = evt => {
        try {
            let value = evt.target.value;
            this.setState({ oldValue: value })
        } catch (err) {
            console.log("Caught exception in inputOnFocus(): " + err)
        }
    }

    //lightweight function to update input value
    inputOnChange = evt => {
        try {
            let value = evt.target.value;
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

    //function to compare new value to old and save to firebase
    inputOnBlur = evt => {
        try {
            let newVal = evt.target.value;
            let oldVal = this.state.oldValue;
            if (oldVal !== null && newVal !== oldVal) {
                let dataType = evt.target.type;
                //sanitize the value if number type
                if (dataType === 'number')
                newVal = parseInt(newVal);
                //create a reference to the assignment doc
                let id = this.state.assignmentId;
                let doc =  firebase.firestore().collection('assignments').doc(id);
                let fieldId = evt.target.id;
                //check if we're saving to the assignment or subtask
                if (this.state.assignmentView) {
                    doc.update({[fieldId]: newVal});
                } else {
                    //retrieve the subtask field name and save to subtask
                    fieldId = subtaskFields(fieldId);
                    let subtaskId = this.state.subtaskId;
                    doc.collection('subtasks').doc(subtaskId).update({[fieldId]: newVal});
                }
               
            }
        } catch (err) {
            console.log("Caught exception in inputOnBlur(): " + err)
        }

        function subtaskFields (name) {
            let field = null;
            switch(name) {
                case 'title':
                    field = 'sub_title';
                    break;
                case 'due_date':
                    field = 'sub_due_date';
                    break;
                case 'dod':
                    field = 'sub_dod';
                    break;
                case 'description':
                    field = 'sub_description';
                    break;
                case 'status':
                    field = 'sub_status';
                    break;
                default:
                    break
            }
            return field;
        }
    }



    markComplete = () => {
        //construct the parent doc
        let assignmentId = this.state.assignmentId;
        let doc = firebase.firestore().collection('assignments').doc(assignmentId);
        //check if we're dealing with the assignment or subtask
        if (this.state.assignmentView) {
            doc.update({is_complete: true, status: "Done", progress: 100});
            //refresh the assignment sidebar
            let user = this.state.user;
            this.checkForAssignments(user);
        } else {
            let subtaskId = this.state.subtaskId;
            doc.collection('subtasks').doc(subtaskId).update({sub_is_complete: true, sub_status: "Done", sub_progress: 100});
            this.calculateProgressPercent();
            //refresh the subtask sidebar
            this.checkForSubtasks(assignmentId);
        }
        //mark our state var complete
        this.setState({is_complete: true, status: "Done", progress: 100})
    }

    //TODO: add calculation for when a new subtask is created to recalculate the percent which would be greater
    calculateProgressPercent = () => {
        //only proceed to calculate if progress not manually set by the user
        if (!this.state.progressLocked) {
            //check to see if the progress was indicative of tasks completed or was set by the user
            let assignmentProgress = this.state.assignmentProgress;
            let subtaskCount = this.state.subtasks.length;
            let subtasksComplete = this.state.subtasksComplete;
            let previousCalc = (subtasksComplete/subtaskCount)*100;
            if (assignmentProgress === previousCalc) {
                //since these are equal, the user has not set the progress manually. Continue to update
                let actualCalc = ((subtasksComplete+1)/subtaskCount)*100;
                let assignmentId = this.state.assignmentId;
                firebase.firestore().collection('assignments').doc(assignmentId).update({progress: actualCalc});
                this.setState({assignmentProgress: actualCalc})
            }
        }
        
        
    }

    userLogout = () => {
        firebase.auth().signOut().then(() => {
            console.log("successfully logged out")
        }).catch(error => {
            // An error happened.
            console.log("error logging out: " + error)
            this.setState({ modal: true, infoMsg: "Error signing out" });
        });
    }

    render() {
        return (
            <>
                <SimpleStorage
                    parent={this}
                    prefix={ 'assignment-page_' }
                />
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
                    <Modal isOpen={this.state.infoModal} toggle={() => this.toggleModal('infoModal')}>
                        <ModalHeader toggle={() => this.toggleModal('infoModal')}>Notice</ModalHeader>
                        <ModalBody>
                            {this.state.infoMsg}
                        </ModalBody>
                        <ModalFooter>
                            <Button color={this.state.buttonColor} onClick={() => this.toggleModal('infoModal')}>Ok</Button>{' '}
                        </ModalFooter>
                    </Modal>
                    <Modal isOpen={this.state.assignmentModal} toggle={() => this.toggleModal('assignmentModal')}>
                        <Form onSubmit={this.createNewAssignment}>
                        <ModalHeader toggle={() => this.toggleModal('assignmentModal')}>Create New Assignment</ModalHeader>
                        <ModalBody>

                            <Row>
                            <Col md="12">
                                <Label>Title</Label>
                                <Input name="title" type="text" required />
                            </Col>
                            </Row>
                            <Row>
                            <Col md="12">
                                <Label>Description</Label>
                                <Input name="description" type="textarea" />
                            </Col>
                            </Row>
                            <Row>
                            <Col md="12">
                                <Label>Definition of Done</Label>
                                <Input name="dod" type="textarea" />
                            </Col>
                            </Row>
                            <Row>
                            <Col md="12">
                                <Label>Due Date</Label>
                                <Input name="dueDate" type="datetime-local" required />
                            </Col>
                            </Row>
                            <Row style={{ marginTop: '5%', marginBottom: '5%' }}>
                            <Col sm="12" md={{ size: 6, offset: 3 }}>
                                <Label>Make my Assignment Private</Label>
                            </Col>
                            <Col md="2">
                                <Input name="isPrivate" type="checkbox" />
                            </Col>
                            </Row>
                            <Row>
                            <Col md="6">
                                <Label>Created By</Label>
                                <Input name="creator" type="text" disabled value={this.state.user} />
                            </Col>
                            <Col md="6">
                                <Label>Create Date</Label>
                                <Input name="createDate" type="datetime-locale" disabled value={new Date().toLocaleDateString()} />
                            </Col>
                            </Row>

                        </ModalBody>
                        <ModalFooter>
                            <Button type="submit" color={this.state.buttonColor}>Ok</Button>{' '}
                            <Button color={this.state.buttonColor} onClick={() => this.toggleModal('assignmentModal')}>Cancel</Button>{' '}
                        </ModalFooter>
                        </Form>
                    </Modal>
                    <Modal isOpen={this.state.subModal} toggle={() => this.toggleModal('subModal')}>
                        <Form onSubmit={this.createNewSubtask}>
                        <ModalHeader toggle={() => this.toggleModal('subModal')}>Create New Subtask</ModalHeader>
                        <ModalBody>

                            <Row>
                            <Col md="12">
                                <Label>Title</Label>
                                <Input name="sub_title" type="text" required />
                            </Col>
                            </Row>
                            <Row>
                            <Col md="12">
                                <Label>Description</Label>
                                <Input name="sub_description" type="textarea" />
                            </Col>
                            </Row>
                            <Row>
                            <Col md="12">
                                <Label>Definition of Done</Label>
                                <Input name="sub_dod" type="textarea" />
                            </Col>
                            </Row>
                            <Row>
                            <Col md="12">
                                <Label>Due Date</Label>
                                <Input name="sub_dueDate" type="datetime-local" required />
                            </Col>
                            </Row>
                            <Row>
                                <Col md="8">
                                    <Label>Assignee</Label>
                                    <Input name="sub_assignee" type="select" />
                                </Col>
                            </Row>
                            <Row>
                            <Col md="6">
                                <Label>Created By</Label>
                                <Input name="sub_creator" type="text" disabled value={this.state.user} />
                            </Col>
                            <Col md="6">
                                <Label>Create Date</Label>
                                <Input name="sub_createDate" type="datetime-locale" disabled value={new Date().toLocaleDateString()} />
                            </Col>
                            </Row>

                        </ModalBody>
                        <ModalFooter>
                            <Button type="submit" color={this.state.buttonColor}>Ok</Button>{' '}
                            <Button color={this.state.buttonColor} onClick={() => this.toggleModal('subModal')}>Cancel</Button>{' '}
                        </ModalFooter>
                        </Form>
                    </Modal>
                    <div className="assignment-content">
                        <div className="assignment-sidebar">
                            <Card>
                                <CardHeader>My Open Assignments</CardHeader>
                                <CardBody>
                                    <div className="scroll-area">
                                        <Row>
                                            <Col sm="12" md={{ size: 6, offset: 3 }}>
                                                <Button
                                                    type="submit"
                                                    color={this.state.buttonColor}
                                                    onClick={() => this.toggleModal('assignmentModal')}
                                                    >
                                                    Create Assignment
                                                </Button>
                                            </Col>
                                        </Row>
                                        {[...this.state.assignments].map(item => (
                                            <Card key={item.id} className="sidebar-card" onClick={() => this.selectAssignment(item.id)}>
                                            <CardHeader><b>{item.title}</b></CardHeader>
                                            <CardBody>
                                                <p><b>Due Date:</b> {item.dueDate}</p>
                                                <p><b>Status:</b> {item.status}</p>
                                            </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                </CardBody>
                                <CardFooter></CardFooter>
                            </Card>
                            
                        </div>
                        <div className="assignment-middle">
                            
                                {this.state.assignmentView && <h5>Assignment</h5>}
                                {!this.state.assignmentView && 
                                    <h5><a href="#!" onClick={() => {this.selectAssignment(this.state.assignmentId)}}>{this.state.assignmentTitle}</a><span> / Subtask</span></h5>
                                }
                            
                            <div className="assignment-general">
                                <Row>
                                    <Col md="12">
                                        <Label>Title</Label>
                                        <Input 
                                            type="text" 
                                            id="title" 
                                            value={this.state.title} 
                                            onChange={this.inputOnChange} 
                                            onFocus={this.inputOnFocus}
                                            onBlur={this.inputOnBlur}
                                            disabled={this.state.infoDisabled}/>
                                    </Col>
                                    
                                </Row>
                                <Row>
                                    <Col md="8">
                                        <Label>Due Date</Label>
                                        <Input 
                                            type="datetime-local" 
                                            id="due_date"  
                                            value={this.state.due_date} 
                                            onChange={this.inputOnChange} 
                                            onFocus={this.inputOnFocus}
                                            onBlur={this.inputOnBlur}
                                            disabled={this.state.infoDisabled}/>
                                    </Col>
                                    <Col md="4">
                                        <CustomInput 
                                            type="switch" 
                                            id="is_private"  
                                            label="Private" 
                                            checked={this.state.is_private} 
                                            onChange={this.inputOnChange} 
                                            onFocus={this.inputOnFocus}
                                            onBlur={this.inputOnBlur}
                                            disabled={this.state.infoDisabled}/>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md="12">
                                        <Label>Definition of Done</Label>
                                        <Input 
                                            type="textarea" 
                                            id="dod" 
                                            value={this.state.dod} 
                                            onChange={this.inputOnChange} 
                                            onFocus={this.inputOnFocus}
                                            onBlur={this.inputOnBlur} 
                                            disabled={this.state.infoDisabled}/>
                                    </Col>
                                    
                                </Row>
                                <Row>
                                    <Col md="12">
                                        <Label>Description</Label>
                                        <Input 
                                            type="textarea" 
                                            id="description" 
                                            value={this.state.description} 
                                            onChange={this.inputOnChange} 
                                            onFocus={this.inputOnFocus}
                                            onBlur={this.inputOnBlur} 
                                            disabled={this.state.infoDisabled}/>
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
                                                <Input 
                                                    type="select" 
                                                    id="status" 
                                                    value={this.state.status} 
                                                    onChange={this.inputOnChange} 
                                                    onFocus={this.inputOnFocus}
                                                    onBlur={this.inputOnBlur} 
                                                    disabled={this.state.infoDisabled}>

                                                    <option>Pending</option>
                                                    <option>In-Progress</option>
                                                    <option>Review</option>
                                                    <option>Done</option>
                                                </Input>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md="2"><Label style={{position: 'relative', top: '40%'}}>Complete</Label></Col>
                                            <Col md="4">
                                            <CustomInput id="is_complete" type="switch" label="" checked={this.state.is_complete} disabled={this.state.infoDisabled}/>
                                            </Col>
                                            <Col md="5">
                                                <Button
                                                    type="submit"
                                                    color={this.state.buttonColor}
                                                    size="sm"
                                                    disabled={this.state.infoDisabled || this.state.is_complete}
                                                    onClick={() => this.markComplete()}
                                                    >
                                                        {this.state.assignmentView && 'Complete Assignment'}
                                                        {!this.state.assignmentView && 'Complete Subtask'}
                                                    </Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md="12">
                                                <Label>Progress</Label>
                                                <Progress animated color="success" value={this.state.progress}>{Math.round(this.state.progress)}%</Progress>
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
                                                    disabled={this.state.infoDisabled || !this.state.assignmentView}
                                                    onClick={() => this.toggleModal('subModal')}
                                                    >
                                                    Create Subtask
                                                </Button>
                                            </Col>
                                        </Row>
                                        
                                                {Object.keys(this.state.subtasks).length === 0 && 
                                                    <Row>
                                                        <Col sm="12" md={{ size: 8, offset: 3 }}>
                                                        <p className="text-muted">No Subtasks for this Assignment</p>
                                                        </Col>
                                                    </Row>
                                                }
                                                {Object.keys(this.state.subtasks).length > 0 && 
                                                    [...this.state.subtasks].map(item => (
                                                        <Card key={item.id} className="subtask-item" onClick={() => this.retrieveSubtaskDetails(item.id)}>
                                                        <CardHeader><b>{item.title}</b></CardHeader>
                                                        <CardBody>
                                                            <p><b>Due Date:</b> {item.dueDate}</p>
                                                            <p><b>Status:</b> {item.status}</p>
                                                        </CardBody>
                                                        </Card>
                                                    ))
                                                }
                                            
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
