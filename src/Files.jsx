import React from 'react';
import firebase from "firebase/app";
import 'firebase/auth'
import "firebase/firestore";
import "firebase/storage";


//Reactstrap library (with a few sample components)
//https://reactstrap.github.io/components/
import {
    Button,
    Col,
    Input,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Row,
    Spinner
} from "reactstrap";

var className = "assignment-files"

//.txt .pdf .doc .docx .xls .xlsx 


class Files extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            user: this.props.user,
            assignmentId: this.props.assignmentId,
            files: [],
            update: false,
            infoModal: false,
            hasInfo: false,
            infoMsg: "",
            fileName: "",
            oldFilePath: "",
            filePath: "",
            fileExt: "",
            uploadDate: "",
            uploader: "",
            fileDescription: "",
            thisFile: null,
            upload: false,
            existingFile: false,
            fileId: "",
            processing: false,
            saveEnabled: false
        }
    }

    componentDidMount() {
        if (this.state.assignmentId) {
            this.retrieveFiles()
        }
    }

    componentDidUpdate() {
        if (this.state.update) {
            try {
                //re-render: gather the first 10 comments
                if (this.state.assignmentId) {
                    this.retrieveFiles()
                    this.setState({update: false})
                } else {
                    this.setState({files: []})
                }
                this.setState({update: false})
            } catch (err) {
                console.log("Caught exception in componentDidUpdate(): " + err)  
            }
           
        }
      }

    retrieveFiles = () => {
        try {
            let assignmentId = this.state.assignmentId;
            let files = [];
            firebase.firestore().collection('assignments').doc(assignmentId).collection('files').get()
                .then(query => {
                    if (query.size > 0) {
                        let fileNum = 0;
                        query.forEach(file => {
                            fileNum++;
                            let fileName = file.get('file_name');
                            let filePath = file.get('file_path')
                            let fileExt = this.getFileExt(filePath);
                            let upload_date = file.get('upload_date');
                            let uploader = file.get('uploader');
                            let file_description = file.get('file_description')
                            let thisFile = {id: file.id, fileName: fileName, filePath: filePath, fileExt: fileExt, uploadDate: upload_date, uploader: uploader, fileDescription: file_description};
                            files.push(thisFile);
                            if (fileNum >= query.size) {
                                this.setState({files})
                            }
                        })
                    } else {
                        this.setState({files})
                    }
                    
                })
        } catch (err) {
            console.log("Caught exception in retrieveFiles(): " + err) 
        }
        
    }

    static getDerivedStateFromProps(props, state) {
        if (typeof props.assignmentId !== 'undefined' && props.assignmentId !== state.assignmentId) {
            return {update: true, assignmentId: props.assignmentId, checkedOlder: false}
        }
        return null;
    }

    getFileIcon = fileName => {
        //for the add new icon
        if (fileName === "Upload New") return "/images/add-icon.png";

        
        let ext = this.getFileExt(fileName)
        let icon = "/images/file-icon.png";
        switch (ext) {
            case 'txt':
                icon = "/images/txt-icon.png";
                break;
            case 'pdf':
                icon = "/images/pdf-icon.png";
                break;
            case 'doc':
                icon = "/images/doc-icon.png";
                break;
            case 'docx':
                icon = "/images/docx-icon.png";
                break;
            case 'xls':
                icon = "/images/xls-icon.png";
                break;
            case 'csv':
                icon = "/images/xls-icon.png";
                break;
            case 'xlsx':
                icon = "/images/xlsx-icon.png";
                break;
            default:
                break;
        }
        return icon;
    }

    getFileExt = fileName => {
        let ext = "";
        try {
            let arr = fileName.split(".");
            ext = arr[1];
        } catch (err) {
            console.log("Caught exception in getFileExt(): " + err)
        }
        return ext
    }

    toDateFormat = timestamp => {
        let string = "";
        try {
            if (typeof timestamp.toDate === "function") {
                timestamp = timestamp.toDate();
            } 
            if (navigator.userAgent.indexOf("Firefox") !== -1) {
                string = timestamp.toISOString().split('T')[0];
            } else {
                string = timestamp.toISOString().substring(0, 11) + timestamp.getHours().toString().padStart(2, "0") + ":" + timestamp.getMinutes().toString().padStart(2, "0");
            }
            
        } catch (err) {
            //no output for this method
            console.log("Caught exception in Files:toDateFormat(): " + err)
        }
        return string
    }

    //set modal to its negated value
    toggleModal = () => {
        let infoModal = this.state.infoModal;
        if (!infoModal) {
            this.setState({infoModal: !infoModal})
        } else {
            //we are closing the modal, clear all file data
            this.setState({
                infoModal: !infoModal, 
                hasInfo: false,
                infoMsg: "",
                fileName: "",
                oldFilePath: "",
                filePath: "",
                fileExt: "",
                uploadDate: "",
                uploader: "",
                fileDescription: "",
                thisFile: null,
                existingFile: false,
                upload: false,
                fileId: "",
                processing: false,
                saveEnabled: false
            })
        }
    }

    //lightweight function to update input value
    inputOnChange = evt => {
        try {
            let value = evt.target.value;
            let id = evt.target.id;
            this.setState({ [id]: value, saveEnabled: true })
        } catch (err) {
            console.log("Caught exception in inputOnChange(): " + err)
        }
    }

    selectFile = (id, fileName, filePath, fileExt, uploadDate, uploader, fileDescription) => {
        this.setState({
            infoModal: true, 
            fileId: id, 
            fileName: fileName, 
            oldFilePath: filePath,
            filePath: filePath,
            fileExt: fileExt,
            uploadDate: uploadDate, 
            uploader: uploader, 
            fileDescription: fileDescription,
            existingFile: true,
            upload: false
        })
    }

    processFileUpload = evt => {
        let files = evt.target.files;
        // FileReader support
        if (files && files.length) {
            if (files[0].size < 1000000) {
                let thisFile = files[0];
                let fileName = thisFile.name;
                this.setState({saveEnabled: true, processing: false, fileName, filePath: fileName, thisFile, upload: true})
            } else {
                this.setState({processing: false, infoModal: true, hasInfo : true, infoMsg: "Files must not be greater than 1MB. Please choose a smaller file"});
            }

        } else {
            this.setState({processing: false, infoModal: true, hasInfo : true, infoMsg: "Error processing your file, please try again"});
        }
    }

    saveFile = async () => {
        try {
            //if a new file was presented, save to storage
            let proceed = false;
            let fileName = this.state.fileName;
            let oldFilePath = this.state.oldFilePath;
            let existingFile = this.state.existingFile;
            let filePath = this.state.filePath;
            let thisFile = this.state.thisFile;
            let fileDescription = this.state.fileDescription;
            let assignmentId = this.props.assignmentId;
            let uploadDate = this.state.uploadDate;
            let uploader = this.state.uploader;
            let upload = this.state.upload;
            
            let files = this.state.files;
            let fileId = this.state.fileId;
            let docRef = firebase.firestore().collection('assignments').doc(assignmentId).collection('files');
            if (upload) {
                //upload to storage
                let upload = await firebase.storage().ref().child("files/" + filePath).put(thisFile);
                if (upload.state === "success") {
                    proceed = true;
                    uploadDate = new Date();
                    uploader = this.props.user;
                }
            } else {
                proceed = true;
            }
            if (proceed) {
                let notifyType = "edited";
                let notifyMsg = `File: ${filePath}. Description: ${fileDescription}`;
                let notifyTitle = fileName;
                //save file properties to doc
                let doc = {
                    file_name: fileName,
                    file_path: filePath,
                    upload_date: uploadDate,
                    uploader: uploader,
                    file_description: fileDescription
                }
                if (existingFile) {
                    docRef.doc(fileId).update(doc);
                    //find and update our file array
                    for (let i=0;i<files.length;i++) {
                        if (files[i].id === fileId) {
                            files[i].fileName = fileName;
                            files[i].filePath = filePath;
                            let fileExt = this.getFileExt(filePath);
                            files[i].fileExt = fileExt;
                            files[i].uploadDate = uploadDate;
                            files[i].uploader = uploader;
                            files[i].fileDescription = fileDescription;
                        }
                    }
                    //if there is a new file replacing the old one, proceed to delete the old one from storage
                    if (upload) {
                        firebase.storage().ref().child("files/" + oldFilePath).delete();
                        notifyType = "replaced";
                        notifyMsg = `New File: ${filePath}. Description: ${fileDescription}`;
                        notifyTitle = oldFilePath;
                    }
                } else {
                    notifyType = "added"
                    let newFile = await docRef.add(doc);
                    let fileExt = this.getFileExt(filePath);
                    let thisFile = {id: newFile.id, fileName: fileName, filePath: filePath, fileExt: fileExt, uploadDate: uploadDate, uploader: uploader, fileDescription: fileDescription};
                    files.push(thisFile);
                }
                this.setState({infoModal: true, hasInfo : true, infoMsg: "Successfully saved file!", files});
                //notify collaborators
                this.props.notifyCollaborators("files", notifyTitle, notifyType, notifyMsg)
            } else {
                this.setState({infoModal: true, hasInfo : true, infoMsg: "Error saving your file, please try again"});
            }
        } catch (err) {
            console.log("Caught exception in saveFile(): " + err)
        }
    }

    downloadFile = async () => {
        try {
            let fileName = this.state.fileName;
            let filePath = this.state.filePath;
            // Create a reference to the file we want to download
            var fileRef = firebase.storage().ref().child('files/' + filePath);
            // Get the download URL
            let url = await fileRef.getDownloadURL();
            // This can be downloaded directly:
            let link = document.createElement("a");
            link.setAttribute('target', '_blank')
            link.download = fileName;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.setState({infoModal: true, hasInfo : true, infoMsg: "Successfully processed your download!"});
            return
        } catch (err) {
            console.log("Caught exception in downloadFile(): " + err)
        }
        this.setState({infoModal: true, hasInfo : true, infoMsg: "Error processing download, please try again"});
    }

    deleteFile = () => {
        try {
            //if a new file was presented, save to storage
            let fileName = this.state.fileName;
            let filePath = this.state.filePath;
            let assignmentId = this.props.assignmentId;
            let files = this.state.files;
            let fileId = this.state.fileId;
            firebase.firestore().collection('assignments').doc(assignmentId).collection('files').doc(fileId).delete();
            firebase.storage().ref().child("files/" + filePath).delete();
            //find and update our file array
            files = files.filter(item => {
                if (item.id !== fileId) {
                    return item;
                } else {
                    return null;
                }
            })
            this.setState({infoModal: true, hasInfo : true, infoMsg: "Successfully deleted file '" + fileName + "'", files});
            //notify collaborators
            this.props.notifyCollaborators("files", fileName, "deleted", "")
        } catch (err) {
            console.log("Caught exception in deleteFile(): " + err)
        }
    }

    render() {
        return (
            <>
            <Modal isOpen={this.state.infoModal} toggle={this.toggleModal}>
                <ModalHeader toggle={this.toggleModal}>{this.state.hasInfo ? "Notice" : "File"}</ModalHeader>
                <ModalBody>
                {!this.state.hasInfo &&
                    <>
                    <Row>
                        <Col md="8">
                            <Label>File Name</Label>
                            <Input type="text" id="fileName" value={this.state.fileName} onChange={this.inputOnChange} disabled={!this.props.canEdit}/>                    
                        </Col>
                        <Col md="4">
                            <Label>File Type</Label>
                            <Input type="text" value={this.state.fileExt ? this.state.fileExt : ""} disabled/>                    
                        </Col>
                    </Row>
                    <Row>
                        <Col md="8">
                            <Label>Upload Date</Label>
                            <Input type={navigator.userAgent.indexOf("Firefox") !== -1 ? "date" : "datetime-local"} value={this.state.uploadDate ? this.toDateFormat(this.state.uploadDate) : ""} disabled/>                    
                        </Col>
                        <Col md="4">
                            <Label>Uploaded By</Label>
                            <Input type="text" value={this.state.uploader} disabled/>                    
                        </Col>
                    </Row>
                    <Row>
                        <Col md="12">
                            <Label>Description</Label>
                            <Input type="textarea" id="fileDescription" disabled={!this.props.canEdit} value={this.state.fileDescription} onChange={this.inputOnChange} />                    
                        </Col>
                    </Row>
                    <Row></Row>
                    <Row>
                        
                        <Col md="6">
                            <Label>Replace File</Label>
                            <Input type="file" accept=".txt, .pdf, .doc, .docx, .xls, .xlsx, .csv" disabled={!this.props.canEdit} onChange={evt => {this.setState({processing: true}); this.processFileUpload(evt)}}/>                    
                        </Col>
                        {this.state.processing && 
                            <Col md="4">
                                <Spinner
                                    className="upload-spinner"
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                />
                            </Col>
                        }
                        
                    </Row>
                    </>
                }
                {this.state.hasInfo &&
                    this.state.infoMsg
                }
                </ModalBody>
                <ModalFooter>
                    {!this.state.hasInfo &&
                        (
                        <>
                        <Button color="primary" onClick={this.saveFile} disabled={!this.state.saveEnabled}>Save</Button>
                        <Button color="success" onClick={this.downloadFile} size="md" disabled={!this.state.existingFile}>Download</Button>
                        <Button color="danger" onClick={this.deleteFile} size="md" disabled={!this.state.existingFile || !this.props.canEdit}>Delete</Button>
                        </>
                        )}
                    <Button color="secondary" size="md" onClick={this.toggleModal}>{this.state.hasInfo ? "Ok" : "Cancel"}</Button>{' '}
                </ModalFooter>
            </Modal>
            <div className={className}>
                <div className="content">
                    {this.props.canEdit && this.state.assignmentId && this.state.files.length === 0 &&
                        <h5 className="text-muted" onClick={this.toggleModal}>Click Here to Upload a File</h5>
                    }
                    {this.state.files.length > 0 &&
                        [...this.state.files].map(file => (
                            <div key={file.fileName} className="file-item">
                                    <img 
                                        className="file-icon"  
                                        src={this.getFileIcon(file.filePath)} 
                                        alt={file.fileName} 
                                        onClick={() => this.selectFile(file.id, file.fileName, file.filePath, file.fileExt, file.uploadDate, file.uploader, file.fileDescription)}/> 
                                    <Label>{file.fileName}</Label>
                            </div>
                    ))}
                    {this.props.canEdit && this.state.assignmentId && this.state.files.length > 0 && this.state.files.length < 10 &&
                        <div className="file-item new-file" >
                            <img className="file-icon"  src={"/images/add-icon.png"} alt="New File" onClick={this.toggleModal}/> 
                            <Label>{"Add New"}</Label>
                        </div>
                    }
                </div>
            </div>
            </>
        );
    }
}

export default Files;
