const MessageService = require('./messages/messageService');

const logger = require('./logger');

const adminUsers = ['jake_r_g'];

const parseAdminCommands = (client, channel, command) => {
  if (command.startsWith('loglevel ')) {
    const level = command.substr(command.indexOf(' ') + 1);
    logger.debug(level);
    if (logger.setLogLevel(level)) {
      client.action(channel, `Log level set to ${level}.`);
    } else {
      client.action(channel, 'Log level could not be set.');
    }
  }

  if (command.startsWith('topChat')) {
    MessageService.topChatters('#jake_r_g');
  }
};

const parseCommands = (client, channel, command) => {
  if (command.toLowerCase() === ('help')) {
    client.action(channel, 'Yo, I\'m just a silly WIP, what do you want from me');
  }
  if (command.toLowerCase() === ('ping')) {
    client.say(channel, 'Pong!');
  }
};

const handleCommands = (client, channel, user, message, privMsg) => {
  const self = (user.toLowerCase() === process.env.USERNAME.toLowerCase());

  logger.debug(`Channel: ${JSON.stringify(channel)}`);
  logger.debug(`channel sub: ${channel.substr(1)}`);
  logger.debug(`User: ${JSON.stringify(user)}`);
  logger.debug(`Message: ${JSON.stringify(message)}`);
  logger.debug(`privMsg: ${JSON.stringify(privMsg)}`);
  logger.debug(`Self: ${JSON.stringify(self)}`);

  if (!self && (message.substr(0, 1) === '!' || message.substr(0, 1) === '/' || message.substr(0, 1) === '\\')) {
    const command = message.substring(1);
    parseCommands(client, channel.substr(1), command);
    if (adminUsers.includes(user)) {
      parseAdminCommands(client, channel.substr(1), command);
    }
  }
};

module.exports = {
  handleCommands,
};
