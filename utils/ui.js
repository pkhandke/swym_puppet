const configuration = require("../swym_config/puppet_config.js").getConfig();
const logger = require("./logger.js");
const helper = require('./helpers.js')
async function runBispaUIValidations(page, watchListSettings, appName) {
	let isValidUI = false;
	let bispaFormSelector = configuration.watchlistUISettings.bispaFormSelector;
	try {
		if (watchListSettings.InlineForm) {
			let isFormVisible = await waitElementVisble(page, bispaFormSelector);
			if (isFormVisible) {
				isValidUI = await validateBISPAUI(page, "form");
			} else {
				logger.logToConsole({
					message: "Form wasn't visible",
					info: isFormVisible + +" :" + isValidUI,
				}, "log");
			}
		} else {
			// check for button if yes click the button and fill the form
			let buttonElement = await page.waitForSelector(configuration.watchlistUISettings.bispaButtonSelector, {
				visible: true,
			});
			isValidUI = buttonElement ? await validateBISPAUI(page, "button") : false;
		}
	} catch (e) {
		logger.logToConsole({
			message: "Error validating UI items",
			info: e,
		}, "log");
	}
	return isValidUI;
}
async function runWishlistUIValidations(page, wishlistRetailerSettings, appName) {
	let wishlistUIPuppetConfig = configuration.wishlistUISettings;
	console.log(wishlistRetailerSettings);
	console.log("---------------x--------------x----------------x--------------------x-----------x")
	let buttonSearchResults = await checkProductPageButtons(page, wishlistRetailerSettings, wishlistUIPuppetConfig);
	console.log(buttonSearchResults);
	if()
	/*
	TODO :
	1. Check if Default button is enabled (useCustomButton) 
	2. Check if default button is injected.
	3. Check if it has swym-disabled
	4. Check if default button is visible.
	5. Check if the button has an attachButton selector.
	6. Check the dom for the attach button selector.
	7. Check if the Button has no CSS properties that hide it (Display: none and opacity , visiblity....etc)
	8. Trigger an Wishlist event.
	9. Check for notifcations pop-up.
	10. Check if fetch has the added product in the wishlist.
	11. Navigate to the wishlist page.
	12. Check if the page has any elements that is not defaults (custom wishlist page / or CSS properties.)  
	*/
}

async function checkProductPageButtons(page) {
  let wishlistUIConfig = configuration.wishlistUISettings;
  let buttonSearchResults = {
    customBtn : {
      btn : null,
      btnVisible : false,
      hasError : false,
      btnFound : false,
    },
    defaultBtn : {
      btn : null,
      hasError : false,
      btnFound : false
    }
  }
      // Check if they have default button.
  let isDefaultBtn = await helper.elementExists(page, wishlistUIConfig.defaultInjectedBtnSelector);
  buttonSearchResults.defaultBtn.btnFound = isDefaultBtn;
  if (isDefaultBtn) {
      let visibleBtn = await helper.getVisibleHandle( wishlistUIConfig.defaultInjectedBtnSelector, page);
      buttonSearchResults.defaultBtn.btnVisible = await visibleBtn[0];
      buttonSearchResults.defaultBtn.btn = visibleBtn[1];
      buttonSearchResults.defaultBtn.hasError = visibleBtn[2];
      console.log("Is the Default Button found", visibleBtn[1], "is the default button visible ?" ,visibleBtn[0], "Was there any errors ? ",visibleBtn[2]);
    }
    // If we find custom button, we priortize it more than default.
      //  Check if they have liquid custom Button ?..
    let isCustomBtn = await helper.elementExists(page, wishlistUIConfig.liquidInjectedBtnSelector)
    buttonSearchResults.customBtn.btnFound = isCustomBtn;

    if (isCustomBtn) {
      let visibleCustomBtn = await helper.getVisibleHandle( wishlistUIConfig.liquidInjectedBtnSelector, page);
      buttonSearchResults.customBtn.btnVisible = visibleCustomBtn[0];
      buttonSearchResults.customBtn.btn = visibleCustomBtn[1];
      buttonSearchResults.customBtn.hasError = visibleCustomBtn[2];
      console.log("Is the Custom Button found? ", visibleCustomBtn[1], "is the Custom button visible ?" ,visibleCustomBtn[0], "Was there any errors ? ",visibleCustomBtn[2]);
    }
    return buttonSearchResults;
}

async function validateBISPAUI(page, type) {
	let validBISPAUI = false;
	let userEmail = configuration.watchlistUISettings.userEmail;
	let inputSelector = configuration.watchlistUISettings.bispaInputSelector;
	let formSelector = configuration.watchlistUISettings.bispaFormSelector;
	let buttonSelector = configuration.watchlistUISettings.bispaButtonSelector;
	let submitBtn = configuration.watchlistUISettings.bispaFormSubmitButtonSelector;
	let successSelector = configuration.watchlistUISettings.bispaResponseSelector;
	try {
		if (type == "button") {
			(await waitElementVisble(page, buttonSelector)) ? await page.click(buttonSelector): (validBISPAUI = false);
			await helper.delay(1500);
		}
		let formElement = await waitElementVisble(page, formSelector);
		if (formElement) {
			if (configuration.watchlistUISettings.testSubscribe) {
				await page.type(inputSelector, userEmail);
				await helper.delay(2000);
				await page.click(submitBtn);
				validBISPAUI = await waitElementVisble(page, successSelector);
			} else {
				validBISPAUI = formElement ? true : false;
			}
		} else {
			logger.logToConsole({
				message: "Form never showed up ",
				info: formElement
			}, "log");
		}
	} catch (e) {
		logger.logToConsole({
			message: "exception while filling form",
			error: e,
		}, "error");
	}
	return validBISPAUI;
}
async function waitElementVisble(page, selector) {
	let isVisible = false;
	try {
		let element = await page.waitForSelector(selector, {
			visible: true,
			timeout: 90000,
		});
		element ? (isVisible = true) : (isVisible = false);
	} catch (e) {
		logger.logToConsole({
			message: "element was not visible",
			info: selector
		}, "log");
	}
	return isVisible;
}
module.exports = {
	runWishlistUIValidations,
	runBispaUIValidations
};