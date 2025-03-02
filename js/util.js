
/**
 * Removes an entry from an array.
 * @param {*} array 
 * @param  {...any} deleteElement 
 * @returns 
 */
const removeFromArray = function (array, ...deleteElement) {
    for (let element of deleteElement) {
        if (array.includes(element)) {
            array.splice(array.indexOf(element), 1);
        }
    }
    return array;
};

/**
 * Converts a date to a 'time ago' text.
 * Example: 23 seconds ago.
 * @param {*} date 
 * @returns 
 */
function timeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
        }
    }

    return "just now";
}

/**
 * Works as a short version of document.querySelector(...).
 * @param {*} key 
 * @returns 
 */
function qs(key) {
    return document.querySelector(key);
}
