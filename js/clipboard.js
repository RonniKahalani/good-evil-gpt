/**
 * Copies text to the clipboard.
 */
function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log("Copied to clipboard:", text);
        alert("Copied to clipboard.");
    }).catch((error) => {
        console.error("Error copying to clipboard:", error);
    });
}