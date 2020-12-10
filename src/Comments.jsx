import React from 'react';
import firebase from "firebase/app";
import 'firebase/auth'
import "firebase/firestore";
import "firebase/storage";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";
import moment from 'moment'
import Hotkeys from 'react-hot-keys';

//Reactstrap library (with a few sample components)
//https://reactstrap.github.io/components/
import {
    Button,
    Card,
    CardBody,
    Col,
    Input,
    Label,
    Row
} from "reactstrap";

var className = "assignment-comments"
var ps;


class Comments extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            user: this.props.user,
            assignmentId: this.props.assignmentId,
            commentCollabs: this.props.commentCollabs,
            defaultAvatar: this.props.defaultAvatar,
            comments: [],
            observer: {active: false, sub: null},
            firstRetrieve: false,
            newText: "",
            update: false,
            olderMessages: true,
            checkedOlder: false,
            editing: false,
            editId: "",
            editText: "",
            confirmDelete: false
        }
    }

    componentDidMount() {

        //check if an assignment was passed down as a prop
        let assignmentId = this.props.assignmentId;
        if (typeof assignmentId !== 'undefined') {
            //gather the first 10 comments
            this.retrieveComments(assignmentId)
            .then(() => {
                //configure the message observer
                this.configureCommentObserver(assignmentId)
            })
        } else {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    let email = user.email;
                    this.setState({user: email})
                    //retrieve the activeId from the user
                    firebase.firestore().collection('acp_users').doc(email).get()
                    .then(user => {
                        let assignmentId = user.get('active_id');
                        if (assignmentId !== "") {
                            //gather the first 10 comments
                            this.retrieveComments(assignmentId)
                            .then(() => {
                                //configure the message observer
                                this.configureCommentObserver(assignmentId)
                            })
                        }
                    })
                }
            });
            
        }
        
        this.setState({newText: "",  olderMessages: true})
        if (this.state.authenticated && navigator.platform.indexOf("Win") > -1) {
            document.documentElement.className += " perfect-scrollbar-on";
            document.documentElement.classList.remove("perfect-scrollbar-off");
            let tables = document.querySelectorAll(".scroll-comments");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i]);
              tables[i].scrollTop = tables[i].scrollHeight;
            }
          }
    }

    componentDidUpdate() {
        if (this.state.update) {
            try {
                //re-render: gather the first 10 comments
                let assignmentId = this.state.assignmentId;
                if (assignmentId) {
                    this.retrieveComments(assignmentId)
                    .then(() => {
                        //configure the message observer
                        this.configureCommentObserver(assignmentId)
                    })
                } else {
                    this.setState({comments: []})
                }
                    
                this.setState({update: false})
            } catch (err) {
                console.log("Caught exception in componentDidUpdate(): " + err)  
            }
           
        }
        if (this.state.comments.length > 0 && navigator.platform.indexOf("Win") > -1) {
            let tables = document.querySelectorAll(".scroll-comments");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i]);
              //&& !this.state.editing && !this.state.confirmDelete && tables[i].scrollTop < tables[i].scrollHeight-300
              if (this.state.firstRetrieve) {
                tables[i].scrollTop = tables[i].scrollHeight;
                this.setState({firstRetrieve: false})
              }
                
            }
          } else {
            let tables = document.querySelectorAll(".scroll-comments");
            for (let i = 0; i < tables.length; i++) {
                tables[i].scrollTop = 0;
            }
          }
      }

    componentWillUnmount() {
        try {
            let observer = this.state.observer;
            //destroy perfect scrollbar
            if (ps && navigator.platform.indexOf("Win") > -1 && ps) {
              ps.destroy();
            }
            if (observer.active) {
                observer.sub()
            }
        } catch (err) {
            console.log("Caught exception in componentWillUnmount(): " + err)
        }
        
    }

    static getDerivedStateFromProps(props, state) {
        if (typeof props.assignmentId !== 'undefined' && props.assignmentId !== state.assignmentId) {
            return {update: true, assignmentId: props.assignmentId, checkedOlder: false}
        } else if (typeof props.commentCollabs !== 'undefined' && Object.keys(props.commentCollabs).length > Object.keys(state.commentCollabs).length) {
            return {update: true, commentCollabs: props.commentCollabs, checkedOlder: false}
        }
        return null;
    }

    retrieveComments =  async assignmentId => {
        return new Promise((resolve) => {
            let comments = [];
            try {
                let commentCollabs = this.props.commentCollabs;
                firebase.firestore().collection('assignments').doc(assignmentId).collection('comments').orderBy('msg_create', 'desc').limit(10).get()
                .then(query => {
                    if (query.size > 0) {
                        let msgs = 0
                        query.forEach(msg => {
                            msgs++
                            let user = msg.get('msg_user');
                            let display;
                            let avatar;
                            if (typeof commentCollabs[user] !== 'undefined') {
                                display = commentCollabs[user].displayName;
                                avatar = commentCollabs[user].avatar;
                            } else {
                                display = user;
                                avatar = this.props.defaultAvatar;
                            }
                            let text = msg.get('msg_text');
                            let timestamp = msg.get('msg_create').toDate();
                            let edited = msg.get('msg_edited');
                            let newComment = { id: msg.id, user: user, displayName: display, avatar: avatar, timestamp: timestamp, text: text, edited: edited }
                            comments.push(newComment);
                            if (msgs >= query.size) {
                                comments.reverse()
                                this.setState({comments, olderMessages: true, firstRetrieve: true})
                                resolve()
                            }
                        })
                    } else {
                        this.setState({comments, olderMessages: true, firstRetrieve: true})
                        resolve()
                    }
                })
            } catch (err) {
                console.log("Caught exception in retrieveComments(): " + err)
                this.setState({comments, olderMessages: true, firstRetrieve: true})
                resolve()
            }
        })
      }

      configureCommentObserver = assignmentId => {
          try {
              let observer = {active: false, sub: null}
              observer.sub = firebase.firestore().collection('assignments').doc(assignmentId).collection('comments')
            .where('msg_create', '>', (new Date())).orderBy('msg_create').onSnapshot(query => {
                let comments = this.state.comments;
                let commentCollabs = this.props.commentCollabs;
                let msgs = 0
                query.forEach(msg => {
                    msgs++
                    let proceed = true;
                    for (let i=0;i<comments.length;i++) {
                        if (msg.id === comments[i].id) {
                            proceed = false;
                            break
                        }
                    }
                    if (proceed) {
                        let user = msg.get('msg_user');
                        let display;
                        let avatar;
                        if (typeof commentCollabs[user] !== 'undefined') {
                            display = commentCollabs[user].displayName;
                            avatar = commentCollabs[user].avatar;
                        } else {
                            display = user;
                            avatar = this.props.defaultAvatar;
                        }
                        let text = msg.get('msg_text');
                        let timestamp = msg.get('msg_create').toDate();
                        let edited = msg.get('msg_edited');
                        let newComment = { id: msg.id, user: user, displayName: display, avatar: avatar, timestamp: timestamp, text: text, edited: edited }
                        comments.push(newComment);
                    }
                    if (msgs >= query.size) {
                        this.setState({comments})
                        let section = document.querySelectorAll(".scroll-comments");
                        for (let i = 0; i < section.length; i++) {
                            section[i].scrollTop = section[i].scrollHeight;
                        }
                    }
                })
            });
            observer.active = true;
            this.setState({observer})
          } catch (err) {
            console.log("Caught exception in configureCommentobserver.sub(): " + err)
          }
        
      }

      retrieveOlderMessages = (e) => {
          try {
            e.preventDefault();
            let comments = this.state.comments;
            let olderMessages = this.state.olderMessages;
            if (olderMessages && comments.length >= 10) {
                let assignmentId = this.state.assignmentId;
                let commentCollabs = this.props.commentCollabs;
                //retrieve the date of the oldest visible chat
                let oldestDate = comments[0].timestamp;
                let tempComments = [];
                firebase.firestore().collection('assignments').doc(assignmentId).collection('comments')
                .where('msg_create', '<', oldestDate).orderBy('msg_create', 'desc').limit(10).get()
                    .then(query => {
                        if (query.size > 0) {
                            let msgs = 0
                            query.forEach(msg => {
                                msgs++
                                let user = msg.get('msg_user');
                                let display;
                                let avatar;
                                if (typeof commentCollabs[user] !== 'undefined') {
                                    display = commentCollabs[user].displayName;
                                    avatar = commentCollabs[user].avatar;
                                } else {
                                    display = user;
                                    avatar = this.props.defaultAvatar;
                                }
                                let text = msg.get('msg_text');
                                let timestamp = msg.get('msg_create').toDate();
                                let edited = msg.get('msg_edited');
                                let newComment = { id: msg.id, user: user, displayName: display, avatar: avatar, timestamp: timestamp, text: text, edited: edited }
                                tempComments.push(newComment);
                                if (msgs >= query.size) {
                                    //push comments content into tempComments
                                    tempComments.reverse()
                                    for (let i=0;i<comments.length;i++) {
                                        tempComments.push(comments[i]);
                                    }
                                    this.setState({comments: tempComments, checkedOlder: true})
                                }
                            })
                        } else {
                                this.setState({olderMessages: false, checkedOlder: true});
                        }
                })
            } else {
                    this.setState({olderMessages: false, checkedOlder: true});
            }
          } catch (err) {
            console.log("Caught exception in retrieveOlderMessages.sub(): " + err)
          }
        
      }

      retrieveMoment = timestamp => {
          return moment(timestamp).fromNow();
      }

    retrieveDate = timestamp => {
        let date = new Date(timestamp);
        return date.toLocaleString();
      }

    //lightweight function to update input value
    inputOnChange = evt => {
        try {
            let value = evt.target.value;
            let id = evt.target.id;
            this.setState({ [id]: value })
        } catch (err) {
            console.log("Caught exception in inputOnChange(): " + err)
        }
    }

    handleKeyDown = evt => {
        if(evt.charCode === 13){
            this.postNewComment();    
          } 
      }

      postNewComment = () => {
          try {
            let text = this.state.newText;
            if (text !== "") {
                let user = this.state.user;
                let comment = {
                    msg_user: user,
                    msg_create: new Date(),
                    msg_text: text
                }
                let assignmentId = this.state.assignmentId;
                firebase.firestore().collection('assignments').doc(assignmentId).collection('comments').add(comment);
                this.setState({newText: ""});
                //notify collaborators
                this.props.notifyCollaborators("comments", "", "added", text)
            }
          } catch (err) {
            console.log("Caught exception in postNewComment(): " + err)
          }
        
      }

      initiateEdit = (id, text) => {
          this.setState({editing: true, editId: id, editText: text})
      }

      saveEdit = oldText => {
          try {
            let editText = this.state.editText;
            let comments = this.state.comments;
            if (editText !== oldText) {
                let assignmentId = this.state.assignmentId;
                let editId = this.state.editId;
                
                //save to the db
                firebase.firestore().collection('assignments').doc(assignmentId).collection('comments')
                    .doc(editId).update({msg_text: editText, msg_edited: true});
                
                //update the current comments object
                for (let i=0;i<comments.length;i++) {
                    if (comments[i].id === editId) {
                        comments[i].text = editText;
                        comments[i].edited = true;
                        break;
                    }
                }
                //notify collaborators
                this.props.notifyCollaborators("comments", "", "edited", editText)
            }
            this.setState({editing: false, editId: "", editTexts: "", comments})
          } catch (err) {
            console.log("Caught exception in saveEdit(): " + err)
          }
        
      }

      deleteComment = id => {
        try {
            let assignmentId = this.state.assignmentId;
            //save to the db
            firebase.firestore().collection('assignments').doc(assignmentId).collection('comments')
                .doc(id).delete();
            
            //update the current comments object
            let comments = this.state.comments;
            comments = comments.filter(item => {
                if (item.id !== id) {
                    return item
                } else {
                    return null
                }
            })
            this.setState({confirmDelete: false, comments})
        } catch (err) {
            console.log("Caught exception in deleteComment(): " + err)
        }
      }


    render() {
        return (
            <>
            <Hotkeys 
                keyName="enter" 
                onKeyDown={this.postNewComment.bind(this)}
            ></Hotkeys>
            <div className={className}>
                <div className="scroll-comments">
                    {Object.keys(this.state.comments).length === 0 && 
                        <h5 className="text-muted">Be the First to Comment on this Assignment</h5>
                    }
                    {Object.keys(this.state.comments).length > 0 && 
                        <a href="#!" onClick={this.retrieveOlderMessages}>{this.state.olderMessages ? "Older Comments" : "No Older Comments"}</a>
                    }
                    {Object.keys(this.state.comments).length > 0 && 
                        [...this.state.comments].map(item => (
                            <Card key={item.id} className="comment-item">
                                <CardBody>
                                <div className="avatar">
                                    <div className="user-photo">
                                        <img alt="..." src={item.avatar} />
                                    </div>
                                </div>
                                <div className="content">
                                    <p>
                                        <b>{item.displayName}</b>
                                        <span 
                                            className="text-muted" 
                                            title={this.retrieveDate(item.timestamp)}
                                        >
                                            {" commented " + this.retrieveMoment(item.timestamp)}
                                            {item.edited ? " [edited]" : ""}
                                        </span>
                                    </p>
                                    {(item.id !== this.state.editId || this.state.confirmDelete) &&
                                        <p>{item.text}</p>
                                    }
                                    {this.state.editing && item.id === this.state.editId && 
                                    <Row>
                                        <Col md="8">
                                            <Input type="textarea" id="editText" value={this.state.editText} onChange={this.inputOnChange}/>
                                        </Col>
                                        <Col md="1">
                                            <Button
                                                color="success"
                                                size="sm"
                                                onClick={() => this.saveEdit(item.text)}
                                                >
                                                    Save
                                            </Button>
                                        </Col>
                                        <Col md="1">
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                onClick={() => this.setState({editing: false, editId: "", editTexts: ""})}
                                                >
                                                    Cancel
                                            </Button>
                                        </Col>
                                    </Row>
                                    }
                                </div>
                                {item.user === this.state.user && !this.state.editing && 
                                <div className="options">
                                    {item.id !== this.state.editId && 
                                        <div className="button-icons">
                                        <img alt="Edit" title="Edit" src="/images/edit-icon.png" onClick={() => this.initiateEdit(item.id, item.text)}/>
                                        <img alt="Delete" title="Delete" src="/images/delete-icon.png" onClick={() => {this.setState({editId: item.id, confirmDelete: true})}} />
                                        </div>
                                    }
                                    {this.state.confirmDelete && item.id === this.state.editId && 
                                    <div>
                                    <Row><Label>Delete Comment?</Label></Row>
                                    <Row>
                                        
                                        <Col md="4">
                                            <Button
                                                color="danger"
                                                size="sm"
                                                onClick={() => this.deleteComment(item.id)}
                                                >
                                                    Yes
                                            </Button>
                                        </Col>
                                        <Col md="4">
                                            <Button
                                                color="primary"
                                                size="sm"
                                                onClick={() => {this.setState({ editId: "", confirmDelete: false})}}
                                                >
                                                    No
                                            </Button>
                                        </Col>
                                    </Row>
                                    </div>
                                    }
                                </div>
                                }
                                </CardBody>
                            </Card>
                        ))
                    }
                </div>
                <Row>
                    <Col md="10">
                        <Input 
                            type="textarea" 
                            id="newText" 
                            value={this.state.newText} 
                            onChange={this.inputOnChange} 
                            onKeyPress={this.handleKeyDown}
                            disabled={!this.state.assignmentId || !this.props.canEdit}/>
                    </Col>
                    <Col md="2">
                        <Button
                            className="post-button"
                            color="primary"
                            size="md"
                            onClick={this.postNewComment}
                            disabled={!this.state.assignmentId || !this.props.canEdit}
                            >
                                Post
                        </Button>
                    </Col>
                </Row>
            </div>
            </>
        );
    }
}

export default Comments;
