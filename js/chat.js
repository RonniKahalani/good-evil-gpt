const DEFAULT_YOUR_API_KEY = "your-api-key";

const GPT_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const GPT_CHAT_ROLE_ASSISTANT = "assistant";
const GPT_CHAT_ROLE_SYSTEM = "system";
const GPT_CHAT_ROLE_USER = "user";

const LOCAL_ITEM_API_KEY = "api-key";
const LOCAL_ITEM_MESSAGE_LOG = "message-history";
const LOCAL_ITEM_GPT_LOG = "gpt-log";
const LOCAL_ITEM_VOICES = "voices";

let apiKey = DEFAULT_YOUR_API_KEY;

const dialogVoiceSettings = document.querySelector("#dialog-voice-settings");
const btnOpenVoiceSettings = document.querySelector("#btn-open-voice-settings");
const btnCloseVoiceSettings = document.querySelector("#btn-close-voice-settings");

btnOpenVoiceSettings.addEventListener("click", () => {
    loadVoices();
    dialogVoiceSettings.showModal();
});

btnCloseVoiceSettings.addEventListener("click", () => {

    const voiceSelection = {
        evil: selectEvilVoice.selectedIndex - 2,
        good: selectGoodVoice.selectedIndex - 2
    };

    localStorage.setItem(LOCAL_ITEM_VOICES, JSON.stringify(voiceSelection));
    dialogVoiceSettings.close();
});

const selectGoodVoice = document.querySelector("#select-good-voice");
const selectEvilVoice = document.querySelector("#select-evil-voice");

const txtMessageInput = document.querySelector("#message-input");
const txtMessageLog = document.querySelector("#message-log");

const btnAskBoth = document.querySelector("#btn-ask-both");
const btnAskEvil = document.querySelector("#btn-ask-evil");
const btnAskGood = document.querySelector("#btn-ask-good");
const btnClearInput = document.querySelector("#btn-clear-input");
const btnClearHistory = document.querySelector("#btn-clear-history");
const btnCopyHistory = document.querySelector("#btn-copy-history");

btnAskBoth.addEventListener("click", chatBoth);
btnAskEvil.addEventListener("click", chatEvil);
btnAskGood.addEventListener("click", chatGood);
btnClearInput.addEventListener("click", () => clearInput());
btnClearHistory.addEventListener("click", () => clearMessageHistory());
btnCopyHistory.addEventListener("click", () => copyTextToClipboard(txtMessageLog.innerHTML));

const messageGood = document.querySelector("#message-good");
const messageEvil = document.querySelector("#message-evil");
const moodEvil = document.querySelector("#mood-evil");
const moodGood = document.querySelector("#mood-good");
const goodMessageCount = document.querySelector("#good-message-count");
const evilMessageCount = document.querySelector("#evil-message-count");

const goodTokens = document.querySelector("#good-tokens");
const evilTokens = document.querySelector("#evil-tokens");
const totalTokens = document.querySelector("#total-tokens");

const gptModel = document.querySelector("#gpt-model");
const gptMaxTokens = document.querySelector("#gpt-max-tokens");
const gptTemperature = document.querySelector("#gpt-temperature");
const gptTopP = document.querySelector("#gpt-top-p");
const gptFrequencyPenalty = document.querySelector("#gpt-frequency-penalty");
const gptPresencePenalty = document.querySelector("#gpt-presence-penalty");


const spinner = `<div class="spinner-border message-spinner" role="status"></div>`;

const Personality = {
    EVIL: "evil",
    GOOD: "good"
};

let messageLog = [];
let gptLog = [];
let voices = [];

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
    chat(Personality.EVIL);
}

/**
 * Sends a chat to Goodness.
 */
function chatGood() {
    chat(Personality.GOOD);
}

/**
 * Clears the chat input field.
 */
function clearInput() {
    txtMessageInput.value = "";
    txtMessageInput.focus();
}

/**
 * Clears the chat history.
 */
function clearMessageHistory() {

    txtMessageInput.focus();
    if (messageLog.length === 0) {
        alert("No chat history found.");
        return
    }

    if (!confirm("You are about to clear all the chat history.\nYou can copy the current history on the Messages pane.\n\nAre you sure you want to continue?")) {
        return;
    }

    messageLog.length = 0;
    gptLog.length = 0;

    messageLog.innerHTML = "";
    messageGood.innerHTML = "";
    messageEvil.innerHTML = "";
    totalTokens.innerHTML = 0;
    goodTokens.innerHTML = 0;
    evilTokens.innerHTML = 0;
    goodMessageCount.innerHTML = 0;
    evilMessageCount.innerHTML = 0;

    localStorage.setItem(LOCAL_ITEM_MESSAGE_LOG, JSON.stringify(messageLog));
    localStorage.setItem(LOCAL_ITEM_GPT_LOG, JSON.stringify(gptLog));
}

