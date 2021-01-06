const io = require('socket.io-client');
const logger = require('../logger');

const { JTTB_HOST } = process.env;

logger.info(`Host: ${JTTB_HOST}`);

const socket = io(JTTB_HOST);

socket.on('connect', () => {
  logger.info(`Succesfully connected to JTTB: ${socket.connected}`);
});

const shareMessage = (channel, user, message) => {
  socket.emit('shareMsg', channel, user, message);
};

module.exports = {
  shareMessage,
};
