let configuration = {
	launchOptions: {
		headless: false,
		defaultViewport: null,
		args: ['--incognito'],
	},
	fileConfig: {
		inputFilePath: "", // takes default swym_stores.csv
		outputFilePath: "",
		logOutputFilePath: "../logs/log.csv"
	},
	delay: 500,
	startURL: "https://google.com",
	selectors: "div#pg-store404 ,  .status-error.status-code-500 , .template-password, form#login_form",
	userEmail : "ranga.prakash@swymcorp.com",
	timeoutms : 30000,
	bispaButtonSelector : ".swym-button.swym-add-to-watchlist.swym-inject",
	bispaFormSelector : ".swym-remind-me.swym-product-view.swym-product-view-swiper"
}

function getConfig() {
	return configuration;
}
module.exports = {
	getConfig,
}