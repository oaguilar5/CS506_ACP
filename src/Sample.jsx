/*!

=========================================================
* Sample JSX Page
=========================================================

Author: Oscar Aguilar
Resources: sited below

=========================================================


*/
import React, { Component } from "react";

// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

//Firebase Web SDK
import firebase from "firebase/app";
import "firebase/firestore";
import 'firebase/auth'


//Reactstrap library (with a few sample components)
//https://reactstrap.github.io/components/
import {  
    Button,
    ButtonGroup,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardTitle,
    CardText,
    Col,
    Input,
    Label,
    Modal, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Row
} from "reactstrap";

//Globals
var className = "demo-sample"
var ps;

class Sample extends Component {

    //class constructor where an initial state and code can be defined before any html is rendered
    //Long-running or data-fetching code is not recommended here and should be placed in componentDidMount instead
    constructor(props){
        super(props)
        this.state = {
            buttonColor: "primary",
            first: "",
            last: "",
            email: "",
            pets: 0,
            com1: "",
            com2: "",
            modal: false,
            userRecords: [],
            currentDoc: "",
            observer: null,
            saveDisabled: true
        }
    }

    /*///////////////////////////// LIFECYCLE FUNCTIONS *//////////////////////////////////////////////////////////
        
    //This lifecycle function runs code after the component has successfully rendered
    //Useful for creating subscription and fetching data
    componentDidMount() {

        //initial check on firebase to see if there are any existing user records
        this.checkForRecords()

        //Initialize perfect scrollbar on all containers with className= "add-scrollbar"
        if (navigator.platform.indexOf("Win") > -1) {
          document.documentElement.className += " perfect-scrollbar-on";
          document.documentElement.classList.remove("perfect-scrollbar-off");
          ps = new PerfectScrollbar(this.refs.mainPanel, { suppressScrollX: true });
          let tables = document.querySelectorAll(".add-scrollbar");
          for (let i = 0; i < tables.length; i++) {
            ps = new PerfectScrollbar(tables[i]);
          }
        }
    }

    //This lifecycle function runs after every re-render. There is a re-render after every state update/change
    componentDidUpdate(e) {
        //Re-render the scrollbar when webpage was added or removed from the history stack
        if (e.history.action === "PUSH" || e.history.action === "POP") {
          if (ps && navigator.platform.indexOf("Win") > -1) {
            let tables = document.querySelectorAll(".add-scrollbar");
            for (let i = 0; i < tables.length; i++) {
              ps = new PerfectScrollbar(tables[i]);
            }
          }
          //uncomment to make the page scroll to the top on re-renders
          // document.documentElement.scrollTop = 0;
          // document.scrollingElement.scrollTop = 0;
        }
      }

    //This lifecycle function runs as a tear down of the component. Use for unsubscribing
    componentWillUnmount() {
        //destroy the scrollbar if present
        if (ps && navigator.platform.indexOf("Win") > -1) {
          ps.destroy();
          document.documentElement.className += " perfect-scrollbar-off";
          document.documentElement.classList.remove("perfect-scrollbar-on");
        }

        //if there is a firebase observer, unsub it
        let observer = this.state.observer;
        if (observer) {
            observer();
        }
      }

      /*/////////////////////////// USER DEFINED FUNCTIONS *////////////////////////////////////////////////////

      //query the 'demo' collection for all docs and store them in the userRecords array
      checkForRecords = () => {
          try {
            let userRecords = [];
            firebase.firestore().collection('bunnies').get()
                .then(query => {
                    //since forEach is async, keep count and update state once all have been traversed
                    let count = 0;
                    query.forEach(doc => {
                        count++;
                        userRecords.push(doc.id);
                        if (count >= query.size) {
                            this.setState({userRecords})
                        }
                    })
                });
          } catch (err) {
            console.log("Caught exception in checkForRecords(): " + err)
          }
      }

      //Simple switch/case function to change the color/text of the button
      buttonOnClick = () => {
          let color = this.state.buttonColor;
          switch (color) {
            case 'primary':
                color = 'secondary';
                break;
            case 'secondary':
                color = 'success';
                break;
            case 'success':
                color = 'info';
                break;
            case 'info':
                color = 'warning';
                break;
            case 'warning':
                color = 'danger';
                break;
            case 'danger':
                color = 'link';
                break;
            case 'link':
                color = 'primary';
                break;
            default:
                break;
          }
        this.setState({buttonColor: color});
      }

