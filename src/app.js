require('dotenv').config();

// IMPORTS

const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');
const { ChatClient } = require('twitch-chat-client');

const MessageService = require('./messages/messageService');
const TokensService = require('./tokens/tokensService');
const chatCommands = require('./chatCommands');
const logger = require('./logger');

// MAIN

async function main() {
  const tokenData = await TokensService.readTokens();

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  const auth = new RefreshableAuthProvider(
    new StaticAuthProvider(clientId, tokenData.accessToken),
    {
      clientSecret,
      refreshToken: tokenData.refreshToken,
      expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
      onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
        const expiryTimestamp = expiryDate === null ? null : expiryDate.getTime();
        await TokensService.updateTokens(
          accessToken,
          refreshToken,
          expiryTimestamp,
        );
      },
    },
  );

  // Actually set up the chat client and join the channel(s)
  const channels = ['Jake_R_G']; // TODO: make channels variable?
  const chatClient = new ChatClient(auth, { channels });
  await chatClient.connect();

  logger.info(`MonochromaBot launched. Joined channels: ${channels}`);

  chatClient.onMessage((channel, user, message, privMsg) => {
    MessageService.saveMessage(user, channel);
    chatCommands.handleCommands(chatClient, channel, user, message, privMsg);
  });
}

// Start!
main();
