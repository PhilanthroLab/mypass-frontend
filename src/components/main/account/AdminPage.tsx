import React, { Component } from 'react';
import Account from '../../../models/Account';
import AdminDocumentType from '../../admin/AdminDocumentType';
import AdminService from '../../../services/AdminService';
import './AdminPage.scss';
import CheckboxCellRenderer from '../../common/CheckboxCellRenderer';
import ActionsCellRenderer from '../../common/ActionsCellRenderer';
import { ReactComponent as AddSvg } from '../../../img/add.svg';
import { ReactComponent as SaveSvg } from '../../../img/save.svg';

import { AgGridReact } from 'ag-grid-react';
import { Alert } from 'reactstrap';
import {
  GridApi,
  ColumnApi,
  GridOptions,
  CellValueChangedEvent,
  ColDef,
} from 'ag-grid-community';

interface AdminPageProps {
  account: Account;
  goBack: () => void;
}

interface AdminPageState {
  documentTypes: any[];
  viewFeatures: any;
  accountTypes: any;
  documentTypesColumnDefs: ColDef[];
  viewFeaturesColumnDefs: ColDef[];
  accountTypesColumnDefs: ColDef[];
  documentTypeSavedSuccess: boolean;
  documentTypeDeletedSuccess: boolean;
}

class AdminPage extends Component<AdminPageProps, AdminPageState> {
  documentTypesGridApi: GridApi;
  documentTypesGridColumnApi: ColumnApi;

  constructor(props: Readonly<AdminPageProps>) {
    super(props);
    this.state = {
      documentTypes: [],
      viewFeatures: [],
      accountTypes: [],
      documentTypesColumnDefs: [
        { headerName: 'Name', field: 'name', filter: true, editable: true },
        {
          headerName: 'Two Sided',
          field: 'isTwoSided',
          cellRenderer: 'checkboxCellRenderer',
        },
        {
          headerName: 'Expiration Date',
          field: 'hasExpirationDate',
          cellRenderer: 'checkboxCellRenderer',
        },
        {
          headerName: 'Protected',
          field: 'isProtectedDoc',
          cellRenderer: 'checkboxCellRenderer',
        },
        {
          headerName: 'Recordable',
          field: 'isRecordableDoc',
          cellRenderer: 'checkboxCellRenderer',
        },
        {
          headerName: 'Actions',
          field: 'action',
          sortable: false,
          cellRenderer: 'actionsCellRenderer',
        },
      ],
      viewFeaturesColumnDefs: [
        { headerName: 'View All Owners', field: 'ownerViewFeature' },
        { headerName: 'View All Helpers', field: 'helperViewFeature' },
      ],
      accountTypesColumnDefs: [
        { headerName: 'Title', field: 'accountTypeName' },
        { headerName: 'Account Type', field: 'accountTypeName' },
        { headerName: 'Is Notary', field: 'accountTypeName' },
        { headerName: 'Admin Level', field: 'adminLevel' },
      ],
      documentTypeSavedSuccess: false,
      documentTypeDeletedSuccess: false,
    };
  }

  async componentDidMount() {
    const { account } = { ...this.props };
    if (account.role === 'admin') {
      const adminResponse = await AdminService.getAdminInfo();
      // console.log('Admin Response:');
      // console.log(adminResponse);
      this.setState({
        documentTypes: adminResponse.account.adminInfo.documentTypes.map(
          (documentType) => {
            return { ...documentType, action: '' };
          }
        ),
        viewFeatures: adminResponse.account.adminInfo.viewFeatures,
        accountTypes: adminResponse.account.adminInfo.accountTypes,
      });
    }
  }

  onDocumentTypesGridReady = (params: GridOptions) => {
    this.documentTypesGridApi = params.api!;
    this.documentTypesGridColumnApi = params.columnApi!;
  };

  async handleDeleteDocumentType(id: any) {}

