import Account from '../Account';

interface Document {
  _id?: string;
  name?: string;
  url: string;
  notarized?: boolean;
  did?: string;
  hash: string;
  vcJwt?: string;
  vpJwt?: string;
  type: string;
  uploadedBy?: Account;
  belongsTo?: Account;
  sharedWithAccountIds: string[];
  validateUntilDate?: Date;
  permanentOrgFileArchiveNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default Document;