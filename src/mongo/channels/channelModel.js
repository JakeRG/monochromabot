const { mongoDB } = require('../mongodb');

const channelSchema = {
  channelName: {
    type: String,
  },
  addedBy: {
    type: String,
  },
  addedOn: {
    type: Date,
  },
  addedThrough: {
    type: String,
  },
};

const ChannelModel = mongoDB.model('channel', channelSchema);

module.exports = ChannelModel;
