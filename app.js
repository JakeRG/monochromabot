require('dotenv').config();

// IMPORTS

// const fs = require('fs').promises;
// const { existsSync } = require('fs');
const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');
const { ChatClient } = require('twitch-chat-client');

const TokensService = require('./src/tokens/tokensService');
const chatCommands = require('./src/chatCommands');
const logger = require('./src/logger');


// CONSTANTS

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;


// FUNCTIONS

// ...... //


// MAIN

async function main() {
  /* OLD:
      // Check if we need to create a tokens file
      if (!existsSync('./tokens.json')) {
        await fs.writeFile('./tokens.json', JSON.stringify(TokensService.initTokenData(), null, 2), 'UTF-8');
      }
      const tokenData = JSON.parse(await fs.readFile('./tokens.json'));
  */
  const tokenData = await TokensService.readTokens();

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

        /* OLD:
            const newTokenData = {
              accessToken,
              refreshToken,
              expiryTimestamp: expiryDate === null ? null : expiryDate.getTime(),
            };
            await fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 2), 'UTF-8');
        */
      },
    },
  );

  // Actually set up the chat client and join the channel(s)
  const channels = ['Jake_R_G'];
  const chatClient = new ChatClient(auth, { channels });
  await chatClient.connect();

  logger.info(`MonochromaBot launched. Joined channels: ${channels}`);

  chatClient.onMessage((channel, user, message, privMsg) => {
    chatCommands.handleCommands(chatClient, channel, user, message, privMsg);
  });
}

// Start!
main();
