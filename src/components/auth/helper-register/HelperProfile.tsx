import React, { Component, Fragment } from 'react';
import GoBackSvg from '../../svg/GoBackSvg';
import FileUploader from '../../common/FileUploader';
import StringUtil from '../../../util/StringUtil';
interface HelperProfileProps {
  previewURL: string;
  goBack: () => void;
  goForward: (prevCardState: HelperProfileState) => void;
}
export interface HelperProfileState {
  previewURL?: string;
  file?: File;
  thumbnailFile?: File;
}
export default class HelperProfile extends Component<
  HelperProfileProps,
  HelperProfileState
> {
  constructor(props) {
    super(props);
    const { previewURL } = { ...this.props };
    this.state = {
      previewURL,
      file: undefined,
      thumbnailFile: undefined,
    };
  }
  setFile = async (file?: File, thumbnailFile?: File, previewURL?: string) => {
    this.setState({ previewURL, file, thumbnailFile });
  };

  render() {
    const { previewURL } = { ...this.state };
    const { goBack, goForward } = { ...this.props };
    return (
      <section id="helper-register" className="container">
        <div ref="section" id="section-1-owner" className="section">
          <div className="section-contents">
            <div className="title1">Document Helper</div>
            <div className="subtitle">Ok, let's pick a username</div>
            <div className="card owner1">
              <div className="card-body">
                <div className="card-body-section" style={{ marginTop: 0 }}>
                  <div className="helper-login">A photo of you</div>
                  <div className="comment">
                    So that document owners can make sure they're adding the
                    right person
                  </div>
                </div>
                <div className="card-body-section1">
                  <div style={{ display: !previewURL ? 'block' : 'none' }}>
                    <FileUploader setFile={this.setFile} />
                    <div className="comment">
                      Please make sure your photo shows your face clearly
                    </div>
                  </div>
                  {previewURL && (
                    <img
                      className="profile-img"
                      src={previewURL}
                      width="125"
                      height="125"
                    />
                  )}
                </div>
                <div className="bottom">
                  <input
                    style={{ width: '210px', marginTop: '27px' }}
                    type="button"
                    value="Next"
                    disabled={!previewURL}
                    onClick={() => goForward(this.state)}
                  />
                </div>
              </div>
            </div>
            <GoBackSvg color="#4BA9D9" goBack={goBack} />
          </div>
        </div>
      </section>
    );
  }
}