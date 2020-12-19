// We disable no-console for this file, because logging to the console is the entire purpose of this file.
/* eslint-disable no-console */

const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'none'];

let currentLogLevel = process.env.DEFAULT_LOG_LEVEL || 1;

const setLogLevel = (logLevel) => {
  const i = logLevels.indexOf(logLevel);
  if (i !== -1) {
    currentLogLevel = i;
    return true;
  }
  return false;
};

const trace = (msg) => {
  if (currentLogLevel === 0) {
    console.log(msg);
  }
};

const debug = (msg) => {
  if (currentLogLevel <= 1) {
    console.log(msg);
  }
};

const info = (msg) => {
  if (currentLogLevel <= 2) {
    console.log(msg);
  }
};

const warn = (msg) => {
  if (currentLogLevel <= 3) {
    console.log(msg);
  }
};

const error = (msg) => {
  if (currentLogLevel <= 4) {
    console.log(msg);
  }
};

const fatal = (msg) => {
  if (currentLogLevel <= 5) {
    console.log(msg);
  }
};

module.exports = {
  setLogLevel,
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
};
