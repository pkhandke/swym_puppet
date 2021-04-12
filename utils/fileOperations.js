const fs = require("fs");
const csv_parser = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const logger = require("./logger.js");

function writeRecords(path, header, records) {
  const csvWriter = createCsvWriter({
    path: path || "./result.csv",
    header: header,
  });
  try {
    csvWriter.writeRecords(records).then(() => {
      console.log("Completed Writing Output Records");
    });
  } catch (e) {
    console.error("Exception occurred, while writing logs", e);
  }
}

function getRecords(filePath) {
  return new Promise(function (resolve, reject) {
    try {
      readRecordsInternal(filePath, function (records) {
        if (records.length > 0) {
          resolve(records);
        } else {
          console.log("No Valid Records found!");
          reject();
        }
      });
    } catch (e) {
      console.log("Error Input File Reading file", filePath);
      reject(e);
    }
  });
}
//  Reads the r
function readRecordsInternal(path, callback) {
  const records = [];
  fs.createReadStream(path)
    .pipe(csv_parser())
    .on("data", (data) => records.push(data))
    .on("end", () => {
      callback(records);
    });
}
async function getInputStoreUrlsFromCSV(filePath) {
  let urls = [];
  try {
    const fileName = filePath;
    const records = await getRecords(fileName);
    // Filter non-processed Store urls
    urls = records
      .filter((row) => {
        return row.processed == "false";
      })
      .map(function (row) {
        return row.store_url;
      });
    logger.logToConsole(
      {
        message: "Successfully, retrieved urls for processing",
        info: urls,
      },
      "log"
    );
  } catch (e) {
    logger.logToConsole(
      {
        message: "Error Reading Input urls",
        error: e,
      },
      "error"
    );
  }
  return urls;
}
module.exports = {
  writeRecords,
  getRecords,
  getInputStoreUrlsFromCSV,
};
