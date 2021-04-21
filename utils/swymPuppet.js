const logger = require("./logger.js");
const configuration = require("../swym_config/puppet_config.js").getConfig();
const browserContext = require("./browser.js");
async function delay(time) {
  return new Promise(function (resolve, reject) {
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
async function getOOSURL(url, app) {
  //https://k5-optima-store.myshopify.com/apps/swymWatchlist/proxy/product.php?oos=true
  // TODO based on app name change the url and navigate before we go back.
  return url + "/apps/swymWatchlist/proxy/product.php?oos=true";
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
    logger.logToConsole(
      {
        message: "Store Closed / Paused / Behind a Password!",
        info: elementText,
      },
      "log"
    );
  } catch (e) {
    logger.logToConsole(
      {
        message: "Is a Valid Store >> ",
        info: page.url(),
      },
      "log"
    );
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
    validSwymPageData =
      swymPageDataObject && swymPageDataObject.et == 1 ? true : false;
  } catch (e) {
    logger.logToConsole(
      {
        message: "Error, validating swymPageData",
        error: e,
      },
      "error"
    );
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
    logger.logToConsole(
      {
        message: "SwymPage is Undefined! / Probably swymSnippet is not running",
        info: product,
      },
      "log"
    );
  }
  return product;
}
async function checkIfSwymInstalled(page) {
  let _swatPresent = false;
  try {
    _swatPresent = await page.evaluate(() => {
      return typeof window._swat == "undefined" ? false : true;
    });
    logger.logToConsole(
      {
        message: "Is Swym Installed ? ",
        info: _swatPresent,
      },
      "log"
    );
  } catch (e) {
    logger.logToConsole(
      {
        message: "Error, while checking if swym was installed!",
        error: e,
      },
      "error"
    );
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
    logger.logToConsole(
      {
        message: "Error While validating Inventory ",
        error: e,
      },
      "error"
    );
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
    logger.logToConsole(
      {
        message:
          "SwymWatchProducts is Undefined! / Probably swymSnippet is not running",
        info: swymWatchProducts,
      },
      "log"
    );
  }
  return swymWatchProducts;
}
async function checkSwymVariables(url, page) {
  let swymObj = {};
  try {
    let content = await waitTillHTMLRendered(page);
    await delay(1000);
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
    logger.logToConsole(
      {
        message: "Exception while checking swym variables",
        error: e,
      },
      "error"
    );
  }
  return swymObj;
}
async function getRetailerSettings(page, app) {
  let appSettings = {};
  try {
    appSettings = await getSwymRetailerSettingsInternal(page, app);
  } catch (e) {
    logger.logToConsole(
      {
        message: "Error, trying to get retailerSettings",
        error: e,
      },
      "error"
    );
  }
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
    logger.logToConsole(
      {
        message:
          "RetailerSettings is Undefined! / Probably swymSnippet is not running/ page not fully loaded",
        info: retailerSettings,
      },
      "log"
    );
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
      () => document.body.innerHTML.length
    );
    console.log(
      "last: ",
      lastHTMLSize,
      " <> curr: ",
      currentHTMLSize,
      " body html size: ",
      bodyHTMLSize
    );
    if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
      countStableSizeIterations++;
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
    if (app == "Wishlist") {
      // todo
    }
  } catch (e) {
    logger.logToConsole(
      {
        message: "Error, Validating retailer Settings for app",
        info: app,
      },
      "log"
    );
  }
  return verified;
}
/*Todo 
1. Check the retailerSettings for form setup (Button / form)
2. Check if the form or button is visible
3. if the flow is a button - Click the button and click the form
4. if the flow is a form - click on the input from and subscribe to pop-up, wait and check if the 
*/
async function runUIValidations(page, watchListSettings) {
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
      validBISPAUI = false;
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
  delay,
  getOOSURL,
  validateSwymPageData,
  validateShopifyStore,
  checkSwymVariables,
  getRetailerSettings,
  getAppSpecificRetailerSettings,
  runUIValidations,
  isEmpty,
};
