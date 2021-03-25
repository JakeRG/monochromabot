require('dotenv').config();

// IMPORTS

const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');
const { ChatClient } = require('twitch-chat-client');

const SocketIOHandler = require('./socketio/socketioHandler');

const MessageService = require('./messages/messageService');
const TokensService = require('./tokens/tokensService');
const chatCommands = require('./chatCommands');
const logger = require('./logger');

// MAIN

async function main() {
  try {
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
    // const channels = ['Jake_R_G'];// , 'Kelpsey']; // TODO: make channels variable?
    const channels = ['Jake_R_G', 'Kelpsey']; // TODO: make channels variable?
    const joinedChannels = () => channels;
    const chatClient = new ChatClient(auth, { channels: joinedChannels });
    await chatClient.connect();


    logger.info(`MonochromaBot launched. Joined channels: ${joinedChannels()}`);

    /*
    // Example of how to dynamically join channels
    chatClient.onRegister(async () => {
      try {
        const joined = await chatClient.join('Beta64');
      } catch (e) {
        console.log(e.message);
      }
    });
    */

    chatClient.onMessage((channel, user, message, privMsg) => {
      // For now, only keep track of messages in own channel.
      // We don't want to get in trouble, now do we?
      if (channel.toLocaleLowerCase() === 'jake_r_g') {
        MessageService.saveMessage(user, channel);
      }
      chatCommands.handleCommands(chatClient, channel, user, message, privMsg);
      SocketIOHandler.shareMessage(channel, user, message, privMsg);
      SocketIOHandler.sendBgEvent(channel, user, message, privMsg);
    });
  } catch (e) {
    logger.fatal(`Failed to start MonochromaBot! Error: ${e.message}`);
  }
}

// Start!
main();
