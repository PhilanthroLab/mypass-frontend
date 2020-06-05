import React, {Component} from 'react';
import LoginPage from './auth/LoginPage';
import MainContainer from './main/MainContainer';
import Account from '../models/Account';
import AuthService from '../services/AuthService';
import LoginResponse from '../models/auth/LoginResponse';
import AccountService from '../services/AccountService';
import ProgressIndicator from './common/ProgressIndicator';
import './App.scss';
import Role from '../models/Role';
import ShareRequest from '../models/ShareRequest';
import EncryptionKeyResponse from '../models/EncryptionKeyResponse';
import UrlUtil from '../util/UrlUtil';

interface AppState {
  account?: Account;
  isLoading: boolean;
  theme: string;
  privateEncryptionKey?: string;
}

class App extends Component<{}, AppState> {
  constructor(props: Readonly<{}>) {
    super(props);

    this.state = {
      account: undefined,
      isLoading: false,
      theme: Role.owner
    };
  }

  async componentDidMount(): Promise<void> {
    let {account, theme, privateEncryptionKey} = {...this.state};
    this.setState({isLoading: true});
    const code = UrlUtil.getQueryVariable('code');
    if (code) {
      // TODO
      const response = await AccountService.getToken(code);
      AuthService.logIn(response.access_token);
      // debugger;
      // window.location.replace(location.origin);
    }
    if (AuthService.isLoggedIn()) {
      try {
        const loginResponse = await AccountService.getMyAccount();
        const encryptionKeyResponse: EncryptionKeyResponse = await AccountService.getEncryptionKey();
        privateEncryptionKey = encryptionKeyResponse.encryptionKey;
        ({account} = {...loginResponse});
        theme = account?.role;
        document.body.classList.remove('theme-helper', 'theme-owner');
        document.body.classList.add(`theme-${theme}`);
      } catch (err) {
        console.error(err.message);
      }
    }
    this.setState({account, theme, isLoading: false, privateEncryptionKey});
  }

  handleLogin = async (response: any): Promise<void> => {
    let {account, theme, privateEncryptionKey} = {...this.state};
    this.setState({isLoading: true});
    try {
      const loginResponse: LoginResponse = response as LoginResponse;
      ({account} = {...loginResponse});
      theme = account?.role;
      document.body.classList.remove('theme-helper', 'theme-owner', 'theme-admin');
      document.body.classList.add(`theme-${theme}`);
      AuthService.logIn(account?.token);
      const encryptionKeyResponse: EncryptionKeyResponse = await AccountService.getEncryptionKey();
      privateEncryptionKey = encryptionKeyResponse.encryptionKey;
    } catch (err) {
      console.error('failed to login.');
    }
    this.setState({account, theme, isLoading: false, privateEncryptionKey});
  };

  handleLogout = () => {
    AuthService.logOut();
    this.setState({account: undefined});
  };

  updateAccountShareRequests = (requests: ShareRequest[]) => {
    const {account} = {...this.state};
    account!.shareRequests = requests;
    this.setState({account});
  };

  render() {
    const {account, isLoading, theme, privateEncryptionKey} = {
      ...this.state
    };
    return (
      <div className="app-container">
        {process.env.NODE_ENV === 'development' && <div className="screen-info" />}
        {isLoading && <ProgressIndicator isFullscreen/>}
        {!isLoading && (
          <div className="page-container">
            {account && (
              <MainContainer
                account={account}
                handleLogout={this.handleLogout}
                updateAccountShareRequests={this.updateAccountShareRequests}
                privateEncryptionKey={privateEncryptionKey}
              />
            )}
            {!account && <LoginPage handleLogin={this.handleLogin}/>}
          </div>
        )}
      </div>
    );
  }
}

export default App;
