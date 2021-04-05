const { mongoDB } = require('../mongodb');

const commandSchema = {
  channel: {
    type: String,
  },
  trigger: {
    type: String,
  },
  output: {
    type: String,
  },
  adminOnly: {
    type: Boolean,
  },
  modOnly: {
    type: Boolean,
  },
  action: {
    type: Boolean,
  },
};

const CommandModel = mongoDB.model('command', commandSchema);

module.exports = CommandModel;
