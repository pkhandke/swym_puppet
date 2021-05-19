const configuration = require("../swym_config/puppet_config.js").getConfig();

async function runBispaUIValidations(page, watchListSettings, appName){
    let isValidUI = false;
    let bispaFormSelector = configuration.watchlistUISettings.bispaFormSelector;
    try {
      if (watchListSettings.InlineForm) {
        let isFormVisible = await waitElementVisble(page, bispaFormSelector);
        if (isFormVisible) {
          isValidUI = await validateBISPAUI(page, "form");
        } else {
          logger.logToConsole(
            {
              message: "Form wasn't visible",
              info: isFormVisible + +" :" + isValidUI,
            },
            "log"
          );
        }
      } else {
        // check for button if yes click the button and fill the form
        let buttonElement = await page.waitForSelector(
          configuration.watchlistUISettings.bispaButtonSelector,
          {
            visible: true,
          }
        );
        isValidUI = buttonElement ? await validateBISPAUI(page, "button") : false;
      }
    } catch (e) {
      logger.logToConsole(
        {
          message: "Error validating UI items",
          info: e,
        },
        "log"
      );
    }
    return isValidUI;
}



async function runWishlistUIValidations(page, wishlistRetailerSettings, appName){


}

async function validateBISPAUI(page, type) {
    let validBISPAUI = false;
    let userEmail = configuration.watchlistUISettings.userEmail;
    let inputSelector = configuration.watchlistUISettings.bispaInputSelector;
    let formSelector = configuration.watchlistUISettings.bispaFormSelector;
    let buttonSelector = configuration.watchlistUISettings.bispaButtonSelector;
    let submitBtn =
      configuration.watchlistUISettings.bispaFormSubmitButtonSelector;
    let successSelector = configuration.watchlistUISettings.bispaResponseSelector;
    try {
      if (type == "button") {
        (await waitElementVisble(page, buttonSelector))
          ? await page.click(buttonSelector)
          : (validBISPAUI = false);
        await delay(1500);
      }
      let formElement = await waitElementVisble(page, formSelector);
      if (formElement) {
        if (configuration.watchlistUISettings.testSubscribe) {
          await page.type(inputSelector, userEmail);
          await delay(2000);
          await page.click(submitBtn);
          validBISPAUI = await waitElementVisble(page, successSelector);
        } else {
          validBISPAUI = formElement ? true : false;
        }
      } else {
        logger.logToConsole(
          { message: "Form never showed up ", info: formElement },
          "log"
        );
      }
    } catch (e) {
      logger.logToConsole(
        {
          message: "exception while filling form",
          error: e,
        },
        "error"
      );
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
      logger.logToConsole(
        { message: "element was not visible", info: selector },
        "log"
      );
    }
    return isVisible;
  }

module.exports = {
    runWishlistUIValidations,
    runBispaUIValidations
};