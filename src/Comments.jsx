import React from 'react';
import firebase from "firebase/app";
import 'firebase/auth'
import "firebase/firestore";
import "firebase/storage";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";
import moment from 'moment'
import SimpleStorage from "react-simple-storage";

//Reactstrap library (with a few sample components)
//https://reactstrap.github.io/components/
import {
    Button,
    Card,
    CardBody,
    Col,
    Input,
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
            newText: "",
            update: false,
            olderMessages: true,
            checkedOlder: false
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
                this.retrieveComments(assignmentId)
                .then(() => {
                    //configure the message observer
                    this.configureCommentObserver(assignmentId)
                })
                this.setState({update: false})
            } catch (err) {
                console.log("Caught exception in componentDidUpdate(): " + err)  
            }
           
        }
        if (this.state.comments.length > 0 && navigator.platform.indexOf("Win") > -1) {
            let tables = document.querySelectorAll(".scroll-comments");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i]);
              if (!this.state.checkedOlder && tables[i].scrollTop < tables[i].scrollHeight-300) {
                tables[i].scrollTop = tables[i].scrollHeight;
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
        } else if (Object.keys(props.commentCollabs).length > Object.keys(state.commentCollabs).length) {
            return {update: true, commentCollabs: props.commentCollabs, checkedOlder: false}
        }
        return null;
    }

    retrieveComments =  async assignmentId => {
        return new Promise((resolve) => {
            let comments = [];
            try {
                let commentCollabs = this.state.commentCollabs;
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
                            let newComment = { id: msg.id, displayName: display, avatar: avatar, timestamp: timestamp, text: text }
                            comments.push(newComment);
                            if (msgs >= query.size) {
                                comments.reverse()
                                this.setState({comments})
                                resolve()
                            }
                        })
                    } else {
                        this.setState({comments})
                        resolve()
                    }
                })
            } catch (err) {
                console.log("Caught exception in retrieveComments(): " + err)
                this.setState({comments})
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
                let commentCollabs = this.state.commentCollabs;
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
                        let newComment = { id: msg.id, displayName: display, avatar: avatar, timestamp: timestamp, text: text }
                        comments.push(newComment);
                    }
                    if (msgs >= query.size) {
                        this.setState({comments})
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
                let commentCollabs = this.state.commentCollabs;
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
                                let newComment = { id: msg.id, displayName: display, avatar: avatar, timestamp: timestamp, text: text }
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
            this.setState({ newText: value })
        } catch (err) {
            console.log("Caught exception in inputOnChange(): " + err)
        }
    }

      postNewComment = () => {
        let text = this.state.newText;
        let user = this.state.user;
        let comment = {
            msg_user: user,
            msg_create: new Date(),
            msg_text: text
        }
        let assignmentId = this.state.assignmentId;
        firebase.firestore().collection('assignments').doc(assignmentId).collection('comments').add(comment);
        this.setState({newText: ""});
        let section = document.querySelectorAll(".scroll-comments");
        for (let i = 0; i < section.length; i++) {
            section[i].scrollTop = section[i].scrollHeight;
        }
      }


    render() {
        return (
            <>
            <SimpleStorage
                parent={this}
                prefix={ 'comments-page_' }
            />
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
                                        <span className="text-muted" title={this.retrieveDate(item.timestamp)}>{" commented " + this.retrieveMoment(item.timestamp)}</span>
                                    </p>
                                    <p>{item.text}</p>
                                </div>
                                </CardBody>
                            </Card>
                        ))
                    }
                </div>
                <Row>
                    <Col md="10">
                        <Input type="textarea" value={this.state.newText} onChange={this.inputOnChange}/>
                    </Col>
                    <Col md="2">
                        <Button
                            color="primary"
                            size="md"
                            onClick={this.postNewComment}
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