function copyMessageToClipboard(messageId) {
    const request = messageLog.filter(m => m.messageId === messageId && m.role === GPT_CHAT_ROLE_USER)[0];
    const response = messageLog.filter(m => m.messageId === messageId && m.role === GPT_CHAT_ROLE_ASSISTANT)[0];
    const shortDateTimeFormat = { dateStyle: 'short', timeStyle: 'short' };

    let txt = `Role: ${request.role}\nTime: ${formatDateTime(new Date(request.created), shortDateTimeFormat)}\nMessage: ${request.content}\nMood: ${request.mood}`;

    if (response) {
        txt += `\n\nRole: ${response.role}\nTime: ${formatDateTime(new Date(response.created), shortDateTimeFormat)}\nMessage: ${response.content}\nTokens: ${response.tokens}\nWaitTimeSec: ${response.waitTimeSec}\nMood: ${request.mood}`;
    }

    copyTextToClipboard(txt);
}

/**
 * Adds a message to the chat UI.
 * @param {*} messageId 
 * @param {*} request 
 */
function addToChatUI(messageId, request, response) {
    const htmlMessage = createMessageUI(messageId, request, response);
    const target = (request.mood === Personality.GOOD) ? messageGood : messageEvil;
    target.innerHTML = htmlMessage + target.innerHTML;
}

function formatDateTime(datetime, format) {
    const currentBrowserLocale = navigator.language || navigator.userLanguage;
    return Intl.DateTimeFormat(currentBrowserLocale, format).format(datetime);
}

function createMessageUI(messageId, request, response) {
    const timestamp = formatDateTime(request.created);

    const htmlMessage =
        `<div class="message bg-dark-transparent">
        <div id="${messageId}-request" class="message-${request.role}">
        <span style="float: right">
        <i class="bi bi-copy icon mx-1" title="Copy message to clipboard." onclick="copyMessageToClipboard('${messageId}');"></i>
        <i title="Speak the message out loud." onclick="speakMessage('${messageId}');" class="bi bi-play-circle-fill icon mx-1"></i>
        </span>${replaceNewlines(request.content)}
        </div>
        <div id="${messageId}-response" class="message-assistant mood-${request.mood}">
        ${response ? replaceNewlines(response.content) : spinner}
        </div>
        <div class="row">
            <span class="col-4 info-sm">${timestamp}</span>
            <span id="${messageId}-response-tokens" class="col-4 text-center info-sm">Tokens: ${response ? response.tokens : ""}</span>
            <span id="${messageId}-response-waitsec" class="col-4 text-end info-sm">Time: ${response ? response.waitTimeSec : ""}</span>
        </div>
    </div>`;

    return htmlMessage;
}

function updateTokenCount() {
    const goodTokenTotals = gptLog.filter((log) => log.mood === Personality.GOOD).map((log) => log.response.usage.total_tokens);
    const evilTokenTotals = gptLog.filter((log) => log.mood === Personality.EVIL).map((log) => log.response.usage.total_tokens);

    const goodCount = goodTokenTotals.length > 0 ? goodTokenTotals.reduce((num, sum) => sum + num, 0) : 0;
    const evilCount = evilTokenTotals.length > 0 ? evilTokenTotals.reduce((num, sum) => sum + num, 0) : 0;

    goodTokens.innerHTML = goodCount;
    evilTokens.innerHTML = evilCount;
    totalTokens.innerHTML = goodCount + evilCount;
}

function updateMessageCount() {

    const goodCount = messageLog.filter((message) => message.mood === Personality.GOOD).length;
    const evilCount = messageLog.filter((message) => message.mood === Personality.EVIL).length;

    goodMessageCount.innerHTML = (goodCount > 0) ? goodCount / 2 : 0;
    evilMessageCount.innerHTML = (evilCount > 0) ? evilCount / 2 : 0;
}

function updateUI() {
    updateMessageCount();
    updateTokenCount();
}

function createMessage(messageId, role, content, mood) {
    return { role: role, content: content, created: new Date().getTime(), mood: mood, messageId: messageId };
}

/**
 * Sends a chat in a certain mood.
 * @param {*} mood 
 */
