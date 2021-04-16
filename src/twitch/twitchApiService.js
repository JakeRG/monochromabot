const { ApiClient } = require('twitch');
const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');
const { PubSubClient } = require('twitch-pubsub-client');

const TokensService = require('../mongo/tokens/tokensService');
const logger = require('../logger');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;


const getApiClientForChannel = async (channel) => {
  // Get tokens for the given channel (user)
  const tokens = await TokensService.getTokensByUser(channel);
  if (!tokens) {
    logger.warn(`No valid tokens with require scope for user / channel ${channel}.`);
    return null;
  }

  // TODO: add checks on scopes here?

  // Set up authentication with the found tokens
  let authProvider;
  if (tokens.refreshToken && tokens.refreshToken !== '') {
    authProvider = new RefreshableAuthProvider(
      new StaticAuthProvider(clientId, tokens.accessToken),
      {
        clientSecret,
        refreshToken: tokens.refreshToken,
        expiry: tokens.expiryTimestamp === null ? null : new Date(tokens.expiryTimestamp),
        onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
          const expiryTimestamp = expiryDate === null ? null : expiryDate.getTime();
          await TokensService.updateTokens(
            channel,
            accessToken,
            refreshToken,
            expiryTimestamp,
          );
        },
      },
    );
  } else {
    authProvider = new StaticAuthProvider(clientId, tokens.accessToken);
  }

  // Use the authentication to set up an API client
  const apiClient = new ApiClient({ authProvider });

  return apiClient;
};


const getPubSubClientForChannel = async (channel) => {
  try {
    // Get ApiClient for channel
    const apiClient = await getApiClientForChannel(channel);
    if (!apiClient) {
      logger.warn(`No ApiClient available for ${channel}, no PubSub subscription generated.`);
      return null;
    }

    // Set up PubSub client with given ApiClient
    const pubSubClient = new PubSubClient();
    const userId = await pubSubClient.registerUserListener(apiClient);

    // Add listeners
    // Bits events
    const bitsListener = await pubSubClient.onBits(userId, (message) => {
      logger.info(`${message.userName} just cheered for ${message.bits} bits with message ${message.message} in channel ${channel}!`);
    });

    // Bits badges
    const bitsBadgeListener = await pubSubClient.onBitsBadgeUnlock(userId, (message) => {
      logger.info(`${message.userName} just unlocked bits badge ${message.badgeTier} and shared message ${message.message} in channel ${channel}!`);
    });

    // Mod actions
    /*
    // Temporarily disabled until scopes are added and/or properly checked before trying to add the listener
    const modActionListener = await pubSubClient.onModAction(userId, (message) => {
      logger.info(`Moderator ${message.userDisplayName} just did ${message.action} with args ${message.args} in channel ${channel}!`);
    });
    */

    // Channel Point Redemptions
    const channelPointRedemptionsListener = await pubSubClient.onRedemption(userId, (message) => {
      const userInput = message.message ? `with message ${message.message} ` : '';
      logger.info(`${message.userDisplayName} just redeemed ${message.rewardName} ${userInput}in channel ${channel}!`);
    });

    // Subscriptions
    const subscriptionListener = await pubSubClient.onSubscription(userId, (message) => {
      logger.info(`${message.userDisplayName} just subscribed to channel ${channel}!`);
    });

    // Create and return object containing the pubSubClient and all listeners
    const pubSub = {
      apiClient,
      pubSubClient,
      bitsListener,
      bitsBadgeListener,
      //modActionListener,
      channelPointRedemptionsListener,
      subscriptionListener,
    };
    return pubSub;
  } catch (e) {
    logger.error(e);
    return null;
  }
};

module.exports = {
  getPubSubClientForChannel,
};
