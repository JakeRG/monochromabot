const _ = require('lodash');

const adminUsers = ['jake_r_g'];

const parseAdminCommands = (client, channel, command) => {
  if (_.startsWith(command, 'loglevel ')) {
    const level = command.substr(command.indexOf(' ') + 1);
    client.log.debug(level);
    if (_.includes(['trace', 'debug', 'info', 'warn', 'error', 'fatal'], level)) {
      client.log.setLevel(level);
      client.action(channel, `Log level set to ${level}.`);
    }
  }
};

const parseCommands = (client, channel, command) => {
  if (_.startsWith(command, 'help')) {
    client.action(channel, 'Yo, I\'m just a silly WIP, what do you want from me');
  }
};

const handleCommands = (client, channel, user, message, self) => {
  client.log.debug(`Channel: ${JSON.stringify(channel)}`);
  client.log.debug(`channel sub: ${channel.substr(1)}`);
  client.log.debug(`User: ${JSON.stringify(user)}`);
  client.log.debug(`Message: ${JSON.stringify(message)}`);
  client.log.debug(`Self: ${JSON.stringify(self)}`);

  if (!self && (message.substr(0, 1) === '!' || message.substr(0, 1) === '/' || message.substr(0, 1) === '\\')) {
    const command = message.substring(1);
    parseCommands(client, channel.substr(1), command);
    if (_.includes(adminUsers, user.username)) {
      parseAdminCommands(client, channel.substr(1), command);
    }
  }
};

module.exports = {
  handleCommands,
};
