import React, {Component} from 'react';
import {
  Button,
  Card, CardTitle,
  Col, ListGroup, ListGroupItem,
  Modal,
  ModalBody, ModalFooter,
  ModalHeader, Nav, NavItem, NavLink, Row, TabContent, TabPane
} from 'reactstrap';
import classNames from 'classnames';
import Document from '../../../models/Document';
import documentImg from '../../../img/document.svg';
import './UpdateDocumentModal.scss';
import DocumentService from '../../../services/DocumentService';
import deleteSvg from '../../../img/delete.svg';
import crossImg from '../../../img/cross.svg';

interface UpdateDocumentModalProps {
  showModal: boolean;
  toggleModal: () => void;
  document?: Document;
  handleDeleteDocument: (document: Document) => Promise<void>;
  pendingShareRequests: string[];
}

interface UpdateDocumentModalState {
  activeTab: string;
}

class UpdateDocumentModal extends Component<UpdateDocumentModalProps, UpdateDocumentModalState> {
  constructor(props: Readonly<UpdateDocumentModalProps>) {
    super(props);

    this.state = {
      activeTab: '1'
    };
  }

  toggleTab = (tab: string) => {
    const {activeTab} = {...this.state};
    if (activeTab !== tab) this.setState({activeTab: tab});
  };

  handleDeleteDocument = async (document: Document) => {
    const {handleDeleteDocument} = {...this.props};
    await handleDeleteDocument(document);
  };

  render() {
    const {showModal, toggleModal, document, pendingShareRequests} = {...this.props};
    const {activeTab} = {...this.state};
    const closeBtn = (
      <button className="close" onClick={toggleModal}><img src={`${window.location.origin}/${crossImg}`} alt="close"/>
      </button>);
    return (
      <Modal isOpen={showModal} toggle={toggleModal} backdrop={'static'}>
        <ModalHeader toggle={toggleModal} close={closeBtn}>
          <img src={`${window.location.origin}/${documentImg}`} alt="Add New"/>
          <span className="update-doc-modal-title">{document?.type}</span>
        </ModalHeader>
        <ModalBody>
          <div className="upload-doc-delete-container">
            <img
              style={{cursor: 'pointer'}}
              src={deleteSvg}
              alt="delete"
              onClick={() => this.handleDeleteDocument(document!)}
            />
          </div>
          <Nav tabs>
            <NavItem>
              <NavLink
                className={classNames({active: activeTab === '1'})}
                onClick={() => {
                  this.toggleTab('1');
                }}
              >
                Preview
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classNames({active: activeTab === '2'})}
                onClick={() => {
                  this.toggleTab('2');
                }}
              >
                Share
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classNames({active: activeTab === '3'})}
                onClick={() => {
                  this.toggleTab('3');
                }}
              >
                Replace
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={activeTab}>
            <TabPane tabId="1">
              <Row>
                <Col sm="12" className="update-doc-img-container">
                  {/*<h4>Tab 1 Contents</h4>*/}
                  {document &&
                  <img className="document-summary-image"
                       src={DocumentService.getDocumentURL(document!.url)}
                       alt="doc missing"
                  />
                  }
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="2">
              <div className="update-doc-tab-spacing">
                <Row>
                  <Col sm="12">
                    <Card body>
                      <CardTitle>Pending Share Requests</CardTitle>
                      <div>
                        {pendingShareRequests.length < 1 && (
                          <div>No pending shares.</div>
                        )}
                        <ListGroup>
                          {pendingShareRequests!.map((pendingShareRequest, idx) => {
                            return (
                              <ListGroupItem key={idx} className="justify-content-between">
                                <div style={{display: 'inline-block', wordBreak: 'break-all'}}>
                                  {`Account ID: ${pendingShareRequest}`}
                                </div>
                                <Button color="success" onClick={()=>{}}>Approve</Button>
                                <Button close />
                              </ListGroupItem>
                            );
                          })}
                        </ListGroup>
                      </div>
                    </Card>
                  </Col>
                  <Col sm="12">
                    <Card body>
                      <CardTitle>Approved Shares</CardTitle>
                      {document &&
                      <div>
                        {document!.sharedWithAccountIds.length < 1 && (
                          <div>No approved shares.</div>
                        )}
                        <ListGroup>
                          {document!.sharedWithAccountIds.map((sharedWithAccountId, idx) => {
                            return (
                              <ListGroupItem key={idx} className="justify-content-between">
                                {/*<img className="shared-with-image-single"*/}
                                {/*     src={sharedWithItem.profileimgUrl}*/}
                                {/*     alt={`sharedWithItem${idx}`}*/}
                                {/*/>*/}
                                <div style={{display: 'inline-block', wordBreak: 'break-all'}}>
                                  {`Account ID: ${sharedWithAccountId}`}
                                </div>
                                <Button close />
                              </ListGroupItem>
                            );
                          })}
                        </ListGroup>
                      </div>
                      }
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>
            <TabPane tabId="3">
              <div className="update-doc-tab-spacing">
                <Row>
                  <Col sm="12">
                    <h4>Replace Feature Coming Soon...</h4>
                  </Col>
                </Row>
              </div>
            </TabPane>
          </TabContent>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={toggleModal} disabled>Save</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default UpdateDocumentModal;