  onDocumentTypeCellValueChanged = async (params: CellValueChangedEvent) => {
    let {
      documentTypes,
      documentTypeDeletedSuccess,
      documentTypeSavedSuccess,
    } = { ...this.state };
    if (params.value === 'save') {
      // TODO: add api call either update or create or delete
      const reqObject = { ...params.data };
      delete reqObject.action;
      if (params.data._id) {
        await AdminService.updatedDocumentType(reqObject);
      } else {
        const newDocType = (await AdminService.addNewDocumentType(reqObject))
          .savedDocType;
        for (let i = 0; i < documentTypes.length; i++) {
          if (i === params.rowIndex) {
            documentTypes[i]._id = newDocType._id;
          }
        }
      }
      documentTypeSavedSuccess = true;
    }
    if (params.value === 'delete') {
      try {
        let deleteId;
        // FIXME: Warning: unstable_flushDiscreteUpdates: Cannot flush updates when React is already rendering.
        // https://github.com/ag-grid/ag-grid/issues/3680
        documentTypes = documentTypes.filter((documentType, index) => {
          if (index === params.rowIndex && documentType._id) {
            deleteId = documentType._id;
          }
          return index !== params.rowIndex;
        });
        if (deleteId) {
          await AdminService.deleteDocumentType(deleteId);
        }
        documentTypeDeletedSuccess = true;
      } catch (err) {
        console.error('failed to delete document type');
      }
    }
    this.setState(
      { documentTypes, documentTypeDeletedSuccess, documentTypeSavedSuccess },
      () => {
        this.documentTypesGridApi.setRowData(documentTypes);
        this.documentTypesGridApi.refreshCells();
        window.setTimeout(() => {
          this.setState({
            documentTypeDeletedSuccess: false,
            documentTypeSavedSuccess: false,
          });
        }, 2000);
      }
    );
  };

  handleAddDocumentType = () => {
    const { documentTypes } = { ...this.state };
    documentTypes.push({
      name: '',
      isTwoSided: false,
      hasExpirationDate: false,
      isProtectedDoc: false,
      isRecordableDoc: false,
      action: '',
    });
    this.setState({ documentTypes }, () => {
      this.documentTypesGridApi.setRowData(documentTypes);
      this.documentTypesGridApi.refreshCells();
      // this.documentTypesGridApi.redrawRows();
    });
  };

  getAccountTypesViewFeatures = (accountTypes, viewFeatures) => {
    const accountTypeViewFeatures: any[] = [];
    for(const viewFeature of viewFeatures) { // rows
      // [{admin: 'true - gridView', cityAdministrator: 'true - gridView'}, ...]
      const accountTypeViewFeature = {};
      for(const accountType of accountTypes) {
        accountTypeViewFeature[accountType.accountTypeName] = '';
        if(accountType.viewFeatures.find(accountViewFeature => accountViewFeature.featureName === viewFeature.featureName)) {
          accountTypeViewFeature[accountType.accountTypeName] += 'True';
        } else {
          accountTypeViewFeature[accountType.accountTypeName] += 'False';
        }
        accountTypeViewFeature[accountType.accountTypeName] += ` - ${viewFeature.featureName}`;
      }
      accountTypeViewFeatures.push(accountTypeViewFeature);
    }
    return accountTypeViewFeatures;
  };

  renderViewFeatures(viewFeatures) {
    const viewFeaturesArr = [] as any;

    for (const vf of viewFeatures) {
      viewFeaturesArr.push(
        <div key={vf._id} style={{ padding: '40px' }} className="col-lg-6">
          <p>{vf.featureName}</p>
        </div>
      );
    }

    return viewFeaturesArr;
  }

  renderAccountTypes(accountTypes) {
    const accountTypesArr = [] as any;

    for (const at of accountTypes) {
      let veiwFeaturesString = '';
      for (const vf of at.viewFeatures) {
        veiwFeaturesString += vf.featureName + ' - ';
      }

      accountTypesArr.push(
        <div key={at._id} style={{ padding: '40px' }} className="col-lg-6">
          <p>Name: {at.accountTypeName}</p>
          <p>Admin Level: {at.adminLevel}</p>
          <p>View Features: {veiwFeaturesString}</p>
        </div>
      );
    }

    return accountTypesArr;
  }

