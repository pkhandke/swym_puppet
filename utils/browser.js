const configuration = require("../swym_config/puppet_config.js").getConfig();
const puppeteer = require("puppeteer");
const logger = require("./logger.js");

// Gets a browser instance {page, browser} and navigates the page to the default URL.

async function getRunningBrowserInstance(page_url) {
	const options = configuration.launchOptions;
	let browserInstance = null
	const url = page_url ? page_url : configuration.startURL;
	if (!url) {
		logger.logToConsole({
			message: "Invalid Navigation url",
			error: url,
		}, "error");
		return;
	}
	try {
		const browser = await puppeteer.launch(options);
		const pages = await browser.pages();
		if (pages.length > 0) {
			const page = pages[0];
			await page.goto(url);
			browserInstance = {
				browser: browser,
				page: page,
			};
			logger.logToConsole({
				message: "Started Browser - Navigated to default URL",
				info: url,
			}, "log");
		}
	} catch (e) {
		logger.logToConsole({
			message: "Exception happened While getting browser Instance",
			error: e,
		}, "error");
		await browser.close();
	}
	return browserInstance;
}

// Navigate the page to the provided url.
async function navigateTo(url, page) {
	let navigated = false;
	try {
		await page.goto(url, {
			waitUntil: 'networkidle0',
			timeout: configuration.timeoutms
		})
		logger.logToConsole({
			message: "Navigated to URL : > ",
			info: url,
		}, "log");
		navigated = true;
	} catch (e) {
		logger.logToConsole({
			message: "Error: Wasn't able to Navigate to URL",
			error: url,
		}, "error");
	}
	return navigated;
}
module.exports = {
	navigateTo,
	getRunningBrowserInstance
}