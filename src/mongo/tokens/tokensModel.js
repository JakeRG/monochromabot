const { mongoDB } = require('../mongodb');

const tokensSchema = {
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  expiryTimestamp: {
    type: Number,
  },
  tokenInfo: {
    type: String,
  },
  scope: {
    type: [String],
  },
};

const TokensModel = mongoDB.model('tokens', tokensSchema);

module.exports = TokensModel;
