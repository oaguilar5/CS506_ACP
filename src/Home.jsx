import React from 'react';
import firebase from "firebase/app";
import 'firebase/auth'
import "firebase/firestore";
import "firebase/storage";

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
  NavLink,
  Row,
  Jumbotron,
  Container,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Nav,
  NavItem,
  NavbarText,
  Collapse,
} from "reactstrap";


class Home extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      avatar: "",
      user: "",
      modal: false,
      infoMsg: "",
      buttonColor: "primary",
      assignments: [],
      open_assignments: 0,
      completed_assignments: 0
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
        let assignments = [];
        this.checkForAssignments(email, assignments, true);
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

  createUserDoc = (email, displayName) => {
    try {
      //create a new blank user doc
      let newUser = {
        email: email,
        display_name: displayName,
        profile_pic: "student-user.png",
        active_id: "",
        alert_settings: {
          alerts_on: true,
          comments: true,
          files: true,
          tasks: true
        }
      }
      firebase.firestore().collection('acp_users').doc(email).set(newUser);
    } catch (err) {
      console.log("Caught exception in createUserDoc(): " + err)
    }

  }

  checkForAssignments = (user, assignments, firstQuery) => {
    try {
      let thisQuery;
      if (firstQuery) {
        thisQuery = firebase.firestore().collection('assignments').where('created_by', '==', user).where('is_complete', '==', false).orderBy('create_date', 'desc');
      } else {
        thisQuery = firebase.firestore().collection('assignments').where('collaborators', 'array-contains', user).where('is_complete', '==', false).orderBy('create_date', 'desc');
      }
      thisQuery.get()
        .then(query => {
          if (query.size > 0) {
            //since forEach is async, keep count and update state once all have been traversed
            let count = 0;
            query.forEach(doc => {
              count++;
              let title = doc.get('title');
              let dueDate = doc.get('due_date').toDate().toLocaleString();
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
              if (count >= query.size && firstQuery) {
                this.checkForAssignments(user, assignments, false)
              } else {
                this.setState({ assignments })
              }
            })
            this.setState({ open_assignments: count })
            console.log(count)
          } else if (firstQuery) {
            this.checkForAssignments(user, assignments, false)
          }
        });

        let query = firebase.firestore().collection('assignments').where('created_by', '==', user).where('status', '==', 'Done');
        query.get()
        .then(q => {
          this.setState({ completed_assignments: q.size })
        });

    } catch (err) {
      console.log("Caught exception in checkForAssignments(): " + err)
    }
  }

  //set modal to its negated value
  toggleModal = () => {
    this.setState(prevState => { return { modal: !prevState.modal } })
  }

  nextPath(path) {
    this.props.history.push(path);
  }

  scrollAssignments = amount => {
    let pane = document.getElementById("select-assignments");
    pane.scrollLeft += amount;
  }

  createNewAssignment = async evt => {
    evt.preventDefault();
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
    this.state.open_assignments += 1
    this.selectAssignment(doc.id);
  }

  selectAssignment = id => {
    //first update the index.js global var for assignmentId
    this.props.updateGlobals(id, null);
    //save the active assignmentId to the user's doc for reference
    let user = this.state.user;
    firebase.firestore().collection('acp_users').doc(user).update({active_id: id});
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
        
        <div className="home-page" ref="mainPanel">
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


          <Modal isOpen={this.state.modal} toggle={this.toggleModal}>
            <Form onSubmit={this.createNewAssignment}>
              <ModalHeader toggle={this.toggleModal}>Create New</ModalHeader>
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
                <Button color={this.state.buttonColor} onClick={this.toggleModal}>Cancel</Button>{' '}
              </ModalFooter>
            </Form>
          </Modal>
          <Row>
            <Col className="q1-label" md="6">
              <h2>My Open Assignments</h2>
            </Col>
          </Row>
          <div className="open-assignments">
            <div id="select-assignments" className="select-assignments">
              {[...this.state.assignments].map(item => (
                <Card key={item.id} className="assignment-card" onClick={() => this.selectAssignment(item.id)}>
                  <CardHeader><h5>{item.title}</h5></CardHeader>
                  <CardBody>
                    <p><b>Due Date:</b> {item.dueDate}</p>
                    <p><b>Status:</b> {item.status}</p>
                    <p><b>Description:</b> {item.description}</p>
                  </CardBody>
                  <CardFooter><b>Creator:</b> {item.createdBy}</CardFooter>
                </Card>
              ))}
            </div>
            <div className="new-assignment">
              <span className="select-previous" onClick={() => this.scrollAssignments(-300)}>
                ‹
                        </span>
              <span className="select-next" onClick={() => this.scrollAssignments(300)}>
                ›
                        </span>
              <Card className="assignment-card create-new" onClick={() => this.toggleModal()}>
                <CardBody>
                  Create New
                          <img src="/images/plus-sign.jpg" />
                </CardBody>
              </Card>
            </div>
          </div>
          <div style={{ paddingLeft: '5%', paddingRight: '5%', paddingTop: '5%' }}>
            <Jumbotron>
              <Container fluid style={{ textAlign: "left", paddingBottom: '2%' }}>
                <h1>User Statistics</h1>

              </Container>
              <Container fluid style={{ display: "inline-block", textAlign: "left" }}>
                <h5>Number of Open Assignments</h5>
              <h6 id="num_assignments">{this.state.open_assignments}</h6>
              </Container>
              <Container fluid style={{ display: "inline-block", textAlign: "center" }}>
                <h5>Number of Completed Assignments</h5>
              <h6 id="completed_assignments">{this.state.completed_assignments}</h6>
              </Container>
              <Container fluid style={{ display: "inline-block", textAlign: "right" }}>
                <h5>Average Collaborators</h5>
                <h6 id="completed_assignments">0</h6>
              </Container>
            </Jumbotron>
          </div>
        </div>
      </>
    );
  }
}

export default Home;
