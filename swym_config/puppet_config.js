let configuration = {
	launchOptions: {
		headless: true,
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
	timeoutms : 30000
}

function getConfig() {
	return configuration;
}
module.exports = {
	getConfig,
}