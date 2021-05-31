/* Start of Helper Functions */
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
async function getOOSURL(url, appName) {
	//https://k5-optima-store.myshopify.com/apps/swym+"appName"/proxy/product.php?oos=true
	let endPoint = "";
	if (appName && appName.toLowerCase() == "wishlist") {
		endPoint = url + "/apps/swymWishlist/proxy/product.php?oos=true"
	} else if (appName && appName.toLowerCase() == "watchlist") {
		endPoint = url + "/apps/swymWatchlist/proxy/product.php?oos=true";
	}
	return endPoint;
}
async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
// Simple fn to chec if an element exists.
async function elementExists(page, selector) {
	let result = false;
	try {
		result = await page.$(selector) !== null;
	} catch (e) {
		result = false;
		console.log("Error While searching for Element in DOM", e);
	}
	return result;
}
/* returns the visible handle and the element of the specified selector.
   improved code form https://stackoverflow.com/questions/49388467/getting-property-from-elementhandle
  I've added some error handling and try catch to make this not critical browser stopping issue
*/

async function getVisibleHandle(selector, page) {
    let hasError = false;
	try {
		const elements = await page.$$(selector);
		let hasVisibleElement = false,
			visibleElement = '';
		if (!elements.length) {
			return [hasVisibleElement, visibleElement];
		}
		let i = 0;
		for (let element of elements) {
			const isVisibleHandle = await page.evaluateHandle((e) => {
				const style = window.getComputedStyle(e);
				return (style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0');
			}, element);
			var visible = await isVisibleHandle.jsonValue();
			const box = await element.boxModel();
			if (visible && box) {
				hasVisibleElement = true;
				visibleElement = elements[i];
				break;
			}
			i++;
		}
        hasError = false;
		return [hasVisibleElement, visibleElement, hasError];
	} catch (e) {
		console.log("Exception while fetching visible handle", e);
		let hasVisibleElement = false,
			visibleElement = '';
            hasError = true;
		return [
			hasVisibleElement,
			visibleElement,
            hasError
        ];
	}
}
/* End of Helper Functions */

module.exports = {
	delay,
	isEmpty,
	getOOSURL,
	asyncForEach,
	elementExists,
	getVisibleHandle
}