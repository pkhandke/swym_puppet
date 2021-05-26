const browserContext = require("./utils/browser.js");
const helper = require("./utils/helpers.js");
const swymPuppet = require("./utils/swymPuppet.js");
const fileOperations = require("./utils/fileOperations.js");
const configuration = require("./swym_config/puppet_config.js").getConfig();
const logger = require("./utils/logger.js");
var statusRecords = [];
async function initSwymPuppet() {
	const rows = await fileOperations.getInputStoreUrlsFromCSV(
		configuration.fileConfig.inputFilePath
	);
	logger.logToConsole({
			message: "Puppet App started.. >",
		},
		"log"
	);
	const browserObject = await browserContext.getRunningBrowserInstance();
	let {
		page,
		browser
	} = browserObject;
	await helper.asyncForEach(rows, async function (rowData) {
		let url = rowData.store_url; // Store URL
		let appName = rowData.appName; // Current  APP Used
		let processResultObject = {};
		processResultObject.store_url = url;
		await browserContext.navigateTo(url, page);
		let store = await swymPuppet.validateShopifyStore(
			page,
			configuration.invalidStoreSelector
		);
		processResultObject.status = store.status;
		processResultObject.comments = store.comments;
		if (store.status) {
			processResultObject.hostUrl = page.url();
			processResultObject.pid = await swymPuppet.getPID(page);
			processResultObject.swymValidations = await swymPuppet.checkSwymVariables(
				url,
				page,
				appName
			);
			processResultObject.retailerSettings =
				await swymPuppet.getRetailerSettings(page, appName);
			let isEmptyRetailerSettingsObject = await helper.isEmpty(
				processResultObject.retailerSettings
			);
			if (!isEmptyRetailerSettingsObject) {
				let appSpecificRetailerSettings =
					await swymPuppet.getAppSpecificRetailerSettings(
						processResultObject.retailerSettings,
						appName
					);
				processResultObject.appRetailerSettings = appSpecificRetailerSettings;
				let UIChecks = await swymPuppet.runUIValidations(
					page,
					appSpecificRetailerSettings,
					appName
				);
				processResultObject.validated_ui = UIChecks;
			}
			processResultObject.processed = true;
		} else {
			processResultObject.processed = true;
			processResultObject.swymValidations = {
				swatPresent: false,
				OOS_URL: "N/A",
				validSwymPageData: false,
				isInventoryManagementValid: false,
				appName: appName,
			};
			processResultObject.retailerSettings = {};
			processResultObject.isMigratable = false;
		}
		statusRecords.push(processResultObject);
	});
	await helper.delay(2000);
	await browser.close();
	await writeProcessLogsToOutputFile(statusRecords);
}
async function writeProcessLogsToOutputFile(statusRecords) {
	let finalOutputRecords = [];
	statusRecords.forEach(function (r) {
		let tempObj = {};
		tempObj.store_url = r.store_url;
		tempObj.status = r.status;
		tempObj.comments = r.comments;
		tempObj.processed = r.processed;
		tempObj.OOS_URL = r.swymValidations.OOS_URL;
		tempObj.validSwymPageData = r.swymValidations.validSwymPageData;
		tempObj.isSwymInstalled = r.swymValidations.swatPresent;
		tempObj.isInventoryManagementValid =
			r.swymValidations.isInventoryManagementValid;
		tempObj.validated_ui = r.validated_ui;
		tempObj.pid = r.pid;
		tempObj.migratable = checkIfMigratable(tempObj);
		finalOutputRecords.push(tempObj);
	});

	function checkIfMigratable(tempObj) {
		let isMigrateable = false;
		try {
			isMigrateable =
				tempObj.status &&
				tempObj.OOS_URL &&
				tempObj.isSwymInstalled &&
				tempObj.validSwymPageData &&
				tempObj.validated_ui;
			console.log("Store - is migratable", isMigrateable);
			return isMigrateable;
		} catch (e) {
			logger.logToConsole({
					message: "Error writing output of migratable ",
					info: e,
				},
				"log"
			);
			return isMigrateable;
		}
	}
	fileOperations.writeRecords(
		configuration.fileConfig.outputFilePath,
		configuration.fileConfig.outputFileHeaders,
		finalOutputRecords
	);
}
initSwymPuppet();