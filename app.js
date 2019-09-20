require('dotenv').config();

const tmi = require('tmi.js');
const chatCommands = require('./commands/chatCommands');

const options = {
  options: {
    debug: true,
  },
  connection: {
    cluster: 'aws',
    reconnect: true,
  },
  identity: {
    username: 'MonochromaBot',
    password: process.env.OAUTH,
  },
  channels: ['Jake_R_G'],
};

const client = new tmi.Client(options);

client.log.setLevel('debug');

client.connect();

client.on('connected', (address, port) => {
  client.say('Jake_R_G', `Hello! I'm connected on ${address}:${port}.`);
});

client.on('chat', (channel, user, message, self) => {
  chatCommands.handleCommands(client, channel, user, message, self);
});
