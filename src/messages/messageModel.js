const { mongoDB } = require('../mongodb');

const messageSchema = {
  user: {
    type: String,
  },
  channel: {
    type: String,
  },
  timestamp: {
    type: Number,
  },
};

const MessageModel = mongoDB.model('message', messageSchema);

module.exports = MessageModel;
