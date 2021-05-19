const logger = require("./logger.js");
const browserContext = require("./browser.js");
const uiValidator = require('./ui.js');
async function delay(time) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, time);
	});
}
async function isEmpty(obj) {
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) return false;
	}
	return true;
}
// End of Helper Functions
// Start Swym Specific Functions
async function getOOSURL(url, appName) {
	//https://k5-optima-store.myshopify.com/apps/swym+"appName"/proxy/product.php?oos=true
	let endPoint = "";
	if (appName && appName.toLowerCase() == "wishlist") {
		endpoint = url + "/apps/swymWishlist/proxy/product.php?oos=true"
	} else if (appName && appName.toLowerCase() == "watchlist") {
		endPoint = url + "/apps/swymWatchlist/proxy/product.php?oos=true";
	}
	return endpoint;
}
async function validateShopifyStore(page, invalidStoreSelector) {
	let elements = {};
	try {
		const elementText = await page.$eval(invalidStoreSelector, (elem) => {
			return elem.innerText;
		});
		elements = {
			comments: elementText,
			status: false,
		};
		logger.logToConsole({
			message: "Store Closed / Paused / Behind a Password!",
			info: elementText,
		}, "log");
	} catch (e) {
		logger.logToConsole({
			message: "Is a Valid Store >> ",
			info: page.url(),
		}, "log");
		elements = {
			comments: "Open / Valid Store",
			status: true,
		};
	}
	return elements;
}
async function validateSwymPageData(page) {
	let validSwymPageData = false;
	try {
		let swymPageDataObject = await getSwymPageDataInternal(page);
		validSwymPageData = swymPageDataObject && swymPageDataObject.et == 1 ? true : false;
	} catch (e) {
		logger.logToConsole({
			message: "Error, validating swymPageData",
			error: e,
		}, "error");
	}
	return validSwymPageData;
}
async function getSwymPageDataInternal(page) {
	let product = {};
	try {
		product = await page.evaluate(() => {
			if (typeof window.SwymPageData != "undefined") {
				return window.SwymPageData;
			}
		});
	} catch (e) {
		logger.logToConsole({
			message: "SwymPage is Undefined! / Probably swymSnippet is not running",
			info: product,
		}, "log");
	}
	return product;
}
async function checkIfSwymInstalled(page) {
	let _swatPresent = false;
	try {
		_swatPresent = await page.evaluate(() => {
			return typeof window._swat == "undefined" ? false : true;
		});
		logger.logToConsole({
			message: "Is Swym Installed ? ",
			info: _swatPresent,
		}, "log");
	} catch (e) {
		logger.logToConsole({
			message: "Error, while checking if swym was installed!",
			error: e,
		}, "error");
	}
	return _swatPresent;
}
async function validateSwymInventory(page) {
	let result = [];
	let swymWatchProducts;
	try {
		swymWatchProducts = await getSwymWatchProductsInternal(page);
		let variantKeys = Object.keys(swymWatchProducts);
		variantKeys.forEach((k) => {
			let prd = swymWatchProducts[k];
			if (prd.inventory_management == "shopify") {
				result.push(prd);
			}
		});
	} catch (e) {
		logger.logToConsole({
			message: "Error While validating Inventory ",
			error: e,
		}, "error");
	}
	return result.length > 0 ? true : false;
}
async function getSwymWatchProductsInternal(page) {
	let swymWatchProducts = {};
	try {
		swymWatchProducts = await page.evaluate(() => {
			if (typeof window.SwymWatchProducts != "undefined") {
				return window.SwymWatchProducts;
			}
		});
	} catch (e) {
		logger.logToConsole({
			message: "SwymWatchProducts is Undefined! / Probably swymSnippet is not running",
			info: swymWatchProducts,
		}, "log");
	}
	return swymWatchProducts;
}

