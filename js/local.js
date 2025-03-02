/**
 * Sets an item valuefrom the local storage.
 * @param {*} key
 * @returns 
 */
function setLocalItem(key, value) {
    return localStorage.setItem(key, value);
}

/**
 * Sets the json version string of an item value.
 * @param {*} key 
 * @param {*} value
 * @returns 
 */
function setLocalItemAsJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Returns an item from the local storage.
 * @param {*} key 
 * @returns 
 */
function getLocalItem(key) {
    return localStorage.getItem(key);
}

/**
 * Returns the json version of an item value.
 * @param {*} key 
 * @returns 
 */
function getLocalItemAsJson(key) {
    return JSON.parse(localStorage.getItem(key));
}
