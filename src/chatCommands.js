// We only import this for auto-completion reasons
// eslint-disable-next-line no-unused-vars
const { PrivateMessage } = require('twitch-chat-client');

const ChannelService = require('./mongo/channels/channelService');
const CommandService = require('./mongo/commands/commandService');
const MessageService = require('./mongo/messages/messageService');

const logger = require('./logger');

const globalSilentMode = process.env.SILENT_MODE || true;

const adminUsers = ['jake_r_g'];
const channelsSettings = [];
const takenCommandNames = [
  '!logLevel',
  '!topChat',
  '!silentBot',
  '!silenceBot',
  'shut up, bot',
  '!speakBot',
  'hey bot, talk',
  '!addCommand',
  '!updateCommand',
  '!removeCommand',
  '!deleteCommand',
  '!help',
  '!ping',
  // Channel join / leave
  '!join',
  '!leave',
  // BG Event commands
  '!start',
  '!end',
  '!size',
  '!width',
  '!height',
  '!dist',
  '!speed',
  '!empty',
  '!thin',
];

const getChannelSilentMode = (channel) => {
  const channelSettings = channelsSettings.find((x) => x.channel === channel);
  if (channelSettings && (channelSettings.silent === true || channelSettings.silent === false)) {
    return channelSettings.silent;
  }
  return globalSilentMode;
};

const setChannelSilentMode = (channel, silent) => {
  const channelSettings = channelsSettings.find((x) => x.channel === channel);
  if (channelSettings) {
    channelSettings.silent = silent;
    channelsSettings[channelsSettings.findIndex((x) => x.channel === channel)] = channelSettings;
  } else {
    channelsSettings.push({ channel, silent });
  }
};

// Custom commands
const runCustomCommand = async (client, channel, message, isAdmin, isMod) => {
  try {
    const command = await CommandService.findCommand(channel, message, isAdmin, isMod);
    if (command) {
      logger.debug(`Command found: ${JSON.stringify(command)}`);
      if (command.action) {
        client.action(channel, command.output);
        return;
      }
      client.say(channel, command.output);
    }
  } catch (e) {
    logger.error(`Error in runCustomCommand: ${e.message}`);
  }
};

/**
 * Functions to manage the custom commands stored in the database.
 *
 * @param {*} client The chat client object used by the bot to send messages to the channel, etc
 * @param {*} channel The channel in which the message was sent
 * @param {*} message The message sent by the user
 * @returns {Boolean} - True if there were any command-managing commands, false if not.
 */
const manageCustomCommands = async (client, channel, message) => {
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
          return true;
        }

        // Check if command is in the list of hardcoded commands
        if (takenCommandNames.includes(trigger)) {
          client.say(channel, `Command '${trigger}' can't be altered!`);
          return true;
        }

        // Add command
        await CommandService.addCommand(channel, trigger, output, adminOnly, modOnly, action);
      }
      return true;
    } catch (e) {
      logger.error(`Error in parseAdminCommands - addCommand: ${e.message}`);
      return true;
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
          return true;
        }

        // Update command
        await CommandService.updateCommand(channel, trigger, output);
        client.say(channel, `Command ${trigger} has been updated!`);
      }
      return true;
    } catch (e) {
      logger.error(`Error in parseAdminCommands - updateCommand: ${e.message}`);
      return true;
    }
  }

  // 'Remove command' suggestion
  if (message.startsWith('!removeCommand')) {
    client.say(channel, 'Try !deleteCommand :)');
  }

  // Delete commands
  if (message.startsWith('!deleteCommand ')) {
    try {
      const trigger = message.substr('!deleteCommand '.length);

      // Check if command exists
      const command = await CommandService.findCommand(channel, trigger, true, true);
      if (!command) {
        client.say(channel, `Command '${trigger}' does not exist!`);
        return true;
      }

      // Delete command
      await CommandService.deleteCommand(channel, trigger);
      client.say(channel, `Command ${trigger} has been deleted!`);

      return true;
    } catch (e) {
      logger.error(`Error in parseAdminCommands - deleteCommand: ${e.message}`);
      return true;
    }
  }

  // If there were no command-managing commands, return false
  return false;
};