async function checkSwymVariables(url, page, appName) {
	let swymObj = {};
	try {
		let content = await waitTillHTMLRendered(page);
		await delay(1000);
		let is_swat = await checkIfSwymInstalled(page);
		swymObj.swatPresent = is_swat;
    swymObj.installedApps = await getInstalledAppsFromCache(page);
		if (is_swat) {
			let swymOOSURL = await getOOSURL(url, appName);
			console.log(swymOOSURL, "OOS URL ");
			await browserContext.navigateTo(swymOOSURL, page);
			swymObj.OOS_URL = page.url();
			swymObj.validSwymPageData = await validateSwymPageData(page);
			await delay(1000);
			swymObj.retailerSettings = await getRetailerSettings(page, appName);
			if (appName.toLowerCase() == "watchlist") {
				swymObj.isInventoryManagementValid = await validateSwymInventory(page);
			} else {
				swymObj.isInventoryManagementValid = "N/A";
			}
		}
	} catch (e) {
		logger.logToConsole({
			message: "Exception while checking swym variables",
			error: e,
		}, "error");
	}
	return swymObj;
}
async function getRetailerSettings(page, appName) {
	let appSettings = {};
	try {
		appSettings = await getSwymRetailerSettingsInternal(page, appName);
	} catch (e) {
		logger.logToConsole({
			message: "Error, trying to get retailerSettings",
			error: e,
		}, "error");
	}
	return appSettings;
}
async function getSwymRetailerSettingsInternal(page, appName) {
	let retailerSettings = {};
	await delay(1000);
	try {
		if (appName.toLowerCase() == "watchlist") {
			retailerSettings = await page.evaluate(() => {
				if (typeof window._swat.retailerSettings.Watchlist != "undefined") {
					return window._swat.retailerSettings.Watchlist;
				}
			});
		} else if (appName.toLowerCase() == "wishlist") {
			retailerSettings = await page.evaluate(() => {
				if (typeof window._swat.retailerSettings.Wishlist != "undefined") {
					return window._swat.retailerSettings.Wishlist;
				}
			});
		}
	} catch (e) {
		logger.logToConsole({
			message: "RetailerSettings is Undefined! / Probably swymSnippet is not running/ page not fully loaded",
			info: retailerSettings,
		}, "log");
	}
	return retailerSettings;
}
// https://stackoverflow.com/questions/52497252/puppeteer-wait-until-page-is-completely-loaded
const waitTillHTMLRendered = async (page, timeout = 30000) => {
	const checkDurationMsecs = 1000;
	const maxChecks = timeout / checkDurationMsecs;
	let lastHTMLSize = 0;
	let checkCounts = 1;
	let countStableSizeIterations = 0;
	const minStableSizeIterations = 3;
	while (checkCounts++ <= maxChecks) {
		let html = await page.content();
		let currentHTMLSize = html.length;
		let bodyHTMLSize = await page.evaluate(
			() => document.body.innerHTML.length);
		console.log("last: ", lastHTMLSize, " <> curr: ", currentHTMLSize, " body html size: ", bodyHTMLSize);
		if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) countStableSizeIterations++;
		else countStableSizeIterations = 0; //reset the counter
		if (countStableSizeIterations >= minStableSizeIterations) {
			console.log("Page rendered complete..");
			break;
		}
		lastHTMLSize = currentHTMLSize;
		await delay(checkDurationMsecs);
	}
};
async function getAppSpecificRetailerSettings(retailerSettings, appName) {
	let appSpecificRetailerSettings = {};
	try {
		appSpecificRetailerSettings.Enabled = retailerSettings.Enabled;
		appSpecificRetailerSettings.ToggleSwitchState = retailerSettings.ToggleSwitchState;
		if (appName.toLowerCase() == "watchlist") {
			appSpecificRetailerSettings.InlineForm = retailerSettings.InlineForm;
			appSpecificRetailerSettings.ShowIfOneOOS = retailerSettings.ShowIfOneOOS;
		}
		if (appName.toLowerCase() == "wishlist") {
			appSpecificRetailerSettings.UseCustomButton = retailerSettings.UseCustomButton;
      appSpecificRetailerSettings.AttachButtonSelector = retailerSettings.AttachButtonSelector;

		}
	} catch (e) {
		logger.logToConsole({
			message: "Error, Validating retailer Settings for app",
			info: appName,
		}, "log");
	}
	return appSpecificRetailerSettings;
}
/*Todo 
1. Check the retailerSettings for form setup (Button / form)
2. Check if the form or button is visible
3. if the flow is a button - Click the button and click the form
4. if the flow is a form - click on the input from and subscribe to pop-up, wait and check if the 
*/
async function runUIValidations(page, retailerSettings, appName) {
	let validUI = false;
	if (appName.toLowerCase() == "watchlist") {
		validUI = uiValidator.runBispaUIValidations(page, retailerSettings, appName);
	} else if (appName.toLowerCase() == 'wishlist') {
		validUI = uiValidator.runWishlistUIValidations(page, retailerSettings, appName);
	}
	return validUI;
}
async function getPID(page) {
	let pid = "";
	try {
		pid = await page.evaluate(() => {
			if (typeof window._swat.pid != "undefined") {
				return window._swat.pid;
			}
		});
	} catch (e) {
		logger.logToConsole({
			message: "PID is Undefined! / Probably insallation issue",
			info: e,
		}, "log");
		pid = "Error, getting pid";
	}
	return pid;
}

async function getInstalledAppsFromCache(page) {
	let appsCache = [];
	try {
		appsCache = await page.evaluate(() => {
			if (typeof window._swat.appsCache != "undefined" ) {
				return window._swat.appsCache;
			}
		});
	} catch (e) {
		logger.logToConsole({
			message: "appsCache is Undefined!/ empty / Probably insallation issue / App disabled",
			info: e,
		}, "log");
		appsCache = "Error, getting Installed Apps";
	}
	return appsCache;
}
module.exports = {
	delay,
	getOOSURL,
	validateSwymPageData,
	validateShopifyStore,
	checkSwymVariables,
	getRetailerSettings,
	getAppSpecificRetailerSettings,
	runUIValidations,
	isEmpty,
	getPID
};