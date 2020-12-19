// Imports
const mongoose = require('mongoose');
const logger = require('./logger');

// Connection string
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`;

// We init to the default connection to prevent VS Code from declaring mongoDB an "any",
// breaking auto-completing functionality.
let mongoDB = mongoose.connection;

// Set up the actual connection
try {
  mongoDB = mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
  });
} catch (e) {
  logger.fatal(e);
  throw e;
}

// Exports
module.exports = {
  mongoDB,
};
