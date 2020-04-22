import React, {Component, Fragment} from 'react';
import {
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
} from 'reactstrap';
import './MainContainer.scss';
import AccountPage from './account/AccountPage';
import SearchInput from '../common/SearchInput';
import Account from '../../models/Account';
import Document from '../../models/document/Document';
import StringUtil from '../../util/StringUtil';
import DocumentService from '../../services/DocumentService';
import ProgressIndicator from '../common/ProgressIndicator';
import Folder from '../common/Folder';
import DocumentType from '../../models/DocumentType';
import DocumentTypeService from '../../services/DocumentTypeService';
import AddDocumentModal from './document/AddDocumentModal';
import UpdateDocumentModal from './document/UpdateDocumentModal';
import AccountService from '../../services/AccountService';
import MainPage from './MainPage';
import ClientPage from './account/ClientPage';
import ShareRequest from '../../models/ShareRequest';
import UpdateDocumentRequest from '../../models/document/UpdateDocumentRequest';
import AccountImpl from '../../models/AccountImpl';
import {ReactComponent as LogoSm} from '../../img/logo-sm.svg';
import Sidebar from '../layout/Sidebar';

// TODO use react router dom and make this more of a app container

interface MainContainerState {
  documentTypes: DocumentType[];
  documents: Document[];
  searchedDocuments: Document[];
  documentSelected?: Document;
  isAccount: boolean;
  sortAsc: boolean;
  showModal: boolean;
  isAccountMenuOpen: boolean;
  isSmallMenuOpen: boolean;
  isLoading: boolean;
  documentQuery: string;
  accounts: Account[];
  searchedAccounts: Account[];
  activeTab: string;
  sidebarOpen?: boolean;
}

interface MainContainerProps {
  account: Account;
  handleLogout: () => void;
  updateAccountShareRequests: (requests: ShareRequest[]) => void;
  privateEncryptionKey?: string;
}

class MainContainer extends Component<MainContainerProps, MainContainerState> {
  constructor(props: Readonly<MainContainerProps>) {
    super(props);

    this.state = {
      documentTypes: [],
      documents: [],
      searchedDocuments: [],
      documentSelected: undefined,
      isAccount: false,
      sortAsc: true,
      showModal: false,
      isAccountMenuOpen: false,
      isSmallMenuOpen: false,
      isLoading: false,
      documentQuery: '',
      accounts: [],
      searchedAccounts: [],
      activeTab: '1',
      sidebarOpen: false
    };
  }

  async componentDidMount() {
    const {account} = {...this.props};
    const {sortAsc} = {...this.state};
    let {documentTypes, accounts} = {...this.state};
    const documents: Document[] = account.documents;
    this.setState({isLoading: true});
    try {
      documentTypes = (await DocumentTypeService.get()).documentTypes;
      if (account.role === 'notary') {
        accounts = (await AccountService.getAccounts()).filter(
          (accountItem) => {
            if (accountItem.role === 'owner' && accountItem.id !== account.id) {
              return accountItem;
            }
          }
        );
      } else {
        accounts = (await AccountService.getAccounts()).filter(
          (accountItem) => {
            if (
              accountItem.role === 'notary' &&
              accountItem.id !== account.id
            ) {
              return accountItem;
            }
          }
        );
      }
      // NOTE: since not paging yet, preventing from getting too big for layout
      accounts = accounts.length > 8 ? accounts.slice(0, 8) : accounts;
    } catch (err) {
      console.error('failed to fetch main data');
    }
    this.setState({
      documentTypes,
      documents,
      searchedDocuments: this.sortDocuments(documents, sortAsc),
      isLoading: false,
      accounts,
      searchedAccounts: this.sortAccounts(accounts, sortAsc)
    });
  }

