const Command = require('./commandModel');
const logger = require('../logger');

const addCommand = async (
  channel,
  trigger,
  output,
  adminOnly = true,
  modOnly = true,
  action = false,
) => {
  try {
    const command = {
      channel,
      trigger,
      output,
      adminOnly,
      modOnly,
      action,
    };

    await Command.create(command);
  } catch (e) {
    logger.error(`Error in : ${e.message}`);
  }
};

const findCommand = async (channel, trigger, admin, mod) => {
  try {
    const command = await Command.findOne({
      channel,
      trigger,
    }).lean().exec();

    if (!command) {
      return null;
    }
    if (command.adminOnly && !admin) {
      return null;
    }
    if (command.modOnly && !mod) {
      return null;
    }
    return command;
  } catch (e) {
    logger.error(`Error in findCommand: ${e.message}`);
    return null;
  }
};

const updateCommand = async (channel, trigger, output) => {
  try {
    return Command.findOneAndUpdate({
      channel,
      trigger,
    }, { output }).exec();
  } catch (e) {
    logger.error(`Error in updateCommand: ${e.message}`);
    return null;
  }
};

const deleteCommand = async (channel, trigger) => {
  try {
    return Command.deleteOne({
      channel,
      trigger,
    }).exec();
  } catch (e) {
    logger.error(`Error in deleteCommand: ${e.message}`);
    return null;
  }
};

module.exports = {
  addCommand,
  findCommand,
  updateCommand,
  deleteCommand,
};