  render() {
    const {
      documentTypes,
      documentTypesColumnDefs,
      viewFeaturesColumnDefs,
      accountTypesColumnDefs,
      viewFeatures,
      accountTypes,
      documentTypeSavedSuccess,
      documentTypeDeletedSuccess,
    } = { ...this.state };
    const accountTypeViewFeatures = this.getAccountTypesViewFeatures(accountTypes, viewFeatures);
    if(accountTypeViewFeatures.length > 0) {
      // debugger;
    }
    return (
      <div className="admin-content" style={{ marginTop: '20px' }}>
        <h1>Admin Page</h1>
        <h2>The Document Types Used</h2>
        <Alert color="success" isOpen={documentTypeSavedSuccess}>
          Successfully Saved Document Type!
        </Alert>
        <Alert color="danger" isOpen={documentTypeDeletedSuccess}>
          Successfully Deleted Document Type!
        </Alert>
        <div className="add-container">
          <AddSvg className="add" onClick={this.handleAddDocumentType} />
        </div>
        <div
          className="ag-theme-alpine-dark"
          style={{
            height:
              documentTypes.length > 0
                ? `${documentTypes.length * 42 + 51}px`
                : '300px',
            width: '100%',
          }}
        >
          <AgGridReact
            columnDefs={documentTypesColumnDefs}
            rowData={documentTypes}
            frameworkComponents={{
              checkboxCellRenderer: CheckboxCellRenderer,
              actionsCellRenderer: ActionsCellRenderer,
            }}
            defaultColDef={{
              flex: 1,
              editable: false,
              resizable: true,
              sortable: true,
            }}
            onCellValueChanged={this.onDocumentTypeCellValueChanged}
            animateRows
            onGridReady={this.onDocumentTypesGridReady}
          />
        </div>
        <br />
        <p>
          * Don't delete all of the document types or the app won't work
          properly.
        </p>
        <h2 className="view-feature-title">
          The View Features/Permissions Used
        </h2>
        <div className="save-container">
          <SaveSvg className="save" onClick={this.handleAddDocumentType} />
        </div>
        <div
          className="ag-theme-alpine-dark"
          style={{
            height:
              viewFeatures.length > 0
                ? `${viewFeatures.length * 42 + 51}px`
                : '300px',
            width: '100%',
          }}
        >
          <AgGridReact
            columnDefs={viewFeaturesColumnDefs}
            rowData={viewFeatures.map((viewFeature) => ({
              ownerViewFeature: viewFeature.featureName,
              helperViewFeature: viewFeature.featureName,
            }))}
            frameworkComponents={{
              checkboxCellRenderer: CheckboxCellRenderer,
              actionsCellRenderer: ActionsCellRenderer,
            }}
            defaultColDef={{
              flex: 1,
              editable: false,
              resizable: true,
              sortable: true,
            }}
            onCellValueChanged={() => {}}
            animateRows
            onGridReady={() => {}}
          />
        </div>
        {/* <div className="row">{this.renderViewFeatures(viewFeatures)}</div> */}
        {/* <div className="row">{this.renderDocuementTypes(documentTypes)}</div> */}

        <h2 className="account">The Account Types Used</h2>
        <div className="add-container">
          <AddSvg className="add" onClick={() => {}} />
        </div>
        <div
          className="ag-theme-alpine-dark"
          style={{
            height:
              accountTypes.length > 0
                ? `${accountTypes.length * 42 + 51}px`
                : '300px',
            width: '100%',
          }}
        >
          <AgGridReact
            columnDefs={accountTypesColumnDefs}
            rowData={accountTypes}
            frameworkComponents={{
              checkboxCellRenderer: CheckboxCellRenderer,
              actionsCellRenderer: ActionsCellRenderer,
            }}
            defaultColDef={{
              flex: 1,
              editable: false,
              resizable: true,
              sortable: true,
            }}
            onCellValueChanged={() => {}}
            animateRows
            onGridReady={() => {}}
          />
        </div>
        <h2 className="account">The Share Permissions Per Admin... TBD</h2>
        <h2 className="account">The Share Permissions Per Owner... TBD</h2>
        <h2 className="account">The Share Permissions Per Helper... TBD</h2>
        <h2 className="account">The Share Permissions Per Account Type Used</h2>
        <div
          className="ag-theme-alpine-dark"
          style={{
            height:
              viewFeatures.length > 0
                ? `${viewFeatures.length * 42 + 51}px`
                : '300px',
            width: '100%',
          }}
        >
          <AgGridReact
            columnDefs={accountTypes.map(accountType => {
              return {
                headerName: accountType.accountTypeName,
                field: accountType.accountTypeName
              };
            })}
            rowData={accountTypeViewFeatures}
            frameworkComponents={{
              checkboxCellRenderer: CheckboxCellRenderer,
              actionsCellRenderer: ActionsCellRenderer,
            }}
            defaultColDef={{
              flex: 1,
              editable: false,
              resizable: true,
              sortable: true,
            }}
            onCellValueChanged={() => {}}
            animateRows
            onGridReady={() => {}}
          />
        </div>
        {/* <div className="row">{this.renderAccountTypes(accountTypes)}</div> */}
      </div>
    );
  }
}

export default AdminPage;
