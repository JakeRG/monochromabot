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
  const { color } = privMsg.userInfo;
  socket.emit('shareMsg', channel, user, message, color);
};

module.exports = {
  shareMessage,
};
