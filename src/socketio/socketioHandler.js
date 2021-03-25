const io = require('socket.io-client');

// We only import this for auto-completion reasons
// eslint-disable-next-line no-unused-vars
const { PrivateMessage, ChatUser } = require('twitch-chat-client');

const logger = require('../logger');

const { JTTB_HOST, JTTB_TOKEN } = process.env;

logger.info(`Host: ${JTTB_HOST}`);

const socket = io(JTTB_HOST, {
  auth: {
    token: JTTB_TOKEN,
  },
});

socket.on('connect', () => {
  logger.info(`Succesfully connected to JTTB: ${socket.connected}`);
});

/**
 * Takes all the properties off a ChatUser object and returns them as raw data,
 * because the receiving end might not understand how to parse a ChatUser object.
 * @param {ChatUser} userInfo - The user info to break apart.
 * @returns {Object} - The userInfo as a plain object.
 */
const regroupUserDetails = (userInfo) => {
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

  return userDetails;
};

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
    const userDetails = regroupUserDetails(userInfo);

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

/**
 * Function used to parse background change events and send them to the server.
 *
 * @param {*} channel - The channel (SocketIO room) to send the event to.
 * @param {*} user - The user that sent the command (not currently used!).
 * @param {String} message - The message that was sent to the channel.
 * @param {*} privMsg - More info about the message and user that sent the command (not currently used!).
 */
const sendBgEvent = (channel, user, message) => { // , privMsg) => { // <- commented out for ESLint
  // User info not currently needed
  // const { userInfo } = privMsg;
  // const userDetails = regroupUserDetails(userInfo);

  let event = null;

  // Parse speed
  if (message.toLowerCase().startsWith('!start ')) {
    const value = message.substring(7);
    event = {
      start: value,
    };
  }

  if (message.toLowerCase().startsWith('!end ')) {
    const value = message.substring(5);
    event = {
      end: value,
    };
  }

  if (message.toLowerCase().startsWith('!size ')) {
    const value = message.substring(6);
    event = {
      size: value,
    };
  }

  if (message.toLowerCase().startsWith('!width ')) {
    const value = message.substring(7);
    event = {
      width: value,
    };
  }

  if (message.toLowerCase().startsWith('!height ')) {
    const value = message.substring(8);
    event = {
      height: value,
    };
  }

  if (message.toLowerCase().startsWith('!dist ')) {
    const value = message.substring(6);
    event = {
      dist: value,
    };
  }

  if (message.toLowerCase().startsWith('!speed ')) {
    const value = message.substring(7);
    event = {
      speed: value,
    };
  }

  if (event) {
    const payload = {
      channel: channel.substring(1),
      event,
    };

    socket.emit('bgEvent', payload);
  }
};

module.exports = {
  shareMessage,
  sendBgEvent,
};