function chat(mood) {

    const input = txtMessageInput.value;
    if (input) {
        const messageId = 'id' + (new Date()).getTime();
        const request = createMessage(messageId, GPT_CHAT_ROLE_USER, input, mood);
        messageLog.push(request);

        addToChatUI(messageId, request);

        chatWithGPT(request).then((response) => {

            const reply = response.choices[0].message.content;
            console.log("ChatGPT response:", reply);

            const timestamp = new Date().getTime();
            const waitTimeSec = (timestamp - request.created) / 1000;

            const message = createMessage(messageId, GPT_CHAT_ROLE_ASSISTANT, reply, request.mood);
            message.waitTimeSec = waitTimeSec;
            message.tokens = response.usage.total_tokens;
            messageLog.push(message);

            gptLog.push({ response: response, message: message, mood: request.mood });
            localStorage.setItem(LOCAL_ITEM_GPT_LOG, JSON.stringify(gptLog));

            document.querySelector("#" + messageId + "-response").innerHTML = replaceNewlines(reply);
            document.querySelector("#" + messageId + "-response-waitsec").innerHTML = parseFloat(message.waitTimeSec).toFixed(1);
            document.querySelector("#" + messageId + "-response-tokens").innerHTML = parseInt(message.tokens);

            const messagesAsStrings = JSON.stringify(messageLog, null, 2);
            localStorage.setItem(LOCAL_ITEM_MESSAGE_LOG, messagesAsStrings);
            txtMessageLog.innerHTML = messagesAsStrings;

            updateUI();

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
async function chatWithGPT(request) {

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${atob(localStorage.getItem(LOCAL_ITEM_API_KEY))}`,
    };

    const messages = messageLog.map((message) => { return { role: message.role, content: message.content } });

    messages.push({ role: GPT_CHAT_ROLE_SYSTEM, content: (request.mood === Personality.EVIL) ? moodEvil.value : moodGood.value });
    messages.push({ role: GPT_CHAT_ROLE_USER, content: request.content });

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
        const response = await fetch(GPT_CHAT_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`The response ChatGPT returned an error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();

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
        if (apiKey === null || apiKey === "") {
            alert("You need to provide a valid ChatGPT API key to use this page.");
        } else {
            localStorage.setItem(LOCAL_ITEM_API_KEY, btoa(apiKey));
        }
    }
}

function loadLocalStorage() {
    const localMessageLog = localStorage.getItem(LOCAL_ITEM_MESSAGE_LOG);
    messageLog = localMessageLog ? JSON.parse(localMessageLog) : [];

    const localGptLog = localStorage.getItem(LOCAL_ITEM_GPT_LOG);
    gptLog = localGptLog ? JSON.parse(localGptLog) : [];

}

function speakMessage(messageId) {

    const strLocalVoices = localStorage.getItem(LOCAL_ITEM_VOICES);
    const localVoices = JSON.parse(strLocalVoices);

    if (localVoices === null) {
        alert("Please configure the voices on the Profile tab.");
        return;
    }

    if (!voices || voices.length === 0) {
        loadVoices();
    }

    selectGoodVoice.selectedIndex = localVoices.good + 2;
    selectEvilVoice.selectedIndex = localVoices.evil + 2;

    const response = messageLog.filter(m => m.messageId === messageId && m.role === "assistant")[0];
    const content = response.content;

    const voiceIndex = (response.mood === Personality.GOOD) ? localVoices.good : localVoices.evil;
    speak(content, voices[voiceIndex]);
}

function loadVoices() {

    voices = speechSynthesis.getVoices();

    let index = 0

    selectGoodVoice.add(new Option("Select voice", "-1", true))
    selectEvilVoice.add(new Option("Select voice", "-1", true))


    voices.forEach(voice => {
        selectGoodVoice.add(new Option(voice.name, index, false));
        selectEvilVoice.add(new Option(voice.name, index++, false));
    });

}

// Code being run on page load.
txtMessageInput.focus();
handleApiKey();
loadLocalStorage();
loadVoices();

const simulate = true;
if(simulate) {
    let messageId = "id" + new Date().getTime();

    let request = createMessage(messageId, GPT_CHAT_ROLE_USER, "Hi there, how are you?", Personality.GOOD);
    let response = createMessage(messageId, GPT_CHAT_ROLE_ASSISTANT, "Hi, I'm perfect, how about you?", Personality.GOOD, messageId);
    response.waitTimeSec = 1.2;
    response.tokens = 39;

    messageLog.push(request);
    messageLog.push(response);
    addToChatUI(messageId, request, response);

}