  handleSearch = (query: string) => {
    const {documents, accounts, sortAsc} = {...this.state};
    let searchedDocuments = documents.filter((document) => {
      return (
        document.type &&
        document.type.toLowerCase().indexOf(query.toLowerCase()) !== -1
      );
    });
    let searchedAccounts = accounts.filter((account) => {
      return (
        AccountImpl.getFullName(account?.firstName, account?.lastName) &&
        AccountImpl.getFullName(account?.firstName, account?.lastName)
          .toLowerCase()
          .indexOf(query.toLowerCase()) !== -1
      );
    });
    if (query.length === 0) {
      searchedDocuments = documents;
      searchedAccounts = accounts;
    }
    searchedDocuments = this.sortDocuments(searchedDocuments, sortAsc);
    searchedAccounts = this.sortAccounts(searchedAccounts, sortAsc);
    this.setState({
      searchedDocuments,
      searchedAccounts,
      documentQuery: query
    });
  };

  setSidebarOpen = (b: boolean) => {
    this.setState({sidebarOpen: b});
  };

  toggleSort = () => {
    let {sortAsc, searchedDocuments, searchedAccounts} = {...this.state};
    sortAsc = !sortAsc;
    searchedDocuments = this.sortDocuments(searchedDocuments, sortAsc);
    searchedAccounts = this.sortAccounts(searchedAccounts, sortAsc);
    this.setState({sortAsc, searchedDocuments, searchedAccounts});
  };

  sortDocuments(documents: Document[], sortAsc: boolean) {
    return documents.sort((docA: Document, docB: Document) => {
      if (docA.type < docB.type) {
        return sortAsc ? -1 : 1;
      }
      if (docA.type > docB.type) {
        return sortAsc ? 1 : -1;
      }
      return 0;
    });
  }

  sortAccounts(accounts: Account[], sortAsc: boolean) {
    return accounts.sort((acctA: Account, acctB: Account) => {
      if (acctA.firstName! < acctB.firstName!) {
        return sortAsc ? -1 : 1;
      }
      if (acctA.firstName! > acctB.firstName!) {
        return sortAsc ? 1 : -1;
      }
      return 0;
    });
  }

  handleSelectDocument = (document?: Document) => {
    this.setState({documentSelected: document});
  };

  goToAccount = () => {
    this.setState({documentSelected: undefined, isAccount: true});
  };

  goBack = () => {
    this.setState({documentSelected: undefined, isAccount: false});
  };

  handleAddNew = () => {
    this.toggleModal();
  };

  toggleModal = () => {
    const {showModal} = {...this.state};
    this.setState({showModal: !showModal});
  };

  toggleAccountMenu = () => {
    const {isAccountMenuOpen} = {...this.state};
    this.setState({isAccountMenuOpen: !isAccountMenuOpen});
  };

  toggleSmallMenu = () => {
    const {isSmallMenuOpen} = {...this.state};
    this.setState({isSmallMenuOpen: !isSmallMenuOpen});
  };

  handleAddNewDocument = async (
    newFile: File,
    newThumbnailFile: File,
    documentTypeSelected: string
  ) => {
    const {documents, searchedDocuments, documentQuery} = {...this.state};
    const {account} = {...this.props};
    this.setState({isLoading: true});
    try {
      if (newFile) {
        try {
          const response = await DocumentService.addDocument(
            newFile,
            newThumbnailFile,
            documentTypeSelected!,
            account.didPublicEncryptionKey!
          );
          const newDocument = response.document;
          newDocument._id = newDocument.id;
          documents.push(newDocument);
        } catch (err) {
          console.error(err.message);
        }
      }
    } catch (err) {
      console.error('failed to upload file');
    }
    this.setState(
      {documents, searchedDocuments, showModal: false, isLoading: false},
      () => {
        this.handleSearch(documentQuery);
      }
    );
  };

