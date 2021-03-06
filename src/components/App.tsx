import React, { Component, Fragment } from 'react';
import LoginPage from './auth/LoginPage';
import AdminLoginPage from './auth/AdminLoginPage';
import MainContainer from './main/MainContainer';
import Account from '../models/Account';
import AuthService from '../services/AuthService';
import LoginResponse from '../models/auth/LoginResponse';
import AccountService from '../services/AccountService';
import ApiService from '../services/APIService';
import ProgressIndicator from './common/ProgressIndicator';
import './App.scss';
import Role from '../models/Role';
import ShareRequest from '../models/ShareRequest';
import EncryptionKeyResponse from '../models/EncryptionKeyResponse';
import UrlUtil from '../util/UrlUtil';
import LogoSvg from './svg/logo-svg';

interface AppState {
  account?: Account;
  isLoading: boolean;
  helperLogin: boolean;
  adminLogin: boolean;
  theme: string;
  privateEncryptionKey?: string;
}

class App extends Component<{}, AppState> {
  constructor(props: Readonly<{}>) {
    super(props);

    this.state = {
      account: undefined,
      isLoading: false,
      helperLogin: false,
      adminLogin: false,
      theme: Role.owner,
    };
  }

  async componentDidMount(): Promise<void> {
    setTimeout(() => {
      document.getElementById('splash')!.style.animation = 'fadeout 1s';
      document.getElementById('splash')!.style.opacity = '0';
      document.getElementById('main')!.style.animation = 'fadein 1s';
      document.getElementById('main')!.style.opacity = '1';
    }, 500);
    if (process.env.MYPASS_API === undefined) {
      if (window.location.href.indexOf('localhost') > -1) {
        ApiService.setApiEndpoint('http://localhost:5000/api');
      } else {
        ApiService.setApiEndpoint(location.origin + '/api');
      }
    } else {
      ApiService.setApiEndpoint(process.env.MYPASS_API);
    }

    if (process.env.AUTH_API === undefined) {
      const response = await AccountService.getOauthEndpoint();
      AccountService.setAuthApi(response.url);
    } else {
      AccountService.setAuthApi(process.env.AUTH_API);
    }

    let { account, theme } = { ...this.state };
    this.setState({ isLoading: true });
    const code = UrlUtil.getQueryVariable('code');

    if (code) {
      // they are in the process of logging in, need to exchange auth code for access token
      const response = await AccountService.getToken(code);
      AuthService.logIn(response.access_token, response.refresh_token);
      window.location.replace(`${location.origin}${location.pathname}`);
      return;
    }
    if (AuthService.isLoggedIn()) {
      // they have a jwt access token, use app as normal
      try {
        const loginResponse = await AccountService.getMyAccount();

        ({ account } = { ...loginResponse });

        theme = account?.role;
        document.body.classList.remove('theme-helper', 'theme-owner');
        document.body.classList.add(`theme-${theme}`);
        await this.handleEncryptionKey(account?.role);
      } catch (err) {
        console.error(err.message);
      }
    } else {
      // Stop flow and allow helper to login
      if (window.location.href.indexOf('helper-login') > -1) {
        this.setState({ helperLogin: true });
      } else if (window.location.href.indexOf('admin-login') > -1) {
        this.setState({ adminLogin: true });
      } else {
        // redirect to login page with all of the query string params
        const scope = '';
        const state = '';
        window.location.replace(
          AccountService.getAuthApi() +
            `/?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_url=${location.origin}${location.pathname}&scope=${scope}&state=${state}`
        );
      }
    }
    this.setState({ account, theme, isLoading: false });
  }

  setBringYourOwnEncryptionKey = (key) => {
    let { privateEncryptionKey } = { ...this.state };
    privateEncryptionKey = key;
    this.setState({ privateEncryptionKey });
    window.sessionStorage.setItem('bring-your-own-key', key);
  };

  handleEncryptionKey = async (role) => {
    if (window.sessionStorage.getItem('bring-your-own-key') === null) {
      // If the user did not provider their own key we will provide one
      let encryptionKeyResponse: EncryptionKeyResponse;
      if (role === 'owner') {
        encryptionKeyResponse = await AccountService.getEncryptionKey();
      } else {
        encryptionKeyResponse = await AccountService.getHelperEncryptionKey();
      }
      let key = encryptionKeyResponse.encryptionKey;
      this.setState({ privateEncryptionKey: key });
    } else {
      let key = window.sessionStorage.getItem('bring-your-own-key');
      this.setState({ privateEncryptionKey: key! });
    }
  };

  handleLogin = async (response: any): Promise<void> => {
    let { account, theme, adminLogin } = {
      ...this.state,
    };
    this.setState({ isLoading: true });
    try {
      const loginResponse: LoginResponse = response as LoginResponse;

      ({ account } = { ...loginResponse });
      theme = account?.role;

      if (adminLogin) {
        theme = 'admin';
      }

      document.body.classList.remove(
        'theme-helper',
        'theme-owner',
        'theme-admin'
      );
      document.body.classList.add(`theme-${theme}`);

      AuthService.logIn(account?.token, '');

      console.log('account??');
      console.log(account);
      await this.handleEncryptionKey(account?.role);
    } catch (err) {
      console.error('failed to login.');
      console.error(err);
    }
    this.setState({ account, theme, isLoading: false });
  };

  handleLogout = () => {
    AuthService.logOut();
    window.sessionStorage.removeItem('bring-your-own-key');
    this.setState({ account: undefined });
  };

  updateAccountShareRequests = (requests: ShareRequest[]) => {
    const { account } = { ...this.state };
    account!.shareRequests = requests;
    this.setState({ account });
  };

  render() {
    const {
      account,
      isLoading,
      privateEncryptionKey,
      helperLogin,
      adminLogin,
    } = {
      ...this.state,
    };

    let pageToRender = <ProgressIndicator isFullscreen />;

    if (helperLogin) {
      pageToRender = <LoginPage handleLogin={this.handleLogin} />;
    }

    if (adminLogin) {
      pageToRender = <AdminLoginPage handleLogin={this.handleLogin} />;
    }

    return (
      <Fragment>
        <div
          id="splash"
          style={{
            backgroundColor: '#2362c7',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100vw',
          }}
        >
          <LogoSvg />
        </div>
        <div id="main" className="app-container">
          {process.env.NODE_ENV === 'development' && (
            <div className="screen-info" />
          )}
          {isLoading && <ProgressIndicator isFullscreen />}
          {!isLoading && (
            <div className="page-container">
              {account && (
                <MainContainer
                  account={account}
                  handleLogout={this.handleLogout}
                  updateAccountShareRequests={this.updateAccountShareRequests}
                  privateEncryptionKey={privateEncryptionKey}
                  setBringYourOwnEncryptionKey={
                    this.setBringYourOwnEncryptionKey
                  }
                />
              )}
              {!account && pageToRender}
            </div>
          )}
        </div>
      </Fragment>
    );
  }
}

export default App;
