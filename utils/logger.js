let configuration = require("../swym_config/puppet_config.js").getConfig();

function logToConsole(meta, type) {
  // Adding logging for future instances for tracking
  switch (type) {
    case "error":
      console.error("Error: ", meta.message, meta.error);
      break;
    case "log":
      meta.info = meta.info || "";
      console.log("Message: ", meta.message, meta.info);
      break;
    case "warn":
      console.warn("Warning: ", meta.message);
      break;
    case "debug":
      console.debug("Debug: ", meta.message);
  }
}

function writeDebugLogToFile(log) {
  let { store_url, message, logType, value } = log;
  let headers = [
    {
      id: "store_url",
      title: "URL",
    },
    {
      id: "message",
      title: "message",
    },
    {
      id: "type",
      title: "Log Type",
    },
    {
      id: "status",
      title: "Status",
    },
  ];
}

module.exports = {
  writeDebugLogToFile,
  logToConsole,
};
