const logger = require("./logger.js");
const configuration = require("../swym_config/puppet_config.js").getConfig();
const browserContext = require("./browser.js");
async function delay(time) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, time);
	})
}
// End of Helper Functions
// Start Swym Specific Functions 
async function getOOSURL(url, app) {
	//https://k5-optima-store.myshopify.com/apps/swymWatchlist/proxy/product.php?oos=true
	// TODO based on app name change the url and navigate before we go back.
	return url + "/apps/swymWatchlist/proxy/product.php?oos=true";
}
async function validateShopifyStore(page, selectors) {
	let elements = {};
	try {
		const elementText = await page.$eval(selectors, (elem) => {
			return elem.innerText;
		});
		logger.logToConsole({
			message: "Store Closed / Paused / Behind a Password!",
			info: elementText
		}, "log");
		elements = {
			comments: elementText,
			status: false
		};
	} catch (e) {
		logger.logToConsole({
			message: "Is a Valid Store >> ",
			info: page.url()
		}, "log");
		elements = {
			comments: "Open / Valid Store",
			status: true
		}
	}
	return elements;
}
async function validateSwymPageData(page) {
	let validSwymPageData = false;
	try {
		let swymPageDataObject = await getSwymPageDataInternal(page);
		validSwymPageData = (swymPageDataObject && swymPageDataObject.et == 1) ? true : false;
	} catch (e) {
		logger.logToConsole({
			message: "Error, validating swymPageData",
			error: e
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
			info: product
		}, "log");
	}
	return product;
};
async function checkIfSwymInstalled(page) {
	let _swatPresent = false;
	try {
		_swatPresent = await page.evaluate(() => {
			return (typeof window._swat == "undefined" ? false : true);
		});
		logger.logToConsole({
			message: "Is Swym Installed ? ",
			info: _swatPresent
		}, "log");
	} catch (e) {
		logger.logToConsole({
			message: "Error, while checking if swym was installed!",
			error: e
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
			console.log(prd);
			if (prd.inventory_management == "shopify") {
				result.push(prd);
			}
		});
	} catch (e) {
		logger.logToConsole({
			message: "Error While validating Inventory ",
			error: e
		}, "error");
	}
	return (result.length > 0 ? true : false);
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
			info: swymWatchProducts
		}, "log");
	}
	return swymWatchProducts;
}
async function checkSwymVariables(url, page) {
	let swymObj = {};
	try {
		let content = await waitTillHTMLRendered(page);
		await delay(1000)
		let is_swat = await checkIfSwymInstalled(page);
		swymObj.swatPresent = is_swat;
		if (is_swat) {
			let swymOOSURL = await getOOSURL(url, "Watchlist");
			console.log(browserContext);
			await browserContext.navigateTo(swymOOSURL, page);
			swymObj.OOS_URL = page.url();
			swymObj.validSwymPageData = await validateSwymPageData(page);
			await delay(1000);
			swymObj.isInventoryManagementValid = await validateSwymInventory(page);
			swymObj.retailerSettings = await getRetailerSettings(page, "Watchlist");
		}
	} catch (e) {
		logger.logToConsole({
			message: "Exception while checking swym variables",
			error: e
		}, "error");
	}
	return swymObj;
}
async function getRetailerSettings(page, app) {
	let appSettings = {};
	try {
		appSettings = await getSwymRetailerSettingsInternal(page, app);
	} catch (e) {
		appSettings = {};
		logger.logToConsole({
			message: "Error, trying to get retailerSettings",
			error: e
		}, "error");
	};
	return appSettings;
}
async function getSwymRetailerSettingsInternal(page, app) {
	let retailerSettings = {};
	await delay(1000);
	try {
		if (app == "Watchlist") {
			retailerSettings = await page.evaluate(() => {
				if (typeof window._swat.retailerSettings.Watchlist != "undefined") {
					return window._swat.retailerSettings.Watchlist;
				}
			});
		} else if (app == "Wishlist") {
			retailerSettings = await page.evaluate(() => {
				if (typeof window._swat.retailerSettings.Wishlist != "undefined") {
					return window._swat.retailerSettings.Wishlist;
				}
			});
		}
	} catch (e) {
		logger.logToConsole({
			message: "RetailerSettings is Undefined! / Probably swymSnippet is not running/ page not fully loaded",
			info: retailerSettings
		}, "log");
	}
	return retailerSettings;
}
// https://stackoverflow.com/questions/52497252/puppeteer-wait-until-page-is-completely-loaded
const waitTillHTMLRendered = async (page, timeout = 30000) => {
	const checkDurationMsecs = 2000;
	const maxChecks = timeout / checkDurationMsecs;
	let lastHTMLSize = 0;
	let checkCounts = 1;
	let countStableSizeIterations = 0;
	const minStableSizeIterations = 3;
	while (checkCounts++ <= maxChecks) {
		let html = await page.content();
		let currentHTMLSize = html.length;
		let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);
		console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);
		if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) countStableSizeIterations++;
		else countStableSizeIterations = 0; //reset the counter
		if (countStableSizeIterations >= minStableSizeIterations) {
			console.log("Page rendered fully..");
			break;
		}
		lastHTMLSize = currentHTMLSize;
		await delay(checkDurationMsecs);
	}
};

async function getAppSpecificRetailerSettings(retailerSettings, app) {
	let verified = {};
	try {
		if (app == "Watchlist") {
			verified.Enabled = retailerSettings.Enabled;
			verified.ToggleSwitchState = retailerSettings.ToggleSwitchState;
			verified.InlineForm = retailerSettings.InlineForm;
			verified.ShowIfOneOOS = retailerSettings.ShowIfOneOOS;
		}

		if(app == "Wishlist"){
			// todo
		}
	} catch (e) {
		logger.logToConsole({message:"Error, Validating retailer Settings for app", info: app}, "log");

	}
	return verified;
}

async function runUIValidations(page, watchListSettings ){
	try{
		
	}
	catch(e){

	}

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
}