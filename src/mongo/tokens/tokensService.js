const Tokens = require('./tokensModel');
const logger = require('../../logger');

const initTokenData = () => {
  const accessToken = process.env.ACCESS_TOKEN;
  const refreshToken = process.env.REFRESH_TOKEN;
  return {
    accessToken,
    refreshToken,
    expiryTimestamp: 0,
  };
};

const readTokens = async () => {
  try {
    let tokens = await Tokens.findOne({}).exec();
    if (!tokens) {
      tokens = await Tokens.create(initTokenData());
    }
    return tokens;
  } catch (e) {
    logger.error(e);
    return null;
  }
};

const updateTokens = async (accessToken, refreshToken, expiryTimestamp) => {
  // Get the document to update
  try {
    const tokens = await readTokens();
    if (!tokens) {
      // If there is no document to update, we have a problem!
      throw new Error('No tokens object found!');
    }

    // Update fields
    tokens.accessToken = accessToken;
    tokens.refreshToken = refreshToken;
    tokens.expiryTimestamp = expiryTimestamp;

    // Store the tokens in the database.
    return tokens.save();
  } catch (e) {
    if (e.message === 'No tokens object found!') {
      logger.fatal(e);
    } else {
      logger.error(e);
    }
    return null;
  }
};

module.exports = {
  initTokenData,
  readTokens,
  updateTokens,
};
