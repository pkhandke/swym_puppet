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
	return new Promise(function(resolve, reject) {
		try {
			readRecordsInternal(filePath, function(records) {
				if (records.length > 0) {
					resolve(records);
				} else {
					console.log("----------No Valid Records found!-----------------", records);
					reject(false);
				}
			});
		} catch (e) {
			console.log("Error Input File Reading file", filePath);
			reject(false);
		}
	});
}
//  Reads the r
function readRecordsInternal(path, callback) {
	const records = [];
	fs.createReadStream(path).pipe(csv_parser()).on("data", (data) => records.push(data)).on("end", () => {
		callback(records);
	});
}
async function getInputStoreUrlsFromCSV(filePath) {
	let rows = [];
	if (filePath.length <= 0) {
		console.log("invalid file path", filePath);
		return;
	}
	const records = await getRecords(filePath);
	if (records) {
		rows = records.filter((row) => {
			return row.processed == "false";
		});
		if (rows.length) {
			logger.logToConsole({
				message: "Successfully, retrieved rows for processing",
				info: rows,
			}, "log");
		} else {
			console.log("No Rows to process - check processed flag?", rows);
		}
	} else {
		console.log("No Rows to process - Check if valid input??", rows);
	}
	return rows;
}
module.exports = {
	writeRecords,
	getInputStoreUrlsFromCSV,
};