let configuration = {
  launchOptions: {
    headless: false,
    defaultViewport: null,
    args: ["--incognito"],
  },
  fileConfig: {
    inputFilePath: "./shopify_stores.csv",
    outputFilePath: "./result.csv",
    logOutputFilePath: "../",
    outputFileHeaders: [{
      id: "store_url",
      title: "Store URL",
    }, {
      id: "pid",
      title: "pid"
    }, {
      id: "installedApps",
      title: "Installed Apps"
    }, {
      id: "status",
      title: "Store Status",
    }, {
      id: "comments",
      title: "Comments",
    }, {
      id: "processed",
      title: "Processed Store",
    }, {
      id: "isSwymInstalled",
      title: "Swym Installed",
    }, {
      id: "OOS_URL",
      title: "Out of Stock URL",
    }, {
      id: "isInventoryManagementValid",
      title: "Shopify Inventory",
    }, {
      id: "validSwymPageData",
      title: "Is Valid SwymPageData",
    }, {
      id: "validated_ui",
      title: "Valid UI",
    }, {
      id: "migratable",
      title: "Is Migratable"
    }],
  },
  delay: 500,
  startURL: "https://google.com",
  invalidStoreSelector: "div#pg-store404 ,  .status-error.status-code-500 , .template-password, form#login_form",
  timeoutms: 30000,
  watchlistUISettings: {
    testSubscribe: false,
    userEmail: "example@gmail.com", /* Checks the flow if testSubscribe is enabled - and this is test email*/
    bispaFormSelector: ".swym-remind-me.swym-product-view.swym-product-view-swiper",
    bispaFormSubmitButtonSelector: "button#swym-remind-email-auth-button",
    bispaInputSelector: "input#swym-remind-email-auth-input",
    bispaResponseSelector: "#swym-remind-email-auth-message span",
    bispaButtonSelector: "button.swym-button.swym-add-to-watchlist.swym-inject",
  },
  wishlistUISettings: {
    defaultInjectedBtnSelector : ".swym-button-bar.swym-wishlist-button-bar.swym-inject .swym-add-to-wishlist",
    liquidInjectedBtnSelector : ".swym-add-to-wishlist[data-swaction='addToWishlist']",
    customWishlistBtnSelector : "",/*Checks if the API button is injected - This is purely for the webExtension*/
    /*The Below Config totally depends on if wishlist button is found on the page or not, if found the below extra checks can be performed*/
    checkWishlistBtnUiEvents : {
      enable : false,
      checkToggle: false,
      checkNotificationPopUp : false,
      checkBtnState : false,
    },
    checkWishlistNetworkIntegrity : {
      enable : false, 
      checkEt8NetworkCall: false, /*Checks if the event hit the right endpoint in the backend, event data, and the product validation too*/
      checkEventErrors :false /*Checks if any console errors related to swym had occured post triggering the event */
    }
  }
};

function getConfig() {
  return configuration;
}
module.exports = {
  getConfig,
};