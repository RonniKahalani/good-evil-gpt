

const LOCAL_ITEM_API_KEY = "api-key";
const LOCAL_ITEM_MESSAGE_HISTORY = "message-history";

const DEFAULT_YOUR_API_KEY = "your-api-key"

let apiKey = DEFAULT_YOUR_API_KEY;

const messageInput = document.getElementById("message-input");
const messageLog = document.getElementById("message-log");

const btnChatBoth = document.getElementById("message-both-button");
const btnChatEvil = document.getElementById("message-evil-button");
const btnChatGood = document.getElementById("message-good-button");
const btnClearInput = document.getElementById("message-clear-input-button");
const btnClearHistory = document.getElementById("message-clear-history-button");
const btnCopyToClipboard = document.getElementById("message-log-copy-button");

btnChatBoth.addEventListener("click", chatBoth);
btnChatEvil.addEventListener("click", chatEvil);
btnChatGood.addEventListener("click", chatGood);
btnClearInput.addEventListener("click", () => clearInput());
btnClearHistory.addEventListener("click", () => clearMessageHistory());
btnCopyToClipboard.addEventListener("click", () => copyToClipboard(messageLog.innerHTML));

const messageGood = document.getElementById("message-good");
const messageEvil = document.getElementById("message-evil");
const moodEvil = document.getElementById("mood-evil");
const moodGood = document.getElementById("mood-good");

const gptModel = document.getElementById("gpt-model");
const gptMaxTokens = document.getElementById("gpt-max-tokens");
const gptTemperature = document.getElementById("gpt-temperature");
const gptTopP = document.getElementById("gpt-top-p");
const gptFrequencyPenalty = document.getElementById("gpt-frequency-penalty");
const gptPresencePenalty = document.getElementById("gpt-presence-penalty");


const spinner = "<div class=\"spinner-border\" role=\"status\"></div>";

const messageHistory = [];

messageInput.focus();

/**
 * Replaces newlines with HTML line breaks.
 * @param {*} text 
 * @returns the replaced text.
 */
function replaceNewlines(text) {
    return text.replaceAll("\n", "<br>");
}

/**
 * Sends a chat to both personalities (Goodness and Evilness).
 */
function chatBoth() {
    chatEvil();
    chatGood();
}

/**
 * Sends a chat to Evilness.
 */
function chatEvil() {
    chat(0);
}

/**
 * Sends a chat to Goodness.
 */
function chatGood() {
    chat(1);
}

/**
 * Clears the chat input field.
 */
function clearInput() {
    messageInput.value = "";
}

/**
 * Clears the chat history.
 */
function clearMessageHistory() {
    messageGood.innerHTML = "";
    messageEvil.innerHTML = "";
    messageHistory.length = 0;
    localStorage.setItem(LOCAL_ITEM_MESSAGE_HISTORY, JSON.stringify(messageHistory));
}

/**
 * Copies text to the clipboard.
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log("Copied to clipboard:", text);
        alert("Copied to clipboard.");
    }).catch((error) => {
        console.error("Error copying to clipboard:", error);
    });
}

/**
 * Adds a chat to the chat history.
 * @param {*} messageId 
 * @param {*} request 
 */
function addChatToHistory(messageId, request) {

    const currentBrowserLocale = navigator.language || navigator.userLanguage;
    const timestamp = Intl.DateTimeFormat(currentBrowserLocale, { dateStyle: 'short', timeStyle: 'short' }).format(request.time);
    const moodAsText = request.mood === 0 ? "evil" : "good";

    const htmlMessage =
   `<div class="bg-dark-transparent m-0 p-2">
        <div id="${messageId}-request" class="message-${request.role}">${replaceNewlines(request.content)}</div>
        <div id="${messageId}-response" class="message-assistant mood-${moodAsText}">${spinner}</div>
        <div class="row">
            <span class="message-time col-6">${timestamp}</span>
            <span id="${messageId}-response-waitsec" class="message-waitsec col-6 text-end"></span>
        </div>
    </div><hr class="hr-${moodAsText}">`;

    const target = request.mood ? messageGood : messageEvil;
    target.innerHTML = htmlMessage + target.innerHTML;
}

/**
 * Sends a chat in a certain mood.
 * @param {*} mood 
 */
function chat(mood) {

    const prompt = messageInput.value;
    if (prompt) {
        const messageId = 'id' + (new Date()).getTime();
        const request = { role: "user", content: prompt, time: new Date().getTime(), mood: mood, messageId: messageId };
        messageHistory.push(request);

        addChatToHistory(messageId, request);

        chatWithGPT(prompt, mood).then((response) => {

            const timestamp = new Date().getTime();
            const waitTimeSec = (timestamp - request.time) / 1000;
            messageHistory.push({ role: "assistant", content: response, time: timestamp, mood: mood, messageId: messageId, waitTimeSec: waitTimeSec });
            document.getElementById(messageId + "-response").innerHTML = replaceNewlines(response);
            document.getElementById(messageId + "-response-waitsec").innerHTML = "Took : " + parseFloat(waitTimeSec).toFixed(1) + " seconds.";

            speech(response, 4);

            const messagesAsStrings = JSON.stringify(messageHistory, null, 2);
            localStorage.setItem(LOCAL_ITEM_MESSAGE_HISTORY, messagesAsStrings);
            messageLog.innerHTML = messagesAsStrings;

        }).catch((error) => {
            console.error("Failed to get response from ChatGPT:", error);
        });

    }
}

/**
 * Sends a prompt to ChatGPT and returns the response.
 * @param {*} prompt 
 * @param {*} mood 
 * @returns 
 */
async function chatWithGPT(prompt, mood) {
    const url = "https://api.openai.com/v1/chat/completions";

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${atob(localStorage.getItem(LOCAL_ITEM_API_KEY))}`,
    };

    const messages = messageHistory.map((message) => { return { role: message.role, content: message.content } });

    messages.push({ role: "system", content: mood === 0 ? moodEvil.value : moodGood.value });
    messages.push({ role: "user", content: prompt });

    const data = {
        model: gptModel.value,
        messages: messages,
        max_tokens: parseInt(gptMaxTokens.value),
        temperature: parseFloat(gptTemperature.value),
        top_p: parseFloat(gptTopP.value),
        frequency_penalty: parseFloat(gptFrequencyPenalty.value),
        presence_penalty: parseFloat(gptPresencePenalty.value)
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`The response ChatGPT returned an error: ${response.status} - ${response.statusText}`);
        }

        const json = await response.json();
        const reply = json.choices[0].message.content;

        console.log("ChatGPT response:", reply);

        return reply;

    } catch (error) {
        console.error("Error communicating with ChatGPT:", error);
    }
}

/**
 * Checks if an API key is stored in local storage, and prompts the user to enter one if it is not.
 */
function handleApiKey() {
    apiKey = localStorage.getItem(LOCAL_ITEM_API_KEY);
    if (apiKey === null || apiKey === "" || apiKey === DEFAULT_YOUR_API_KEY) {
        apiKey = prompt("Please enter a valid ChatGPT API key.", "");
        if(apiKey === null || apiKey === "") {
            alert("You need to provide a valid ChatGPT API key to use this page.");
         } else {
            localStorage.setItem(LOCAL_ITEM_API_KEY, btoa(apiKey));
         }
    }
}

handleApiKey();