      //set modal to its negated value
      toggleModal = () => {
          this.setState(prevState => {return {modal: !prevState.modal}})
      }

      //lightweight function to update input value
      inputOnChange = evt => {
        let value = evt.target.value;
        let id = evt.target.id;
        this.setState({[id]: value})
      }

      //Lightweight function to create a new doc in Firestore
    createUserDoc = () => {
        try {
            //first check if we have the first and last name to continue, else present an error msgbox
            let first = this.state.first;
            let last = this.state.last;
            let docName = first + "_" + last;
            if ((first !== "" && last !== "") && docName !== this.state.currentDoc) {
                //gather the remaining input values
                let email = this.state.email;
                let pets = this.state.pets;
                let com1 = this.state.com1;
                let com2 = this.state.com2;
                //construct the object that will comprise of the doc contents
                //notice that here we define explicit naming conventions in the database
                let body = {
                    first_name: first,
                    last_name: last,
                    user_email: email,
                    pet_count: pets,
                    comment_1: com1,
                    comment_2: com2
                }
                //save to firebase, used a static collection 'demo' for now
                firebase.firestore().collection('demo').doc(docName).set(body);
                let userRecords = this.state.userRecords;
                //add the new entry to the existing records select
                if (!userRecords.includes(docName)) {
                    userRecords.push(docName);
                }
                this.setState({userRecords, currentDoc: docName, modal : true, infoMsg: "Successfully created a new Firestore doc!"});
            } else {
                this.setState({modal : true, infoMsg: "Please fill in a non-existing first and last name to create a new Firestore doc"});
            }
        } catch (err) {
            console.log("Caught exception in createUserDoc(): " + err)
        }
    }

    //Create an observer for the selected doc to bring in real time data updates (try changing data in the firebase console or a different browser)
    selectUserDoc = evt => {
        try {
            //gather the selected option
            let docName = evt.target.options[evt.target.selectedIndex].value;
            if (docName !== "") {
                //create an observer to gather the contents of the document to update our state
                //this observer will run each time there is an update to the doc
                let observer = firebase.firestore().collection('demo').doc(docName).onSnapshot(snapshot => {
                    //gather the contents to update our input state values
                    let first = snapshot.get('first_name');
                    let last  = snapshot.get('last_name');
                    let email = snapshot.get('user_email');
                    let pets = snapshot.get('pet_count');
                    let com1 = snapshot.get('comment_1');
                    let com2 = snapshot.get('comment_2');
                    this.setState({first, last, email, pets, com1, com2})
                })
                //notify the user, enable the save button, log the currentDoc, and save the observer subscription
                this.setState({saveDisabled: false, currentDoc: docName, observer, modal : true, infoMsg: "Selected the doc: " + docName + "!"});
            } else {
                //if a blank doc was selected, make sure the save button is disabled and values are blanked out
                this.setState({saveDisabled: true, first: "", last: "", email: "", pets: 0, com1: "", com2: ""});
                //if there was an existing observer, unsubscribe it
                let observer = this.state.observer;
                if (observer) {
                    observer();
                }
            }
        } catch (err) {
            console.log("Caught exception in selectUserDoc(): " + err)
        }
    }