  handleUpdateDocument = async (request: UpdateDocumentRequest) => {
    let {documents} = {...this.state};
    const {documentQuery} = {...this.state};
    this.setState({isLoading: true});
    try {
      const updatedDoc = await DocumentService.updateDocument(request);
      // TODO get API call to return updatedAt
      updatedDoc.updatedAt = new Date();
      documents = documents.map((doc) =>
        doc.type === updatedDoc.type ? updatedDoc : doc
      );
    } catch (err) {
      console.error('failed to upload file');
    }
    this.setState(
      {
        documents,
        showModal: false,
        isLoading: false,
        documentSelected: undefined
      },
      () => {
        this.handleSearch(documentQuery);
      }
    );
  };

  handleDeleteDocument = async (document: Document) => {
    const {account} = {...this.props};
    let {documents, searchedDocuments} = {...this.state};
    this.setState({isLoading: true});

    try {
      await DocumentService.deleteDocument(document.url);
    } catch (err) {
      console.error('failed to remove image');
    }

    searchedDocuments = searchedDocuments.filter((searchedDocument) => {
      return (searchedDocument as Document).url !== document.url;
    });
    documents = documents.filter((documentItem) => {
      return (documentItem as Document).url !== document.url;
    });
    // also remove share requests
    const matchedShareRequests = account.shareRequests.filter(
      (shareRequest) => {
        return shareRequest.documentType === document.type;
      }
    );
    matchedShareRequests.forEach((matchedShareRequest) =>
      this.removeShareRequest(matchedShareRequest)
    );
    this.setState({
      documents,
      searchedDocuments,
      isLoading: false,
      documentSelected: undefined
    });
  };

  addShareRequest = (request: ShareRequest) => {
    const {updateAccountShareRequests, account} = {...this.props};
    const {shareRequests} = {...account};
    shareRequests.push(request);
    updateAccountShareRequests(shareRequests);
  };

  removeShareRequest = (request: ShareRequest) => {
    const {updateAccountShareRequests, account} = {...this.props};
    let {shareRequests} = {...account};
    shareRequests = shareRequests.filter(
      (shareRequest) => shareRequest._id !== request._id
    );
    updateAccountShareRequests(shareRequests);
  };

  setActiveTab = (tab: string) => {
    this.setState({activeTab: tab});
  };

  renderAddDocumentModal() {
    const {showModal, documentTypes, documents} = {...this.state};
    const {privateEncryptionKey} = {...this.props};
    return (
      <AddDocumentModal
        showModal={showModal}
        toggleModal={this.toggleModal}
        documentTypes={documentTypes}
        documents={documents}
        handleAddNewDocument={this.handleAddNewDocument}
        privateEncryptionKey={privateEncryptionKey}
      />
    );
  }

  renderUpdateDocumentModal() {
    const {documentSelected, accounts} = {...this.state};
    const {account} = {...this.props};
    const shareRequests: ShareRequest[] = account.shareRequests.filter(
      (sharedRequest) => {
        if (sharedRequest.documentType === documentSelected?.type) {
          return sharedRequest;
        }
      }
    );
    return (
      <UpdateDocumentModal
        accounts={accounts}
        showModal={!!documentSelected}
        toggleModal={() => this.setState({documentSelected: undefined})}
        document={documentSelected}
        shareRequests={shareRequests}
        handleUpdateDocument={this.handleUpdateDocument}
        handleDeleteDocument={this.handleDeleteDocument}
        addShareRequest={this.addShareRequest}
        removeShareRequest={this.removeShareRequest}
        myAccount={account}
        privateEncryptionKey={this.props.privateEncryptionKey}
      />
    );
  }

  renderTopBarSmall() {
    const {handleLogout} = {...this.props};
    const {isSmallMenuOpen} = {...this.state};
    return (
      <div id="main-top-bar-sm">
        {/* <Dropdown isOpen={isSmallMenuOpen} toggle={this.toggleSmallMenu}>
          <DropdownToggle
            tag="span"
            data-toggle="dropdown"
            aria-expanded={isSmallMenuOpen}
          > */}
            <LogoSm onClick={() => this.setSidebarOpen(true) } />
          {/* </DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={this.goToAccount}>My Account</DropdownItem>
            <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
          </DropdownMenu>
        </Dropdown> */}
        <SearchInput handleSearch={this.handleSearch}/>
      </div>
    );
  }

