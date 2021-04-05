const Message = require('./messageModel');
const logger = require('../../logger');

const saveMessage = async (user, channel) => {
  try {
    const timestamp = new Date().getTime();
    const message = {
      user,
      channel,
      timestamp,
    };

    await Message.create(message);
  } catch (e) {
    logger.error(e.message);
  }
};

const topChatters = async (channel, limit = 10) => {
  try {
    const result = await Message.aggregate([
      { $match: { channel } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ])
      .sort({ count: -1 })
      .limit(limit)
      .project({
        user: '$_id',
        _id: 0,
        count: 1,
      })
      .exec();

    logger.debug(JSON.stringify(result));
  } catch (e) {
    logger.error(e.message);
  }
};

const deleteMessagesInChannel = async (channel) => {
  try {
    await Message.deleteMany({ channel }).exec();
  } catch (e) {
    logger.error(e.message);
  }
};

module.exports = {
  saveMessage,
  topChatters,
  deleteMessagesInChannel,
};
