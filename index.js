const browserContext = require("./utils/browser.js");
const swymPuppet = require("./utils/swymPuppet.js")
const fileOperations = require("./utils/fileOperations.js");
const configuration = require("./swym_config/puppet_config.js").getConfig();
const logger = require("./utils/logger.js");
var statusRecords = [];
/* Start of Helper Function */
async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

/* End of Helper Function */
async function initSwymPuppet() {
	const urls = await fileOperations.getInputStoreUrlsFromCSV("./shopify_stores.csv");
	logger.logToConsole({message:"Puppet App started.. >"},"log");

	const browserObject = await browserContext.getRunningBrowserInstance();
	const {
		page,
		browser
	} = browserObject;
	await asyncForEach(urls, async function(url, index) {
		let appObj = {};
		appObj.store_url = url;
		await browserContext.navigateTo(url, page);
		let store = await swymPuppet.validateShopifyStore(page, configuration.selectors);
		appObj.status = store.status;
		appObj.comments = store.comments;
		if (store.status) {
			appObj.swymValidations = await swymPuppet.checkSwymVariables(url, page);
			appObj.retailerSettings = await swymPuppet.getRetailerSettings(page, "Watchlist");
			if(appObj.retailerSettings){
				console.log(appObj.retailerSettings, "Found it!");
				let watchListSettings = await swymPuppet.getAppSpecificRetailerSettings(appObj.retailerSettings, "Watchlist")
				appObj.watchListSettings = watchListSettings;
				//let UIChecks = await swymPuppet.runUIValidations(page, watchListSettings);
			}
			appObj.processed = true;
		} else {
			appObj.processed = false;
			appObj.swymValidations = {
				swatPresent: false,
				OOS_URL: "none",
				validSwymPageData: false,
				isInventoryManagementValid: false
			}
			appObj.retailerSettings = {};
		}
		statusRecords.push(appObj);
	});
	//console.log(statusRecords);
	await browser.close();
	await writeProcessLogsToOutputFile(statusRecords);

}

async function writeProcessLogsToOutputFile(statusRecords) {
	let filteredRecords = [];
	let headers = [{
		id: "store_url",
		title: "Store URL"
	}, {
		id: "status",
		title: "Store Status"
	}, {
		id: "comments",
		title: "Comments"
	}, {
		id: "processed",
		title: "Processed Store"
	}, {
		id: "isSwymInstalled",
		title: "Swym Installed"
	}, {
		id: "OOS_URL",
		title: "Out of Stock URL"
	}, {
		id: "isInventoryManagementValid",
		title: "Shopify Inventory"
	}, {
		id: "validSwymPageData",
		title: "Is Valid SwymPageData"
	}];
	
	statusRecords.forEach(function(r) {
		let tempObj = {};
		tempObj.store_url = r.store_url;
		tempObj.status = r.status;
		tempObj.comments = r.comments;
		tempObj.processed = r.processed;
		tempObj.OOS_URL = r.swymValidations.OOS_URL;
		tempObj.validSwymPageData = r.swymValidations.validSwymPageData;
		tempObj.isSwymInstalled = r.swymValidations.swatPresent;
		tempObj.isInventoryManagementValid = r.swymValidations.isInventoryManagementValid;
		console.log(tempObj);
		filteredRecords.push(tempObj);
	})
	fileOperations.writeRecords("./results.csv", filteredRecords, headers);
}

initSwymPuppet();