let configuration = {
  launchOptions: {
    headless: true,
    defaultViewport: null,
    args: ["--incognito"],
  },
  fileConfig: {
    inputFilePath: "./shopify_stores.csv",
    outputFilePath: "./result.csv",
    logOutputFilePath: "../",
    outputFileHeaders: [
      {
        id: "store_url",
        title: "Store URL",
      },
      {
        id: "status",
        title: "Store Status",
      },
      {
        id: "comments",
        title: "Comments",
      },
      {
        id: "processed",
        title: "Processed Store",
      },
      {
        id: "isSwymInstalled",
        title: "Swym Installed",
      },
      {
        id: "OOS_URL",
        title: "Out of Stock URL",
      },
      {
        id: "isInventoryManagementValid",
        title: "Shopify Inventory",
      },
      {
        id: "validSwymPageData",
        title: "Is Valid SwymPageData",
      },
      {
        id: "validated_ui",
        title: "Validated Swym UI / Form",
      },
    ],
  },
  delay: 500,
  startURL: "https://google.com",
  invalidStoreSelector:
    "div#pg-store404 ,  .status-error.status-code-500 , .template-password, form#login_form",
  timeoutms: 30000,
  watchlistUISettings: {
    testSubscribe: false,
    userEmail: "example@gmail.com",
    bispaFormSelector:
      ".swym-remind-me.swym-product-view.swym-product-view-swiper",
    bispaFormSubmitButtonSelector: "button#swym-remind-email-auth-button",
    bispaInputSelector: "input#swym-remind-email-auth-input",
    bispaResponseSelector: "#swym-remind-email-auth-message span",
    bispaButtonSelector: "button.swym-button.swym-add-to-watchlist.swym-inject",
  },
};

function getConfig() {
  return configuration;
}
module.exports = {
  getConfig,
};
