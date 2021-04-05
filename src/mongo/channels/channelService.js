const Channel = require('./channelModel');
const logger = require('../../logger');

const { DEFAULT_CHANNEL } = process.env;

const joinedChannels = async () => {
  try {
    const channels = await Channel.find({}).lean().exec();
    if (!channels || channels.length === 0) {
      logger.error(`No channels found to join! Using default: ${DEFAULT_CHANNEL}`);
      return [DEFAULT_CHANNEL];
    }
    return channels.map((x) => x.channelName);
  } catch (e) {
    logger.fatal(`Fatal error when trying to fetch joined channels: ${e.message}`);
    return null;
  }
};

const addChannel = async (channelName, addedBy, addedThrough) => {
  try {
    // Check if already in the list
    const old = await Channel.findOne({ channelName }).lean().exec();
    if (old) {
      logger.warn(`Channel ${channelName} already in the list of joined channels! - ${JSON.stringify(old)}`);
      return null;
    }
    const channel = {
      channelName,
      addedBy,
      addedThrough,
      addedOn: Date.now(),
    };
    const joined = await Channel.create(channel);
    if (joined) {
      logger.info(`Channel '${channelName}' added! - ${JSON.stringify(joined)}`);
    } else {
      logger.warn('Something probably went wrong when adding the channel to join to the database!');
    }
    return joined;
  } catch (e) {
    logger.error(e.message);
    return null;
  }
};

const removeChannel = async (channelName) => {
  try {
    await Channel.findOneAndRemove({ channelName });
  } catch (e) {
    logger.error(e.message);
  }
};

module.exports = {
  joinedChannels,
  addChannel,
  removeChannel,
};
