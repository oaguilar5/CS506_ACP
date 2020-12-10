import React from 'react';
import moment from 'moment'

import firebase from "firebase/app";
import 'firebase/auth'
import "firebase/firestore";
import "firebase/storage";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

//Reactstrap library (with a few sample components)
//https://reactstrap.github.io/components/
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Col,
    CustomInput,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    UncontrolledDropdown,
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
    Collapse,
    NavLink,
    Row,
    Spinner
  
} from "reactstrap";

var ps;

class Profile extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            view: this.props.view,
            profilePic: "",
            avatar: "",
            user: "",
            displayName: "",
            contactEmail: "",
            alertSettings: {
                alerts_on: false,
                comments: false,
                files: false,
                tasks: false
            },
            infoModal: false,
            infoMsg: "",
            processing: false,
            requests: [],
            notifications: [],
            requestComment: "",
            requestEditId: ""
        }
    }

    componentDidMount() {

        //initial auth check
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                let email = user.email;
                let profilePic = user.photoURL;
                this.setState({user: email, profilePic, isAuthenticated: true})
                //retrieve profile pic
                if (profilePic === "") {
                    //default if not set
                    profilePic = 'student-user.png'
                }
                firebase.storage().ref(profilePic).getDownloadURL()
                    .then(avatar => {
                        this.setState({ avatar })
                    })

                this.retrieveUserDetails(email);
                this.retrieveNotifications(email);
                let requests = [];
                this.retrieveRequests(email, requests, true)
            } else {
                //redirect to home page
                window.location.href = "/login"
            }
        });

            document.documentElement.className += " perfect-scrollbar-on";
            document.documentElement.classList.remove("perfect-scrollbar-off");
            let tables = document.querySelectorAll(".scroll-area");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i]);
            }
    }


    componentDidUpdate(e) {
        if (e.history.action === "PUSH" || e.history.action === "POP") {
            let tables = document.querySelectorAll(".scroll-area");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i]);
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

      retrieveUserDetails = email => {
          try {
            firebase.firestore().collection('acp_users').doc(email).get()
                .then(user => {
                    let displayName = user.get('display_name');
                    let contactEmail = user.get('email');
                    let alertSettings = user.get('alert_settings');
                    this.setState({displayName, contactEmail, alertSettings})
                })
          } catch (err) {
            console.log("Caught exception in retrieveUserDetails(): " + err)
          }
        
      }

      retrieveRequests = (email, requests, firstQuery) => {
        try {
          let thisQuery;
          if (firstQuery) {
            thisQuery = firebase.firestore().collection('assignments').where('created_by', '==', email).orderBy('create_date', 'desc');
          } else {
            thisQuery = firebase.firestore().collection('assignments').where('collaborators', 'array-contains', email).orderBy('create_date', 'desc');
          }
          thisQuery.get()
            .then(query => {
              if (query.size > 0) {
                //since forEach is async, keep count and update state once all have been traversed
                let count = 0;
                query.forEach(doc => {
                    count++;
                    let assignmentId = doc.id;
                    let assignmentTitle = doc.get('title')
                    //check if there is any unack'd requests
                    doc.ref.collection('requests').where('ack', '==', false).get()
                        .then(requestQuery => {
                            if (requestQuery.size > 0) {
                                requestQuery.forEach(request => {
                                    let id = request.id;
                                    let requestDate = request.get('request_date');
                                    if (typeof requestDate.toDate === "function") {
                                        requestDate = requestDate.toDate();
                                    }
                                    let requestor = request.get('requestor');
                                    let requestBody = {
                                        id, 
                                        requestDate, 
                                        requestor, 
                                        assignmentId,
                                        assignmentTitle
                                    }
                                    this.setState(prev => {let requests = prev.requests.push(requestBody); return requests})
                                })
                            }
                            
                        })
                  if (count >= query.size && firstQuery) {
                    this.retrieveRequests(email, requests, false)
                  }
                })
              } else if (firstQuery) {
                this.retrieveRequests(email, requests, false)
              }
            });
        } catch (err) {
          console.log("Caught exception in retrieveRequests(): " + err)
        }
      }

      retrieveNotifications = email => {
          let notifications = [];
        try {
            firebase.firestore().collection('acp_users').doc(email).collection('notifications').orderBy('alert_create', 'desc').limit(10).get()
                .then(query => {
                    if (query.size > 0) {
                        let docs = 0;
                        query.forEach(doc => {
                            docs++;
                            let id = doc.id;
                            let assignmentId = doc.get('alert_assignment_id');
                            let assignmentTitle = doc.get('alert_assignment_title');
                            let alertCreate = doc.get('alert_create');
                            if (typeof alertCreate.toDate === "function") {
                                alertCreate = alertCreate.toDate();
                            }
                            let alertMsg = doc.get('alert_msg');
                            let alertObject = doc.get('alert_object');
                            if (typeof alertObject === "string") {
                                alertObject = alertObject.substring(0, alertObject.length-1)
                            }
                            let alertObjectTitle = doc.get('alert_object_title');
                            let alertType = doc.get('alert_type');
                            let alertUser = doc.get('alert_user');
                            let notification = {
                                id,
                                assignmentId, 
                                assignmentTitle, 
                                alertCreate, 
                                alertMsg, 
                                alertObject, 
                                alertObjectTitle, 
                                alertType, 
                                alertUser
                            }
                            notifications.push(notification);
                            if (docs >= query.size) {
                                this.setState({notifications})
                            }
                        })
                    } else {
                        this.setState({notifications})
                    }
                })
          } catch (err) {
            console.log("Caught exception in retrieveNotifications(): " + err);
            this.setState({notifications})
          }
      }

          //set modal to its negated value
    toggleModal = () => {
        let infoModal = this.state.infoModal;
        this.setState({infoModal: !infoModal})

    }

    setView = view => {
        this.setState({view});
    }

    processImgUpload = evt => {
        try {
            let files = evt.target.files;
            // FileReader support
            if (files && files.length) {
                //update the name of the file
                let filename = this.state.user + "_avatar";
                //upload to storage
                firebase.storage().ref().child(filename).put(files[0]).then(snapshot => {
                    snapshot.ref.getDownloadURL().then(src => {
                        //update the user's profileURL and firebase doc
                        let user = firebase.auth().currentUser;
                        user.updateProfile({
                            photoURL: filename
                          }).then(() => {
                              //get the url to update our img src
                                this.setState({processing: false, avatar: src, profilePic: filename, infoModal : true, infoMsg: "Successfully updated your profile picture"})
                          }).catch(function(error) {
                            this.setState({processing: false, infoModal : true, infoMsg: "Error processing your image, please try again"});
                            console.log("Error updating auth user: " + error)
                          });
                          firebase.firestore().collection('acp_users').doc(user.email).update({profile_pic: filename})
                    })
                })
            } else {
                this.setState({processing: false, infoModal : true, infoMsg: "Error processing your image, please try again"});
            }
        } catch (err) {
            this.setState({processing: false, infoModal : true, infoMsg: "Error processing your image, please try again"});
            console.log("Caught exception in processImgUpload(): " + err)
        }

    }

    
        //lightweight function to update input value
        inputOnChange = evt => {
            try {
                let value = evt.target.value;
                let id = evt.target.id;
                let type = evt.target.type;
                if (type !== "text") {
                    let alertSettings = this.state.alertSettings;
                    alertSettings[id] = !alertSettings[id];
                    this.setState(alertSettings)
                } else {
                    this.setState({ [id]: value })
                }
            } catch (err) {
                console.log("Caught exception in inputOnChange(): " + err)
            }
        }
    
        //function to compare new value to old and save to firebase
        saveProfileChanges = async () => {
            try {
                let user = this.state.user;
                let displayName = this.state.displayName;
                let contactEmail = this.state.contactEmail;
                let alertSettings = this.state.alertSettings;
                let profilePic = this.state.profilePic;
                let body = {
                    alert_settings:  alertSettings,
                    display_name: displayName,
                    email: contactEmail,
                    profile_pic: profilePic
                }
                await firebase.firestore().collection('acp_users').doc(user).update(body);
                this.setState({infoModal: true, infoMsg: "Successfully updated your profile"})
            } catch (err) {
                console.log("Caught exception in inputOnBlur(): " + err)
                this.setState({infoModal: true, infoMsg: "Error saving your changes, please try again later."})
            }
        }

        retrieveMoment = timestamp => {
            return moment(timestamp).fromNow();
        }

        selectAssignment = id => {
            //first update the index.js global var for assignmentId
            this.props.updateGlobals(id, null, null);
            //save the active assignmentId to the user's doc for reference
            let user = this.state.user;
            firebase.firestore().collection('acp_users').doc(user).update({active_id: id});
            //then redirect the user to the assignment page
            this.props.history.push("/assignment");
          }

          ackRequest = async (requestId, assignmentId, assignmentTitle, accepted, requestor) => {
              try {
                //retrieve comment text
                let element = document.getElementById(requestId)
                let comment = element.value;
                element.value = "";
                //first ensure that there is room for this collaborator
                let doc = await firebase.firestore().collection('assignments').doc(assignmentId).get();
                if (doc.exists) {
                    let collabs = doc.get('collaborators');
                    let creator = doc.get('creator');
                    let infoMsg = "";
                    //create the notification body
                    let body = {
                        alert_create: new Date(),
                        alert_user: this.state.displayName,
                        alert_msg: comment,
                        alert_object: "your requestt", //notification trims last char
                        alert_type: "accepted",
                        alert_assignment_id: assignmentId,
                        alert_assignment_title: assignmentTitle,
                        alert_object_title: ""
                    }
                    //determine if there is room for a collaborator
                    if (collabs.length < 10) {
                        if (accepted) {
                            //add this user as a collaborator if not already present
                            if (requestor !== creator && !collabs.includes(requestor)) {
                                collabs.push(requestor);
                                doc.ref.update({collaborators: collabs})
                                infoMsg = "Successfully added collaborator";
                            } else {
                                body.alert_type = "could not approve";
                                body.alert_msg = `You aready have access to this assignment. Comment: ${comment}`;
                                infoMsg = `Could not add collaborator: this user already has access to this assignment`;
                            }
                        } else {
                            body.alert_type = "declined";
                        }
                    } else {
                        body.alert_type = "could not approve";
                        body.alert_msg = `Assignment has maximum number of collaborators. Comment: ${comment}`;
                        infoMsg = `Could not add collaborator: this assignment already has the maximum number 
                            of collaborators allowed. A notification has been sent to this user.`;
                    }
                    //create the notification
                    firebase.firestore().collection('acp_users').doc(requestor).collection('notifications').add(body);
                    //ack this request and clear from our requests array
                    firebase.firestore().collection('assignments').doc(assignmentId)
                        .collection('requests').doc(requestId).update({ack: true, accepted: accepted})
                    let requests = this.state.requests;
                    if (requests.length > 1) {
                        requests = requests.filter(item => {
                            if (item.id === requestId) {
                                return item;
                            } else {
                                return null
                            }
                        });
                    } else {
                        requests = [];
                    }
                    
                    this.setState({
                        requests,
                        infoModal: true, 
                        infoMsg
                    })
                    this.setState({requests})
                } else {
                    this.setState({infoModal: true, infoMsg: `Error processing request: assignment "${assignmentTitle}" does not exist`})
                }
              } catch (err) {
                console.log("Caught exception in ackRequest(): " + err);
                this.setState({infoModal: true, infoMsg: `Error processing request, please try again later`})
              }
            

          }


    userLogout = () => {
        firebase.auth().signOut().then(() => {
            console.log("successfully logged out")
        }).catch(error => {
            // An error happened.
            console.log("error logging out: " + error)
            this.setState({infoModal: true, infoMsg: "Failed to log out, please try again later."})
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
                <div className="profile-page" ref="mainPanel">

                    <Modal isOpen={this.state.infoModal} toggle={this.toggleModal}>
                        <ModalHeader toggle={this.toggleModal}>Notice</ModalHeader>
                        <ModalBody>
                            {this.state.infoMsg}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.toggleModal}>Ok</Button>{' '}
                        </ModalFooter>
                    </Modal>
                    <div className="sidenav">
                        <a href="#!" onClick={evt => {evt.preventDefault(); this.setState({view: "Profile"})}}>Profile</a>
                        <a href="#!" onClick={evt => {evt.preventDefault(); this.setState({view: "Notifications"})}}>Notifications</a>
                    </div>
                    <div className="content">
                        {this.state.view !== "Notifications" && 
                            <div className="profile">
                                    <h5 className="text-muted">{this.state.user}</h5>
                                    <Row>
                                        <Col md="4" className="col-photo">
                                            <div 
                                                className="user-photo update-photo" 
                                                onClick={() => {let fileSelect = document.getElementById("upload-file"); fileSelect.click(); fileSelect.focus()}}
                                            >
                                                {!this.state.processing &&
                                                    <img alt="..." src={this.state.avatar} />
                                                }
                                                {this.state.processing && 
                                                    <Spinner
                                                    className="upload-spinner"
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                    />
                                                    }
                                                <input 
                                                    style={{display: 'none'}}
                                                    id={"upload-file"} 
                                                    type="file" accept="image/*" 
                                                    onChange={evt => {this.setState({processing: true}); this.processImgUpload(evt)}}
                                                    onBlur={() => {this.setState({processing: false})}}/>
                                            </div>
                                            
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4" className="col-photo">
                                        <Label>Click to Change Display Picture</Label>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4">
                                            <Label>Display Name</Label>
                                            <Input 
                                                type="text" 
                                                id="displayName"
                                                value={this.state.displayName}
                                                onChange={this.inputOnChange} 
                                                />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4">
                                            <Label>Contact Email</Label>
                                            <Input 
                                                type="text" 
                                                id="contactEmail"
                                                value={this.state.contactEmail}
                                                onChange={this.inputOnChange} 
                                                />
                                        </Col>
                                    </Row>
                                    <br />
                                    <h5>Notification Settings</h5>
                                    <Row>
                                        <Col md="4">
                                            <Label>Alerts</Label>
                                            <CustomInput 
                                                type="switch" 
                                                id="alerts_on"
                                                checked={this.state.alertSettings.alerts_on}
                                                onChange={this.inputOnChange} />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4">
                                        <Label>Comments</Label>
                                            <CustomInput 
                                                type="switch" 
                                                id="comments"
                                                checked={this.state.alertSettings.comments}
                                                onChange={this.inputOnChange} />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4">
                                        <Label>Files</Label>
                                            <CustomInput 
                                                type="switch" 
                                                id="files"
                                                checked={this.state.alertSettings.files}
                                                onChange={this.inputOnChange} />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4">
                                            <Label>Tasks</Label>
                                            <CustomInput 
                                                type="switch" 
                                                id="tasks"
                                                checked={this.state.alertSettings.tasks}
                                                onChange={this.inputOnChange} />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4" className="col-photo">
                                            <Button
                                                color="primary"
                                                onClick={this.saveProfileChanges}
                                            >Save</Button>
                                        </Col>
                                    </Row>
                            </div>
                        }

                        {this.state.view === "Notifications" && 
                            <div className="notifications">
                                <h4 className="text-muted">Requests {`[${this.state.requests.length}]`}</h4>
                                <div className="requests">
                                    <div className="scroll-area">
                                        {[...this.state.requests].map(({id, requestDate, requestor, assignmentId, assignmentTitle}) => (
                                            <Card key={id} className="request-card">
                                                <CardBody>
                                                    <div className="request-content">
                                                        <p><b>{requestor}</b> would like to collaborate on <b>{assignmentTitle}</b></p>
                                                            <Input 
                                                                type="text" 
                                                                id={id}
                                                                placeholder="Comment"
                                                            />
                                                        
                                                        
                                                        <p className="text-muted">{this.retrieveMoment(requestDate)}</p>
                                                    </div>
                                                    <div className="options">
                                                        <Button 
                                                            color="success"
                                                            size="sm"
                                                            onClick={() => this.ackRequest(id, assignmentId, assignmentTitle, true, requestor)}
                                                        >
                                                            Accept
                                                        </Button>

                                                        <Button 
                                                            color="danger"
                                                            size="sm"
                                                            onClick={() => this.ackRequest(id, assignmentId, assignmentTitle, false, requestor)}
                                                        >
                                                            Decline
                                                        </Button>
                                                    </div>
                                                    
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                    
                                </div>
                                <h4 className="text-muted">Notifications {`[${this.state.notifications.length}]`}</h4>
                                <div className="notification-area">
                                    <div className="scroll-area">
                                        {[...this.state.notifications].map(({id, assignmentId, assignmentTitle, alertCreate, alertMsg, alertObject, alertObjectTitle, alertType, alertUser}) => (
                                            <Card key={id} className="notification-card">
                                                <CardHeader>
                                                    <b>{alertUser} </b>
                                                    {alertType}{` ${alertObject} `}
                                                    <b>{alertObjectTitle} </b>
                                                    {` for assignment: `}
                                                    <b>{assignmentTitle}</b>
                                                    <span className="text-muted" title={alertCreate}>{this.retrieveMoment(alertCreate)}</span>
                                                </CardHeader>
                                                <CardBody>
                                                    <div className="notification-content">
                                                        <p className="text-muted">{alertMsg}</p>
                                                    </div>
                                                    {alertType !== "completed" && alertType !== "deleted" && 
                                                        <div className="options">
                                                            <Button 
                                                                color="primary"
                                                                onClick={() => this.selectAssignment(assignmentId)}
                                                            >View
                                                            </Button>
                                                        </div>
                                                    }
                                                    
                                                    
                                                </CardBody>
                                            </Card>
                                        ))}
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

export default Profile;
