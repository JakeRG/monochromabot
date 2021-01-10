const io = require('socket.io-client');

// We only import this for auto-completion reasons
// eslint-disable-next-line no-unused-vars
const { PrivateMessage } = require('twitch-chat-client');

const logger = require('../logger');

const { JTTB_HOST } = process.env;

logger.info(`Host: ${JTTB_HOST}`);

const socket = io(JTTB_HOST);

socket.on('connect', () => {
  logger.info(`Succesfully connected to JTTB: ${socket.connected}`);
});

/**
 * Share message read by twitch-chat-client over websocket
 * @param {string} channel The channel to which the message was sent
 * @param {string} user The user that sent the message
 * @param {string} message The message that was sent
 * @param {PrivateMessage} privMsg PrivateMessage object containing more information
 */
const shareMessage = (channel, user, message, privMsg) => {
  // console.log(JSON.stringify(privMsg));
  /*
  console.log(JSON.stringify(privMsg.channelId));
  console.log(JSON.stringify(privMsg.userInfo.color));
  console.log(privMsg.userInfo.badgeInfo);
  console.log(privMsg.userInfo.badges);
  */
  try {
    const { userInfo } = privMsg;
    const parsedMsgParts = privMsg.parseEmotes();

    // Taking all the properties off the ChatUser object and sending them as raw data,
    // because the receiving end might not understand how to parse the ChatUser object.
    const {
      badgeInfo,
      badges,
      color,
      displayName,
      isBroadcaster,
      isFounder,
      isMod,
      isSubscriber,
      isVip,
      userId,
      userType,
    } = userInfo;

    // Regroup all the separate properties under one object for easier handling
    const userDetails = {
      badgeInfo,
      badges,
      color,
      displayName,
      isBroadcaster,
      isFounder,
      isMod,
      isSubscriber,
      isVip,
      userId,
      userType,
    };

    socket.emit('shareMsg', channel, {
      user,
      message,
      privMsg,
      parsedMsgParts,
      userDetails,
    });
  } catch (e) {
    console.error(`Failed to share message '${message}' from user '${user}' in channel '${channel}'! Error: ${e.message}`);
  }
};

module.exports = {
  shareMessage,
};
