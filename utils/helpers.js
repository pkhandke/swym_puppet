/* Start of Helper Functions */
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

/* End of Helper Function */
module.exports = {
    delay,
    isEmpty,
    getOOSURL,
    asyncForEach,
}