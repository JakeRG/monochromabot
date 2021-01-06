const CommandService = require('./commands/commandService');
const MessageService = require('./messages/messageService');

const logger = require('./logger');

const adminUsers = ['jake_r_g'];

const parseAdminCommands = async (client, channel, message) => {
  // Change logging level
  if (message.startsWith('!loglevel ')) {
    const level = message.substr(message.indexOf(' ') + 1);
    logger.debug(level);
    if (logger.setLogLevel(level)) {
      client.action(channel, `Log level set to ${level}.`);
      return;
    }
    client.action(channel, 'Log level could not be set.');
  }

  // Debugging command for top chat functionality
  if (message.startsWith('!topChat')) {
    MessageService.topChatters('#jake_r_g');
    return;
  }

  // Add commands
  if (message.startsWith('!addCommand ')) {
    try {
      let output = message.substr('!addCommand '.length);

      // Check who may perform the action
      let adminOnly = true;
      let modOnly = true;
      if (output.startsWith('admin ')) {
        modOnly = false;
        output = output.substr('admin '.length);
      } else if (output.startsWith('all ')) {
        adminOnly = false;
        modOnly = false;
        output = output.substr('all '.length);
      }

      // Check if the command should be an action rather than a say
      let action = false;
      if (output.startsWith('action ')) {
        action = true;
        output = output.substr('action '.length);
      }

      const triggerEnd = output.indexOf(' ');
      if (triggerEnd > 0) {
        const trigger = output.substr(0, triggerEnd);
        output = output.substr((triggerEnd + 1));

        // Check if command already exists
        const command = await CommandService.findCommand(channel, trigger, true, true);
        if (command) {
          client.say(channel, `Command '${trigger}' already exists!`);
          return;
        }

        // Add command
        await CommandService.addCommand(channel, trigger, output, adminOnly, modOnly, action);
      }
      return;
    } catch (e) {
      logger.error(`Error in parseAdminCommands - addCommand: ${e.message}`);
      return;
    }
  }

  // Update commands
  if (message.startsWith('!updateCommand ')) {
    try {
      let output = message.substr('!updateCommand '.length);

      const triggerEnd = output.indexOf(' ');
      if (triggerEnd > 0) {
        const trigger = output.substr(0, triggerEnd);
        output = output.substr((triggerEnd + 1));

        // Check if command already exists
        const command = await CommandService.findCommand(channel, trigger, true, true);
        if (!command) {
          client.say(channel, `Command '${trigger}' does not exist!`);
          return;
        }

        // Update command
        await CommandService.updateCommand(channel, trigger, output);
        client.say(channel, `Command ${trigger} has been updated!`);
      }
      return;
    } catch (e) {
      logger.error(`Error in parseAdminCommands - updateCommand: ${e.message}`);
      return;
    }
  }

  // Remove commands
  if (message.startsWith('!removeCommand ')) {
    // TODO: implement
    return;
  }

  // Check other commands
  try {
    // TODO: make isAdmin and isMod check user's status, then move this to parseCommands below
    const isAdmin = true;
    const isMod = true;
    const command = await CommandService.findCommand(channel, message, isAdmin, isMod);
    if (command) {
      console.log(`command found: ${JSON.stringify(command)}`); // TODO: remove
      if (command.action) {
        client.action(channel, command.output);
        return;
      }
      client.say(channel, command.output);
    }
  } catch (e) {
    logger.error(`Error in parseAdminCommands - other commands: ${e.message}`);
  }
};

const parseCommands = (client, channel, message) => {
  if (message.toLowerCase() === ('!help')) {
    client.action(channel, 'Yo, I\'m just a silly WIP, what do you want from me');
    return;
  }
  if (message.toLowerCase() === ('!ping')) {
    client.say(channel, 'Pong!');
    // return; // TODO: enable once other commands parsing is moved from parseAdminCommands to here
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

  if (!self && (message.substr(0, 1) === '!')) { // TODO: remove ! requirement?
    parseCommands(client, channel.substr(1), message);
    if (adminUsers.includes(user)) {
      parseAdminCommands(client, channel.substr(1), message);
    }
  }
};

module.exports = {
  handleCommands,
};
