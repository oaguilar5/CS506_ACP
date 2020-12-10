import React from 'react';
import Comments from './Comments.jsx'
import Files from './Files.jsx'


import firebase from "firebase/app";
import 'firebase/auth'
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
            user: this.props.user,
            userName: "",
            assignmentId: this.props.assignmentId,
            defaultAvatar: "",
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
            assignmentCreator: "",
            creator: "",
            created: "",
            assignmentTitle: "",
            title: "",
            due_date: "",
            is_private: false,
            sub_assignee: "",
            dod: "",
            description: "",
            status: "",
            is_complete: false,
            assignmentProgress: 0,
            progress: 0,
            collabs: [],
            collaborators: [],
            commentCollabs: {},
            canEdit: true,
            canView: true,
            infoDisabled: true,
            oldValue: null,
            assignmentView: true,
            subtaskId: "",
            progressLocked: false,
            confirmDeletion: false
        }
    }

    //Alerts: assignment completion, add/removal collaborator, change status, change progress
    // Comments: add/delete
    // Files: add/delete
    //Tasks: add/delete, change status, complete (need to implement task deletion)

    componentDidMount() {

        //initial auth check
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                let email = user.email;
                //update index.js global email
                this.props.updateGlobals(null, email, null);
                let profilePic = user.photoURL;
                let assignments = []
                this.checkForAssignments(email, assignments, true);
                this.setState({user: email, isAuthenticated: true})
                //retrieve the display name for the user
                firebase.firestore().collection('acp_users').doc(email).get()
                .then(user => {
                    let userName = user.get('display_name');
                    if (typeof userName === 'undefined' || userName === "") {
                        userName = email;
                    }
                    this.setState({userName})
                })
                //retrieve profile pic
                if (profilePic === "") {
                    //default if not set
                    profilePic = 'student-user.png'
                }
                firebase.storage().ref(profilePic).getDownloadURL()
                    .then(avatar => {
                        this.setState({ avatar })
                    })
                firebase.storage().ref("student-user.png").getDownloadURL()
                    .then(defaultAvatar => {
                        this.setState({ defaultAvatar })
                    })
                //check if an assignment was passed down as a prop
                let assignmentId = this.props.assignmentId;
                if (typeof assignmentId !== 'undefined') {
                    this.props.updateGlobals(assignmentId, null, null);
                    this.selectAssignment(assignmentId);
                    this.setState({assignmentId})
                } else {
                    //retrieve the activeId from the user
                    firebase.firestore().collection('acp_users').doc(email).get()
                        .then(user => {
                            let assignmentId = user.get('active_id');
                            if (assignmentId !== "") {
                                this.selectAssignment(assignmentId);
                                this.props.updateGlobals(assignmentId, null, null);
                                this.setState({assignmentId})
                            }
                        })
                }
                
            } else {
                //redirect to home page
                window.location.href = "/login"
            }
        });

        document.documentElement.className += " perfect-scrollbar-on";
        document.documentElement.classList.remove("perfect-scrollbar-off");
        let tables = document.querySelectorAll(".scroll-area");
        for (let i = 0; i < tables.length; i++) {
            ps = new PerfectScrollbar(tables[i], {
            suppressScrollX: true
            });
        }

    }

    componentDidUpdate(e) {
        if (e.history.action === "PUSH" || e.history.action === "POP") {
            let tables = document.querySelectorAll(".scroll-area");
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

      retrieveAssignmentDetails = id => {
        try {
            firebase.firestore().collection('assignments').doc(id).get()
            .then(doc => {
                if (doc.exists) {
                    let creator = doc.get('created_by');
                    let assignmentCreator = creator;
                    let created = doc.get('create_date');
                    let due_date = doc.get('due_date');
                    if (navigator.userAgent.indexOf("Firefox") !== -1) {
                        created = created.toDate().toISOString().split('T')[0];
                        due_date = due_date.toDate().toISOString().split('T')[0];
                    } else {
                        created = this.toDateFormat(created);
                        due_date = this.toDateFormat(due_date);
                    }
                    let title = doc.get('title');
                    let description = doc.get('description');
                    let status = doc.get('status')
                    let is_private =  doc.get('is_private');
                    let dod =  doc.get('dod');
                    let is_complete =  doc.get('is_complete');
                    let progress =  doc.get('progress');
                    let collabs = doc.get('collaborators');
                    if (Array.isArray(collabs)) {
                        this.retrieveCollaborators(collabs, assignmentCreator);
                    }
                    
                    let infoDisabled = false;
                    let canView = false;
                    let canEdit = false;
                    //check that this user
                    let user = this.state.user;
                    if (user === creator || collabs.includes(user)) {
                        canView = true;
                        canEdit = true;
                    } else if(!is_private) {
                        //if the user isn't a collaborator, they can at least view if not private
                        infoDisabled = true;
                        canView = true;
                    }
                    
                    if (this.state.user )
                    this.setState({
                        creator,
                        assignmentCreator,
                        created,
                        assignmentTitle: title, 
                        title, due_date, 
                        description, 
                        status, 
                        is_private, 
                        dod, 
                        is_complete, 
                        progress, 
                        assignmentProgress: progress, 
                        canView,
                        canEdit,
                        infoDisabled,
                        sub_assignee: ""
                    })
                }
            })
        } catch (err) {
            console.log("Caught exception in retrieveAssignmentDetails(): " + err)
        }

      }


      retrieveSubtaskDetails = id => {
          try {
            let assignmentId = this.state.assignmentId;
            if (id !== this.state.subtaskId) {
                firebase.firestore().collection('assignments').doc(assignmentId).collection('subtasks').doc(id).get()
                .then(doc =>{
                    let creator = doc.get('sub_created_by');
                    let created = doc.get('sub_create_date');
                    let due_date = doc.get('sub_due_date');
                    if (navigator.userAgent.indexOf("Firefox") !== -1) {
                        created = created.toDate().toISOString().split('T')[0];
                        due_date = due_date.toDate().toISOString().split('T')[0];
                    } else {
                        created = this.toDateFormat(created);
                        due_date = this.toDateFormat(due_date);
                    }
                    let title = doc.get('sub_title');
                    let description = doc.get('sub_description');
                    let status = doc.get('sub_status')
                    let dod =  doc.get('sub_dod');
                    let is_complete =  doc.get('sub_is_complete');
                    let progress =  doc.get('sub_progress');
                    let sub_assignee = doc.get('sub_assignee')
                    this.setState({assignmentView: false, subtaskId: id, creator, created, title, due_date, description, status, dod, is_complete, progress, sub_assignee})
                })
            } else {
                this.setState({assignmentView: true, assignmentId: assignmentId, subtaskId: ""})
                //reload the assignment page
                this.retrieveAssignmentDetails(assignmentId);
            }
          } catch (err) {
            console.log("Caught exception in retrieveSubtaskDetails(): " + err)
          }
        
      }

      retrieveCollaborators = async (collabs, creator) => {
          try {
            let collaborators = [];
            let commentCollabs = {};
            //start by adding this user's info to the map
            Object.assign(commentCollabs, {[this.state.user]: {displayName: this.state.userName, avatar: this.state.avatar, alertSettings: {}}})
            //retrieve details for the creator
            if (creator !== this.state.user) {
                let thisObj = {id: creator, displayName: "Unconfirmed User", avatar: this.state.defaultAvatar, creator: true};
                let commentObj = {[creator]: {displayName: creator, avatar: this.state.defaultAvatar, alertSettings: {}}}
                let userDoc = await firebase.firestore().collection('acp_users').doc(creator).get();
                if (userDoc.exists) {
                    let displayName = userDoc.get('display_name');
                    let avatar = userDoc.get('profile_pic');
                    let alertSettings = userDoc.get('alert_settings');
                    avatar = await firebase.storage().ref(avatar).getDownloadURL();
                    thisObj.id = userDoc.id;
                    thisObj.displayName = displayName;
                    thisObj.avatar = avatar;
                    commentObj[creator].displayName = displayName;
                    commentObj[creator].avatar = avatar;
                    commentObj[creator].alertSettings = alertSettings;
                }
                collaborators.push(thisObj);
                Object.assign(commentCollabs, commentObj)
            }
            //traverse the collabs email array to retrieve the user details
            for (let i=0;i<collabs.length;i++) {
                try {
                    let thisObj = {id: collabs[i], displayName: "Unconfirmed User", avatar: this.state.defaultAvatar};
                    let commentObj = {[collabs[i]]: {displayName: collabs[i], avatar: this.state.defaultAvatar, alertSettings: {}}}
                    let userDoc = await firebase.firestore().collection('acp_users').doc(collabs[i]).get();
                    if (userDoc.exists) {
                        let displayName = userDoc.get('display_name');
                        let avatar = userDoc.get('profile_pic');
                        let alertSettings = userDoc.get('alert_settings');
                        avatar = await firebase.storage().ref(avatar).getDownloadURL();
                        thisObj.id = userDoc.id;
                        thisObj.displayName = displayName;
                        thisObj.avatar = avatar;
                        commentObj[collabs[i]].displayName = displayName;
                        commentObj[collabs[i]].avatar = avatar;
                        commentObj[collabs[i]].alertSettings = alertSettings;
                    }
                    collaborators.push(thisObj);
                    Object.assign(commentCollabs, commentObj)
                } catch (err) {
                    console.log("Caught exception in retrieveCollaborators() loop, iteration: " + i + ",item: " + collabs[i] + " ,err: " + err)
                }
            }
            this.setState({collabs, collaborators, commentCollabs})
          } catch (err) {
            console.log("Caught exception in retrieveCollaborators(): " + err)
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
              } else if (firstQuery) {
                this.checkForAssignments(user, assignments, false)
              } else {
                this.setState({ assignments })
              }
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
            let assignments = [];
            this.checkForAssignments(user, assignments, true);
            this.setState({infoModal: true, infoMsg: "Successfully created Assignment!"})
        } catch (err) {
            console.log("Caught exception in createNewAssignment(): " + err);
            this.setState({assignmentModal: false, infoModal: true, infoMsg: "Failed to create new assignment. Please try again later."})
        }
      }

      createNewSubtask = async evt => {
        evt.preventDefault();
        try {
            let subtasks = this.state.subtasks;
            if (subtasks.length < 10) {
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
                //send notifications for this change
                let msg = `Due on ${dueDate}`
                this.notifyCollaborators("tasks", title, "added", msg);
                //recalculate progress
                let subtasksComplete = this.state.subtasksComplete;
                let subtaskCount = this.state.subtasks.length+1;
                this.calculateProgressPercent(subtaskCount, subtasksComplete)
            } else {
                this.setState({infoModal: true, infoMsg: "Unable to create subtask: Maximum number of subtasks per assignment reached"})
            }
        } catch(err) {
            console.log("Caught exception in createNewSubtask(): " + err);
            this.setState({subModal: false, infoModal: true, infoMsg: "Failed to create new subtask. Please try again later."})
        }
      }

      selectAssignment = id => {
        //update the index.js global var for assignmentId which will push down the prop
        this.props.updateGlobals(id, null, null);
        //save the active assignmentId to the user's doc for reference
        let user = this.state.user;
        firebase.firestore().collection('acp_users').doc(user).update({active_id: id});
        this.setState({assignmentView: true, assignmentId: id, subtaskId: "", subtasks: []})
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
                if (dataType === 'number') {
                    newVal = parseInt(newVal);
                } else if (dataType === 'datetime-local' || "date") {
                    newVal = new Date(newVal);
                }
                //create a reference to the assignment doc
                let id = this.state.assignmentId;
                let doc =  firebase.firestore().collection('assignments').doc(id);
                let fieldId = evt.target.id;
                //check if we're saving to the assignment or subtask
                let msg = `Changed status to: ${newVal}`;
                if (this.state.assignmentView) {
                    doc.update({[fieldId]: newVal});
                    if (fieldId === "status") {
                        //send notifications for this change
                        this.notifyCollaborators("assignments", "", "edited", msg);
                    }
                    
                } else {
                    //retrieve the subtask field name and save to subtask
                    fieldId = this.subtaskFields(fieldId);
                    let subtaskId = this.state.subtaskId;
                    doc.collection('subtasks').doc(subtaskId).update({[fieldId]: newVal});
                    if (fieldId === "sub_status") {
                        //send notifications for this change
                        let title = this.state.title;
                        this.notifyCollaborators("tasks", title, "edited", msg);
                    }
                }
               
            }
        } catch (err) {
            console.log("Caught exception in inputOnBlur(): " + err)
        }
    }

    subtaskFields = name => {
        let field = name;
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

    updatePrivacy = () => {
        try {
            let is_private = this.state.is_private;
            let assignmentId = this.state.assignmentId;
            firebase.firestore().collection('assignments').doc(assignmentId).update({is_private: !is_private})
            this.setState({is_private: !is_private})
        } catch (err) {
            console.log("Caught exception in updatePrivacy(): " + err)
        }
        
    }

    markComplete = () => {
        try {
            //construct the parent doc
            let assignmentId = this.state.assignmentId;
            let doc = firebase.firestore().collection('assignments').doc(assignmentId);
            //check if we're dealing with the assignment or subtask
            if (this.state.assignmentView) {
                doc.update({is_complete: true, status: "Done", progress: 100});
                //refresh the assignment sidebar
                let user = this.state.user;
                let assignments = [];
                this.checkForAssignments(user, assignments, true);
                //send notifications for this change
                this.notifyCollaborators("assignments", "", "completed", "");
            } else {
                let subtaskId = this.state.subtaskId;
                doc.collection('subtasks').doc(subtaskId).update({sub_is_complete: true, sub_status: "Done", sub_progress: 100});
                let subtaskCount = this.state.subtasks.length;
                let subtasksComplete = this.state.subtasksComplete+1;
                this.calculateProgressPercent(subtaskCount, subtasksComplete);
                //send notifications for this change
                let title = this.state.title;
                this.notifyCollaborators("tasks", title, "completed", "");
                //refresh the subtask sidebar
                this.checkForSubtasks(assignmentId);
            }
            //mark our state var complete
            this.setState({is_complete: true, status: "Done", progress: 100})
        } catch (err) {
            console.log("Caught exception in markComplete(): " + err)
        }
        
    }

    //TODO: add calculation for when a new subtask is created to recalculate the percent which would be greater
    calculateProgressPercent = (subtaskCount, subtasksComplete) => {
        let calc = (subtasksComplete/subtaskCount)*100;
        let assignmentId = this.state.assignmentId;
        firebase.firestore().collection('assignments').doc(assignmentId).update({progress: calc});
        this.setState({assignmentProgress: calc, subtasksComplete})
        
    }

    inviteCollaborator = evt => {
        try {
            evt.preventDefault();
            let email = evt.target.elements.namedItem("student-email").value;
            evt.target.elements.namedItem("student-email").value = "";
            if (email !== this.state.assignmentCreator) {
                let collabs = this.state.collabs;
                if (collabs.length < 10) {
                    if (!collabs.includes(email)) {
                        collabs.push(email);
                        this.retrieveCollaborators(collabs, this.state.assignmentCreator);
                        //save to assignment doc
                        let assignmentId = this.state.assignmentId;
                        firebase.firestore().collection('assignments').doc(assignmentId).update({collaborators: collabs})
                            .then(() => {
                                this.setState({collabs, infoModal: true, infoMsg: "Successfully added collaborator: " + email})
                                //send notifications for this change
                                this.notifyCollaborators("assignments", "", "edited", `Invited ${email} to collaborate`);
                            })
                    } else {
                        this.setState({infoModal: true, infoMsg: email + " is already a collaborator for this assignment"})
                    }
                } else {
                    this.setState({infoModal: true, infoMsg: "Unable to add collaborator: Maximmum number of collaborators reached."})
                }
            } else {
                this.setState({infoModal: true, infoMsg: `Unable to add collaborator: ${email} is the creator of this assignment`})
            }
        } catch (err) {
            console.log("Caught exception in inviteCollaborator(): " + err)
        }
    }

    removeCollaborator = email => {
        try {
            let collabs = this.state.collabs;
            if (collabs.includes(email)) {
                collabs = collabs.filter(item => {if (item !== email) {return item} else {return null}});
                this.retrieveCollaborators(collabs, this.state.assignmentCreator);
                this.setState({collabs})
                //save to assignment doc
                let assignmentId = this.state.assignmentId;
                firebase.firestore().collection('assignments').doc(assignmentId).update({collaborators: collabs})
                .then(() => {
                    this.setState({infoModal: true, infoMsg: "Successfully removed collaborator: " + email})
                    //send notifications for this change
                    let msg = `Removed ${email} from collaborators`;
                    this.notifyCollaborators("assignments", "", "edited", msg);
                })
            }
        } catch (err) {
            console.log("Caught exception in removeCollaborator(): " + err)
        }

    }

    toDateFormat = timestamp => {
        let string = "";
        try {
            let thisDate = timestamp.toDate();
            string = thisDate.toISOString().substring(0, 11) + thisDate.getHours()
                .toString().padStart(2, "0") + ":" + thisDate.getMinutes().toString().padStart(2, "0");

        } catch (err) {
            //no output for this method
        }
        return string
    }

    notifyCollaborators = (object, objectTitle, type, msg) => {
        
            let commentCollabs = this.state.commentCollabs;
            let assignmentId = this.state.assignmentId;
            let assignmentTitle = this.state.assignmentTitle;
            let userName = this.state.userName;
            if (!userName) {
                userName = this.state.user;
            }
            //define the alert object
            let body = {
                alert_create: new Date(),
                alert_user: userName,
                alert_msg: msg,
                alert_object: object,
                alert_type: type,
                alert_assignment_id: assignmentId,
                alert_assignment_title: assignmentTitle,
                alert_object_title: objectTitle
            }
            //traverse through each collaborator
            for (let [user, value] of Object.entries(commentCollabs)) {
                try {
                    if (user !== this.state.user) {
                        let alertSettings = value.alertSettings;
                        //determine if this user has settings on
                        if (alertSettings.alerts_on) {
                            
                            let ref = firebase.firestore().collection('acp_users').doc(user).collection('notifications');
                            switch (object) {
                                case 'comments':
                                    if (alertSettings.comments) {
                                        ref.add(body);
                                    }
                                    break;
                                case 'files':
                                    if (alertSettings.files) {
                                        ref.add(body);
                                    }
                                    break;
                                case 'tasks':
                                    if (alertSettings.tasks) {
                                        ref.add(body);
                                    }
                                    break;
                                default:
                                    ref.add(body);
                                    break
                            }
                        }
                    }
                } catch (err) {
                    console.log("Caught exception in notifyCollaborators() traversing collaborators for user: " + user + ", err:" + err)
                }
            }
        
        
    }

    deleteItem = async () => {
        try {
            let assignmentId = this.state.assignmentId;
            let ref = firebase.firestore().collection('assignments').doc(assignmentId)
            if (this.state.assignmentView) {
                //query each object and delete the subcollections
                this.deleteCollection(assignmentId, "comments")
                .then(this.deleteCollection(assignmentId, "files"))
                .then(this.deleteCollection(assignmentId, "subtasks"))
                .then(this.deleteCollection(assignmentId, "requests"))
                .then(ref.delete())
                .then(() => {
                    this.notifyCollaborators("assignments", "", "deleted", "");
                    let user = this.state.user;
                    firebase.firestore().collection('acp_users').doc(user).update({active_id: ""});
                    let assignments = this.state.assignments;
                    assignments = assignments.filter(item => {
                        if (item.id !== assignmentId) {
                            return item;
                        } else {
                            return null
                        }
                    })
                    this.setState({
                        assignments,
                        infoModal: true, 
                        infoMsg: `Successfully deleted asignment`,
                        assignmentId: "",
                        subtasks: [],
                        subtasksComplete: 0,
                        creator: "",
                        created: "",
                        assignmentTitle: "",
                        title: "",
                        due_date: "",
                        is_private: false,
                        sub_assignee: "",
                        dod: "",
                        description: "",
                        status: "",
                        is_complete: false,
                        assignmentProgress: 0,
                        progress: 0,
                        collabs: [],
                        collaborators: [],
                        commentCollabs: {},
                        confirmDeletion: false,
                        infoDisabled: true,
                        oldValue: null,
                        subtaskId: "",
                        progressLocked: false,
                    })
                }).catch(err => {
                    console.log(`Error deleting subcollections for assignment ${assignmentId}. Err: ${err}`)
                    this.setState({infoModal: true, infoMsg: `Error deleting assignment. Please try again later`})
                })
                
            } else {
                let subtaskId = this.state.subtaskId;
                let title = this.state.title;
                ref.collection('subtasks').doc(subtaskId).delete()
                    .then(() => {
                        //recalculate progress
                        let isComplete = this.state.isComplete;
                        let subtasksComplete = this.state.subtasksComplete;
                        let subtaskCount = this.state.subtasks.length-1;
                        if (isComplete) {
                            subtasksComplete--;
                        }
                        this.calculateProgressPercent(subtaskCount, subtasksComplete)
                        this.notifyCollaborators("tasks", title, "deleted", "");
                        this.setState({
                            infoModal: true, 
                            infoMsg: `Successfully deleted subtask`,
                            confirmDeletion: false
                        });
                        this.selectAssignment(assignmentId);
                    }).catch(err => {
                        console.log(`Error deleting subtask ${subtaskId}. Err: ${err}`)
                        this.setState({infoModal: true, infoMsg: `Error deleting subtask. Please try again later`})
                    })
                
            }
        } catch (err) {
            console.log("Caught exception in deleteItem(): " + err)
            this.setState({infoModal: true, infoMsg: `Error deleting item. Please try again later`})
        }
        
    }

    deleteCollection = async (assignmentId, collection) => {
        return new Promise((resolve, reject) => {
            try {
                firebase.firestore().collection('assignments').doc(assignmentId).collection(collection).get()
                    .then(query => {
                        if (query.size > 0) {
                            let docs = 0;
                            query.forEach(async doc => {
                                docs++;
                                await doc.ref.delete();
                                if (docs >= query.size) {
                                    resolve();
                                }
                            })
                        } else {
                            resolve()
                        }
                    })
            } catch (err) {
                console.log("Caught exception in deleteCollection(): " + err)
                reject()
            }
            
        });
    }

    requestAccess = () => {
        try {
            let assignmentId = this.state.assignmentId;
            let thisUser = this.state.user;
            let docRef = firebase.firestore().collection('assignments').doc(assignmentId);
            //check to see if the assignment already has max # of collaborators
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
                                    infoModal: true, 
                                    infoMsg: "Successfully requested access to this assignment. Please wait while the creator or a collaborator review the request."
                                })
                            });
                    } else {
                        this.setState({infoModal: true, infoMsg: "You already have a pending request for this assignment"})
                    }
                });
        } catch (err) {
            console.log("Caught exception in requestAccess(): " + err)
            this.setState({infoModal: true, infoMsg: "Failed to request access, please try again later."})
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
                    <Modal isOpen={this.state.infoModal} toggle={() => this.toggleModal('infoModal')}>
                        <ModalHeader toggle={() => this.toggleModal('infoModal')}>Notice</ModalHeader>
                        <ModalBody>
                            {this.state.infoMsg}
                        </ModalBody>
                        <ModalFooter>
                            {!this.state.confirmDeletion && 
                                <Button color={this.state.buttonColor} onClick={() => this.toggleModal('infoModal')}>Ok</Button>
                            }
                            {this.state.confirmDeletion && 
                            <Row>
                                <Col md="4"><Button color="danger" size="sm" onClick={this.deleteItem}>Delete</Button></Col>
                                <Col md="4"><Button color="secondary" size="sm" onClick={() => this.toggleModal('infoModal')}>Cancel</Button></Col>
                            </Row>
                                
                            }
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
                                <Input name="dueDate" type={navigator.userAgent.indexOf("Firefox") !== -1 ? "date" : "datetime-local"} required />
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
                                <Input name="createDate" type={navigator.userAgent.indexOf("Firefox") !== -1 ? "date" : "datetime-local"} disabled value={new Date().toLocaleDateString()} />
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
                                <Input name="sub_dueDate" type={navigator.userAgent.indexOf("Firefox") !== -1 ? "date" : "datetime-local"} required />
                            </Col>
                            </Row>
                            <Row>
                                <Col md="8">
                                    <Label>Assignee</Label>
                                    <Input name="sub_assignee" type="select" >
                                        <option />
                                        {[...this.state.collabs].map(email => (
                                            <option key={email}>{email}</option>
                                        ))}
                                    </Input>
                                </Col>
                            </Row>
                            <Row>
                            <Col md="6">
                                <Label>Created By</Label>
                                <Input name="sub_creator" type="text" disabled value={this.state.user} />
                            </Col>
                            <Col md="6">
                                <Label>Create Date</Label>
                                <Input name="sub_createDate" type={navigator.userAgent.indexOf("Firefox") !== -1 ? "date" : "datetime-local"} disabled value={new Date().toLocaleDateString()} />
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
                                <CardHeader>{"My Open Assignments [" + this.state.assignments.length + "]"}</CardHeader>
                                <CardBody>
                                    <div className="scroll-area">
                                        <div className="centered-button">
                                            <Button
                                                type="submit"
                                                color={this.state.buttonColor}
                                                onClick={() => this.toggleModal('assignmentModal')}
                                                >
                                                Create Assignment
                                            </Button>
                                        </div>
                                        {[...this.state.assignments].map(item => (
                                            <Card 
                                                key={item.id} 
                                                className={item.id === this.state.assignmentId ? "sidebar-card item-selected" : "sidebar-card"} 
                                                onClick={() => this.selectAssignment(item.id)}>
                                            <CardHeader><b>{item.title}{item.id === this.state.assignmentId ? " [Selected]" : ""}</b></CardHeader>
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
                                <div className="title">
                                    {this.state.assignmentView && <h5>{this.state.assignmentTitle}</h5>}
                                    {!this.state.assignmentView && 
                                        <h5><a 
                                            href="#!" 
                                            onClick={() => {
                                                let assignmentId = this.state.assignmentId;
                                                this.setState({assignmentView: true, assignmentId: assignmentId, subtaskId: ""});
                                                //reload the assignment page
                                                this.retrieveAssignmentDetails(assignmentId);
                                            }}>
                                                {this.state.assignmentTitle}
                                            </a>
                                            <span> / {this.state.title}</span>
                                            
                                        </h5>
                                    }
                                    {!this.state.canView && 
                                        <p className="text-muted">This assignment is private</p>
                                    }
                                    {!this.state.canEdit && 
                                        <span className="text-muted">
                                            You are not currently a collaborator for this assignment  
                                            <Button 
                                                color="success"
                                                onClick={() => this.requestAccess()}
                                            >
                                                Request Access
                                            </Button>
                                        </span>
                                    }
                                </div>
                                
                            {this.state.canView && 
                                <div>
                                    <div className="assignment-general">
                                        <Row>
                                            <Col md="5">
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
                                            <Col md="3">
                                                <Label>Created By</Label>
                                                <Input 
                                                    type="text" 
                                                    id="creator"  
                                                    value={this.state.creator} 
                                                    disabled
                                                    />
                                            </Col>
                                            <Col md="4">
                                                <Label>Create Date</Label>
                                                <Input 
                                                    type={navigator.userAgent.indexOf("Firefox") !== -1 ? "date" : "datetime-local"} 
                                                    id="create_date"  
                                                    value={this.state.created}
                                                    disabled
                                                    />
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md="5">
                                                <Label>Due Date</Label>
                                                <Input 
                                                    type={navigator.userAgent.indexOf("Firefox") !== -1 ? "date" : "datetime-local"}
                                                    id="due_date"  
                                                    value={this.state.due_date}
                                                    onChange={this.inputOnChange} 
                                                    onFocus={this.inputOnFocus}
                                                    onBlur={this.inputOnBlur}
                                                    disabled={this.state.infoDisabled}/>
                                            </Col>
                                            <Col md="3">
                                                    <Label>Assignee</Label>
                                                    <Input 
                                                        type="select" 
                                                        id="sub_assignee" 
                                                        value={this.state.sub_assignee} 
                                                        onChange={this.inputOnChange} 
                                                        onFocus={this.inputOnFocus}
                                                        onBlur={this.inputOnBlur}
                                                        disabled={this.state.assignmentView || this.state.infoDisabled}>
                                                        <option />
                                                        {[...this.state.collabs].map(email => (
                                                            <option key={email}>{email}</option>
                                                        ))}
                                                    </Input>
                                                </Col>
                                                <Col md="4">
                                                    <CustomInput 
                                                        type="switch" 
                                                        id="is_private"  
                                                        label="Private" 
                                                        checked={this.state.is_private} 
                                                        onChange={this.updatePrivacy} 
                                                        disabled={!this.state.assignmentView || this.state.infoDisabled}/>
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
                                            <Comments 
                                                assignmentId={this.state.assignmentId}
                                                commentCollabs={this.state.commentCollabs}
                                                defaultAvatar={this.state.defaultAvatar}
                                                user={this.state.user}
                                                notifyCollaborators={this.notifyCollaborators}
                                                canEdit={this.state.canEdit}
                                                />
                                            </TabPane>
                                            <TabPane tabId="2">
                                                <Files 
                                                    assignmentId={this.state.assignmentId}
                                                    user={this.state.user}
                                                    notifyCollaborators={this.notifyCollaborators}
                                                    canEdit={this.state.canEdit}
                                                />
                                            </TabPane>
                                        </TabContent>
                                    </div>
                                </div>
                            }
                            
                        </div>
                        <div className="assignment-info">
                            <div className="scroll-area">
                                <Card className="status-card">
                                    <CardHeader onClick={() => this.toggleInfoCards('statusVisible')}>Progression</CardHeader>
                                    {this.state.canView && 
                                        <CardBody style={{display: this.state.statusVisible}}>
                                        <Row>
                                            <Col xs="4" sm="4" md="4" lg="3" xl="2"><Label>Status</Label></Col>
                                            <Col xs="8" sm="8" md="8" lg="9" xl="10">
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
                                            <Col sm="4" md="5">
                                            {/* <Label>Complete</Label> */}
                                            <CustomInput id="is_complete" type="switch" label="Complete" checked={this.state.is_complete} disabled/>
                                            </Col>
                                            <Col xs="2" sm="5" md="3">
                                                <Button
                                                    color={this.state.buttonColor}
                                                    size="sm"
                                                    disabled={this.state.infoDisabled || this.state.is_complete}
                                                    onClick={() => this.markComplete()}
                                                    >
                                                        Complete
                                                    </Button>
                                            </Col>
                                            <Col xs="2" sm="5" md="3">
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    disabled={this.state.infoDisabled}
                                                    onClick={() => {
                                                        let item = this.state.assignmentView ? "assignment" : "subtask";
                                                        this.setState({
                                                            infoModal: true, 
                                                            confirmDeletion: true, 
                                                            infoMsg: `Warning! This will permanently delete this ${item}. Are you sure?`
                                                        })}}
                                                    >
                                                        Delete
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
                                    }
                                    
                                </Card>
                                <Card className="subtask-card">
                                    <CardHeader onClick={() => this.toggleInfoCards('subtaskVisible')}>{"Subtasks [" + this.state.subtasks.length + "]"}</CardHeader>
                                    {this.state.canView && 
                                        <CardBody style={{display: this.state.subtaskVisible}}>
                                        <div className="centered-button">
                                            <Button
                                                type="submit"
                                                color={this.state.buttonColor}
                                                disabled={this.state.infoDisabled || !this.state.assignmentView}
                                                onClick={() => this.toggleModal('subModal')}
                                                >
                                                Create Subtask
                                            </Button>
                                        </div>
                                                
                                        
                                        {Object.keys(this.state.subtasks).length === 0 && 
                                            <Row>
                                                <Col sm="12" md={{ size: 8, offset: 3 }}>
                                                <p className="text-muted">No Subtasks for this Assignment</p>
                                                </Col>
                                            </Row>
                                        }
                                        {Object.keys(this.state.subtasks).length > 0 && 
                                            [...this.state.subtasks].map(item => (
                                                <Card 
                                                    key={item.id} 
                                                    className={item.id === this.state.subtaskId ? "subtask-item item-selected" : "subtask-item"} 
                                                    onClick={() => this.retrieveSubtaskDetails(item.id)}>
                                                <CardHeader><b>{item.title}{item.id === this.state.subtaskId ? " [Selected]" : ""}</b></CardHeader>
                                                <CardBody>
                                                    <p><b>Due Date:</b> {item.dueDate}</p>
                                                    <p><b>Status:</b> {item.status}</p>
                                                </CardBody>
                                                </Card>
                                            ))
                                        }    
                                        </CardBody>
                                    }
                                    
                                </Card>
                                <Card className="collaborator-card">
                                    <CardHeader onClick={() => this.toggleInfoCards('collabVisible')}>{"Collaborators [" + this.state.collabs.length + "]"}</CardHeader>
                                    {this.state.canView && 
                                        <CardBody style={{display: this.state.collabVisible}}>
                                            <Form onSubmit={this.inviteCollaborator}>
                                            <Row>
                                                <Col md="8">
                                                    <Input type="email" name="student-email" placeholder="Student Email" disabled={this.state.infoDisabled}/>
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
                                            </Form>
                                            {Object.keys(this.state.collaborators).length === 0 && 
                                                <Row>
                                                    <Col sm="12" md={{ size: 9, offset: 2 }}>
                                                        <p className="text-muted">No Collaborators for this Assignment</p>
                                                    </Col>
                                                </Row>
                                            }
                                            {Object.keys(this.state.collaborators).length > 0 &&
                                                [...this.state.collaborators].map(item => (
                                                    <Card key={item.id} className="collaborator-item">
                                                        <CardBody>
                                                        <div className="avatar">
                                                            <div className="user-photo">
                                                                <img alt="..." src={item.avatar} />
                                                            </div>
                                                        </div>
                                                        <div className="info">
                                                            <p>{item.displayName}</p>
                                                            <p className="text-muted">{item.id}</p>
                                                        </div>
                                                        {!item.creator && this.state.user === this.state.assignmentCreator && 
                                                            <div className="options"><span><a href="#!" onClick={() => {this.removeCollaborator(item.id)}}>Remove</a></span></div>
                                                        }
                                                        {item.creator && 
                                                            <div className="options text-muted"><span>Creator</span></div>
                                                        }
                                                        </CardBody>
                                                    </Card>
                                                ))
                                            }
                                        </CardBody>
                                    }
                                    
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