const parseAdminCommands = async (client, channel, message, user) => {
  // ADMIN (that's... me) ONLY STARTS HERE
  if (adminUsers.includes(user)) {
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

    // Join channel
    if (message.startsWith('!join ')) {
      const channelName = message.trim().substr(message.indexOf(' ') + 1);
      logger.debug(channelName);
      if (channelName) {
        const result = await ChannelService.addChannel(
          channelName,
          user,
          'chat command',
        );
        if (result) {
          try {
            await client.join(channelName);
          } catch (e) {
            logger.error(`Something went wrong while trying to join channel '${channelName}': ${e.message}`);
          }
        }
      }
    }

    // Leave channel
    if (message.startsWith('!leave ')) {
      const channelName = message.trim().substr(message.indexOf(' ') + 1);
      logger.debug(channelName);
      if (channelName) {
        await ChannelService.removeChannel(channelName);
        try {
          await client.part(channelName);
        } catch (e) {
          logger.error(`Something went wrong while trying to part (leave) channel '${channelName}': ${e.message}`);
        }
      }
    }
  }
  // ADMIN ONLY ENDS HERE

  // DEBUG
  // Debugging command for top chat functionality
  if (message.startsWith('!topChat')) {
    MessageService.topChatters('#jake_r_g');
    return;
  }

  // Put bot in silent mode
  if (message.startsWith('!silentBot') || message.startsWith('!silenceBot') || message.startsWith('shut up, bot')) {
    setChannelSilentMode(channel, true);
    client.action(channel, 'zips mouth');
  }

  // Take bot out of silent mode
  if (message.startsWith('!speakBot') || message.startsWith('hey bot, talk')) {
    setChannelSilentMode(channel, false);
    client.say(channel, 'Hello!');
  }

  // Manage custom commands.
  // TODO: also let mods do this?
  try {
    if (await manageCustomCommands(client, channel, message)) {
      return;
    }
  } catch (e) {
    logger.error(`Error in parseAdminCommands - manageCustomCommands: ${e.message}`);
  }

  // Only check for custom commands here while in silent mode.
  // This allows admins to keep control even when in silent mode.
  // While not in silent mode, they are run from parseCommands() instead!
  if (getChannelSilentMode(channel)) {
    try {
      await runCustomCommand(client, channel, message, true, true);
    } catch (e) {
      logger.error(`Error in parseAdminCommands - runCustomCommand: ${e.message}`);
    }
  }
};

/**
 * Function to parse commands - only runs while NOT in silent mode!
 * @param {*} client The chat client object used by the bot to send messages to the channel, etc
 * @param {*} channel The channel in which the message was sent
 * @param {*} message The message sent by the user
 * @param {*} isAdmin True if the user is a bot admin, or broadcaster in the channel
 * @param {*} isMod True if the user is a bot admin, or broadcaster or mod in the channel
 */
const parseCommands = async (client, channel, message, isAdmin, isMod) => {
  // Hardcoded commands for all users - these are run ONLY while NOT in silent mode!
  if (message.toLowerCase() === ('!help')) {
    client.action(channel, 'Yo, I\'m just a silly WIP, what do you want from me');
    return;
  }
  if (message.toLowerCase() === ('!ping')) {
    client.say(channel, 'Pong!');
    return;
  }

  // Custom commands - these are run from parseAdminCommands while in silent mode!
  try {
    await runCustomCommand(client, channel, message, isAdmin, isMod);
  } catch (e) {
    logger.error(`Error in parseAdminCommands - runCustomCommand: ${e.message}`);
  }
};

/**
 * Function that detects, parses and handles any commands that might be sent in chat.
 *
 * @param {*} client The chat client object used by the bot to send messages to the channel, etc
 * @param {*} channel The channel in which the message was sent
 * @param {*} user The user that sent the message
 * @param {*} message The message sent by the user
 * @param {PrivateMessage} privMsg PrivateMessage object containing more information
 */
const handleCommands = (client, channel, user, message, privMsg) => {
  const self = (user.toLowerCase() === process.env.USERNAME.toLowerCase());

  logger.debug(`Channel: ${JSON.stringify(channel)}`);
  logger.debug(`channel sub: ${channel.substr(1)}`);
  logger.debug(`User: ${JSON.stringify(user)}`);
  logger.debug(`Message: ${JSON.stringify(message)}`);
  logger.debug(`privMsg: ${JSON.stringify(privMsg)}`);
  logger.debug(`Self: ${JSON.stringify(self)}`);

  const chan = channel.substr(1);

  const chatUser = privMsg.userInfo;
  // TODO: implement rate limitation here?

  if (!self) {
    let isAdmin = false;
    let isMod = false;
    // Check if the user is either a bot admin or a broadcaster in the channel
    if (adminUsers.includes(user) || chatUser.isBroadcaster) {
      isAdmin = true;
      isMod = true;
      // Run any hardcoded admin commands, and override silent mode
      parseAdminCommands(client, chan, message, user);
    }
    // Check if the user is a moderator in the channel
    if (chatUser.isMod) {
      isMod = true;
    }

    // Check any commands that are not hardcoded.
    if (!getChannelSilentMode(chan)) {
      parseCommands(client, chan, message, isAdmin, isMod);
    }
  }
};

module.exports = {
  handleCommands,
};