  renderTopBar() {
    const {account, handleLogout} = {...this.props};
    const {isAccountMenuOpen} = {...this.state};

    return (
      <div>
        <div id="main-top-bar">
          <div id="main-logo" onClick={() => this.setActiveTab('1')}>
            <Folder/>
          </div>
          <Row id="main-search">
            <Col style={{display: 'flex'}}>
              <SearchInput handleSearch={this.handleSearch}/>
            </Col>
          </Row>
          <div id="main-profile">
            <Dropdown
              isOpen={isAccountMenuOpen}
              toggle={this.toggleAccountMenu}
            >
              <DropdownToggle
                tag="span"
                data-toggle="dropdown"
                aria-expanded={isAccountMenuOpen}
              >
                {account.profileImageUrl && (
                  <img
                    className="shared-with-image-single"
                    src={AccountService.getProfileURL(account.profileImageUrl)}
                    alt="Profile"
                  />
                )}
                {!account.profileImageUrl && (
                  <div className="account-circle">
                    {StringUtil.getFirstUppercase(account.username)}
                  </div>
                )}
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem onClick={this.goToAccount}>
                  My Account
                </DropdownItem>
                <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }

  renderAccount() {
    const {account} = {...this.props};
    const {isAccount} = {...this.state};

    if (isAccount) {
      return <AccountPage goBack={this.goBack} account={account}/>;
    }
    return <Fragment/>;
  }

  renderMyClients() {
    const {searchedDocuments, accounts, isAccount, sortAsc} = {...this.state};
    const {account} = {...this.props};

    if (!isAccount) {
      return (
        <ClientPage
          otherOwnerAccounts={accounts}
          handleAddNew={this.handleAddNew}
          handleSelectDocument={this.handleSelectDocument}
          searchedDocuments={searchedDocuments}
          sortAsc={sortAsc}
          toggleSort={this.toggleSort}
          myAccount={account}
          addShareRequest={this.addShareRequest}
          removeShareRequest={this.removeShareRequest}
        />
      );
    }
  }

  renderMainPage() {
    const {
      searchedDocuments,
      isAccount,
      sortAsc,
      searchedAccounts,
      activeTab
    } = {...this.state};
    const {account, privateEncryptionKey} = {...this.props};
    if (!isAccount) {
      return (
        <MainPage
          sortAsc={sortAsc}
          toggleSort={this.toggleSort}
          handleAddNew={this.handleAddNew}
          searchedDocuments={searchedDocuments}
          handleSelectDocument={this.handleSelectDocument}
          searchedAccounts={searchedAccounts}
          shareRequests={account.shareRequests}
          activeTab={activeTab}
          setActiveTab={this.setActiveTab}
          myAccount={account}
          addShareRequest={this.addShareRequest}
          removeShareRequest={this.removeShareRequest}
          privateEncryptionKey={privateEncryptionKey}
        />
      );
    }
    return <Fragment/>;
  }

  render() {
    const {account, handleLogout} = {...this.props};
    const {isLoading, isAccount, sidebarOpen} = {...this.state};
    return (
      <Fragment>
        {isLoading && <ProgressIndicator isFullscreen/>}
        <div id="main-container">
          {this.renderAddDocumentModal()}
          {this.renderUpdateDocumentModal()}
          <Sidebar
          account={account}
          handleLogout={handleLogout}
          goToAccount={this.goToAccount}
          isOpen={!!sidebarOpen}
          setOpen={this.setSidebarOpen}
          />
          {this.renderTopBar()}
          {this.renderTopBarSmall()}
          <div className="main-page">
            <div className="main-side"/>
            <div className="main-section">
              {this.renderAccount()}
              {account.role === 'owner' && this.renderMainPage()}
              {!isAccount &&
              account.role === 'notary' &&
              this.renderMyClients()}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default MainContainer;