    //simple function to gather the state variables assigned to each input value and save them to the selected firebase doc
    saveUserDoc = () => {
        try {
            let first = this.state.first;
            let last = this.state.last;
            let email = this.state.email;
            let pets = this.state.pets;
            let com1 = this.state.com1;
            let com2 = this.state.com2;
            //construct the object that will comprise of the doc contents
            //notice that here we define explicit naming conventions in the database
            let body = {
                first_name: first,
                last_name: last,
                user_email: email,
                pet_count: pets,
                comment_1: com1,
                comment_2: com2
            }
            let currentDoc = this.state.currentDoc;
            firebase.firestore().collection('demo').doc(currentDoc).set(body);
            this.setState({modal : true, infoMsg: "Successfully saved your changes!"});
        } catch (err) {
            console.log("Caught exception in saveUserDoc(): " + err)
        }
    }

/*///////////////////////////////////////////////// HTML & Components *//////////////////////////////////////////////
    //Every React JSX component needs this render function, your HTML and react components will go here
    render() {
        return (
            <>
               <div className={className} ref="mainPanel">
               <Modal isOpen={this.state.modal} toggle={this.toggleModal}>
                    <ModalHeader toggle={this.toggleModal}>Notice</ModalHeader>
                    <ModalBody>
                        {this.state.infoMsg}
                    </ModalBody>
                    <ModalFooter>
                    <Button color={this.state.buttonColor} onClick={this.toggleModal}>Ok</Button>{' '}
                    </ModalFooter>
                </Modal>
               <Card className="sample-card">
                    <CardHeader>Card Header</CardHeader>
                    <CardBody className="add-scrollbar">
                        <CardTitle><b>Welcome ACP Team!!</b></CardTitle>
                        <CardText>
                            This is a sample React page (using JSX) to demonstrate some basic functionality. Feel free to use this page as a template when creating other 
                            views and components.
                        </CardText>
                        <CardText>
                            Most styling of Reactstrap components is handled by the imported Bootstrap css, however, more detailed 
                            aspects such as positioning, sizing, and enhanced effects like shadow and gradients can be added to the app.css file
                        </CardText>
                        <CardText>
                            Click on the button below to see bootstrap standard theme/color conventions and check out the underlying code to see how the button uses React state 
                            to set the color and text of a component.
                        </CardText>
                        <div className="button-area">
                            <Button
                                size="lg"
                                color={this.state.buttonColor}
                                onClick={() => this.buttonOnClick()}
                            >
                                {this.state.buttonColor}
                            </Button>
                        </div>
                        <CardText>
                            This paragraph is to illustrate the effects of Perfect-Srollbar. The scrollbar is hidden by default but appears when the user hovers over
                            the "container". CSS properties have been defined for the x and y rails of the scrollbar (leave these as is), however feel free to modify 
                            props to a specific scrollbar/container and/or override css for that specific container class.
                        </CardText>
                        <CardText>
                            Below are examples of form inputs that can be created with Reactstrap Rows and Columns. Rows/Columns help define grids with adaptive sizing 
                            to eliminate the need of setting fixed widths. Take a look at the source code to see how different Col sizes change the width. Add a xs, sm, and lg 
                            prop to the column to account for different screen sizes (mobile).
                        </CardText>
                        <CardText>
                            The inputs are tied to our Firebase project making use of Firestore (real time no-SQL database for web). Check out the Firebase console to look at data 
                            written and read from this page to learn more about how to use the Firebase SDK.
                        </CardText>
                        <Row>
                            <Col md="3">
                                <Label>Existing Docs</Label>
                                <Input type="select" onChange={this.selectUserDoc}>
                                    <option />
                                    {[...this.state.userRecords].map(item => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </Input>
                            </Col>
                            <Col md="4">
                            <ButtonGroup>
                                <Button 
                                    size="md" 
                                    color={this.state.buttonColor} 
                                    onClick={() => this.createUserDoc()}
                                >
                                    New
                                </Button>
                                <Button 
                                    disabled={this.state.saveDisabled} 
                                    size="md" color={this.state.buttonColor} 
                                    onClick={() => this.saveUserDoc()}
                                >
                                    Save
                                </Button>
                            </ButtonGroup>
                            </Col>
                          
                        </Row>
                        <Row>
                            <Col md="3">
                                <Label>First</Label>
                                <Input type="text" id="first" value={this.state.first} onChange={this.inputOnChange}></Input>
                            </Col>
                            <Col md="3">
                                <Label>Last</Label>
                                <Input type="text" id="last" value={this.state.last} onChange={this.inputOnChange}></Input>
                            </Col>
                            <Col md="3">
                                <Label>Email</Label>
                                <Input type="text" id="email" value={this.state.email} onChange={this.inputOnChange}></Input>
                            </Col>
                            <Col md="3">
                                <Label>Pets</Label>
                                <Input type="number" id="pets" value={this.state.pets} onChange={this.inputOnChange}></Input>
                            </Col>
                        </Row>
                        <Row>
                            <Col md="6">
                                <Label>Comment 1</Label>
                                <Input type="text" id="com1" value={this.state.com1} onChange={this.inputOnChange}></Input>
                            </Col>
                            <Col md="6">
                                <Label>Comment 2</Label>
                                <Input type="text" id="com2" value={this.state.com2} onChange={this.inputOnChange}></Input>
                            </Col>
                        </Row>
                    </CardBody>
                    <CardFooter>
                        Card Footer 
                        <div className="footer-links">
                            <a href="/app">App.jsx</a><a href="/sample">Refresh</a>
                        </div>
                    </CardFooter>
                </Card>
                </div>
            </>
        );
    }
}

export default Sample;