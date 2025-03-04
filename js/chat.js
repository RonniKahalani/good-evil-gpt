/*
Copyright (c) 2025 Ronni Kahalani

X: https://x.com/RonniKahalani
Website: https://learningisliving.dk
LinkedIn: https://www.linkedin.com/in/kahalani/

Permission is hereby granted, free of charge, to any person obtaining a copy  
of this software and associated documentation files (the "Software"), to deal  
in the Software without restriction, including without limitation the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
copies of the Software, and to permit persons to whom the Software is  
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all  
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
SOFTWARE.
*/

/**
 * This script handles the chat UI and GPT communication.
 */

// We start when the DOM content is fully loaded.
document.addEventListener("DOMContentLoaded", () => initializeApp());

/**
 *  API key.
 */
const DEFAULT_API_KEY = "your-api-key";
let apiKey = DEFAULT_API_KEY;

/**
 * GPT request attributes.
 */
const GPT_URL = "https://api.openai.com/v1/chat/completions";
const GPT_ROLE_ASSISTANT = "assistant";
const GPT_ROLE_SYSTEM = "system";
const GPT_ROLE_USER = "user";

/**
 * Messages.
 */
const MSG_NO_MESSAGES_FOUND = "No messages found.";
const MSG_CLEAR_MESSAGES_CONFIRM = "You are about to clear all the chat history.\n\nAre you sure you want to continue?";
const MSG_ENTER_APIKEY = "Please enter a valid ChatGPT API key.\n\nThe API key will be enchrypted and saved in local browser storage.";
const MSG_PROVIDE_APIKEY = "You need to provide a valid ChatGPT API key to use this page.";
const MSG_UNMUTE_CONFIRM = "You have voices muted.\nDo you want to unmute?";
const MSG_CONFIGURE_VOICES = "Please configure the voices on the Profile tab.";
const MSG_INPUT_MESSAGE = "Please enter a message to send.";

const HTML_SPINNER = `<div class="spinner-border message-spinner" role="status"></div>`;

const ERR_GPT_REQUEST = "Failed to get response from ChatGPT:";
const ERR_GPT_COMMUNICATION = "Error communicating with ChatGPT:";

/**
 * Query selectors for HTML input and action elements.
 */
const dialogVoiceSettings = qs("#dialog-voice-settings");
const dialogAutoVoice = qs("#dialog-auto-voice");

const selectGoodVoice = qs("#select-good-voice");
const selectEvilVoice = qs("#select-evil-voice");

const inputGoodVoicePitch = qs("#input-good-voice-pitch");
const inputGoodVoiceRate = qs("#input-good-voice-rate");
const inputGoodVoiceVolume = qs("#input-good-voice-volume");
const inputEvilVoicePitch = qs("#input-evil-voice-pitch");
const inputEvilVoiceRate = qs("#input-evil-voice-rate");
const inputEvilVoiceVolume = qs("#input-evil-voice-volume");

const txtMessageInput = qs("#message-input");
const txtMessageLog = qs("#message-log");

const chkAutoVoice = qs("#chk-auto-voice");
const activityLog = qs("#activity-log");


const btnAskBoth = qs("#btn-ask-both");
const btnAskEvil = qs("#btn-ask-evil");
const btnAskGood = qs("#btn-ask-good");
const btnClearInput = qs("#btn-clear-input");
const btnClearHistory = qs("#btn-clear-history");
const btnCopyHistory = qs("#btn-copy-history");
const btnOpenVoiceSettings = qs("#btn-open-voice-settings");
const btnCloseVoiceSettings = qs("#btn-close-voice-settings");
const btnTestGoodVoice = qs("#btn-test-good-voice");
const btnTestEvilVoice = qs("#btn-test-evil-voice");
const btnCancelGoodVoice = qs("#btn-cancel-good-voice");
const btnCancelEvilVoice = qs("#btn-cancel-evil-voice");
const btnUseAutoVoice = qs("#btn-use-auto-voice");
const btnIgnoreAutoVoice = qs("#btn-ignore-auto-voice");
const btnMuteVoices = qs("#btn-mute-voices");

const messageGood = qs("#message-good");
const messageEvil = qs("#message-evil");
const moodEvil = qs("#mood-evil");
const moodGood = qs("#mood-good");
const goodMessageCount = qs("#good-message-count");
const evilMessageCount = qs("#evil-message-count");

const goodTokens = qs("#good-tokens");
const evilTokens = qs("#evil-tokens");
const totalTokens = qs("#total-tokens");

const selectGptModel = qs("#select-gpt-model");
const gptModel = qs("#gpt-model");
const gptMaxTokens = qs("#gpt-max-tokens");
const gptTemperature = qs("#gpt-temperature");
const gptTopP = qs("#gpt-top-p");
const gptFrequencyPenalty = qs("#gpt-frequency-penalty");
const gptPresencePenalty = qs("#gpt-presence-penalty");

const speakingNow = qs("#speaking-now");
const speakingNowName = qs("#speaking-now-name");

/**
 * Event handlers for HTML input and action elements.
 */
btnAskBoth.onclick = () => chatBoth();
btnAskEvil.onclick = () => chat(Personality.EVIL);
btnAskGood.onclick = () => chat(Personality.GOOD);
btnClearInput.onclick = () => clearInput();
btnClearHistory.onclick = () => clearMessageLog();
btnCopyHistory.onclick = () => copyTextToClipboard(txtMessageLog.innerHTML);
btnOpenVoiceSettings.onclick = () => openVoiceSettingsDialog();
btnCloseVoiceSettings.onclick = () => closeVoiceSettingsDialog();
btnTestGoodVoice.onclick = () => testVoice(Personality.GOOD);
btnTestEvilVoice.onclick = () => testVoice(Personality.EVIL);
btnCancelGoodVoice.onclick = () => cancelVoice();
btnCancelEvilVoice.onclick = () => cancelVoice();
btnUseAutoVoice.onclick = () => enableAutoVoices();
btnIgnoreAutoVoice.onclick = () => ignoreAutoVoices();
btnMuteVoices.onclick = () => toggleVoiceMuting();
chkAutoVoice.onclick = () => setLocalItem(LOCAL_ITEM_AUTO_VOICE, chkAutoVoice.checked);

const Personality = {
    EVIL: "evil",
    GOOD: "good"
};

const shortDateTimeFormat = { dateStyle: 'short', timeStyle: 'short' };

/*
    Primary configuration
 */
// Currently only used to pass a user name to ChatGPT.
const user = { name: "John Doe" };
// Interval updates time info om messages every 30 secs.
const updateTimeAgoInterval = 30000;
// List of current and pending speeches.
const speeches = [];
// List of all conversation messages.
let messageLog = [];
// List of all registered voices on the client system.
let systemVoices = [];
// Voice index for Goodness.
let goodVoiceIndex = -1;
// Voice index for Evilness.
let evilVoiceIndex = -1;
// Voice muted flag.
let isVoicesMuted = false;

/**
 * Returns the name for a given mood.
 * @param {*} mood 
 * @returns 
 */
function getPersonalityName(mood) {
    return (mood === Personality.GOOD) ? "Goodness" : "Evilness"
}

/**
 * Sends a chat to both personalities (Goodness and Evilness).
 */
function chatBoth() {

    if( txtMessageInput.value === "" ) {
        askForInput();
        return;
    }

    chat(Personality.EVIL);
    chat(Personality.GOOD);
}

/**
 * Clears the chat input field.
 */
function clearInput() {
    txtMessageInput.value = "";
    txtMessageInput.focus();
    logActivity("Message input cleared.");
}

/**
 * Clears the message log.
 */
function clearMessageLog() {

    txtMessageInput.focus();
    if (messageLog.length === 0) {
        alert(MSG_NO_MESSAGES_FOUND);
        return
    }

    if (!confirm(MSG_CLEAR_MESSAGES_CONFIRM)) {
        return;
    }

    messageLog.length = 0;

    messageLog.textContent = "";
    txtMessageLog.textContent = "";
    messageGood.textContent = "";
    messageEvil.textContent = "";
    totalTokens.textContent = 0;
    goodTokens.textContent = 0;
    evilTokens.textContent = 0;
    goodMessageCount.textContent = 0;
    evilMessageCount.textContent = 0;

    setLocalItemAsJson(LOCAL_ITEM_MESSAGE_LOG, messageLog);
    logActivity("Message log cleared.");
}

/**
 * Returns a message by id and role.
 * @param {*} messageId 
 * @param {*} role 
 * @returns 
 */
function getMessageByIdAndRole(messageId, role) {
    return messageLog.filter(m => m.messageId === messageId && m.role === role)[0];
}

/**
 * Returns all messages by role.
 * @param {*} role 
 * @returns 
 */
function getMessagesByRole(role) {
    return messageLog.filter(m => m.role === role);
}

/**
 * Returns the system prompt for the given mood.
 * @param {*} mood 
 * @returns 
 */
function getSystemPromptByMood(mood) {
    return (mood === Personality.EVIL) ? moodEvil.value : moodGood.value
}

/**
 * Copies a message to the clipboard.
 * @param {*} messageId 
 */
function copyMessageToClipboard(messageId) {
    const request = getMessageByIdAndRole(messageId, GPT_ROLE_USER);
    const response = getMessageByIdAndRole(messageId, GPT_ROLE_ASSISTANT);

    let txt = `Role: ${request.role}\nTime: ${formatDateTime(new Date(request.created), shortDateTimeFormat)}\nMessage: ${request.content}\nMood: ${request.mood}`;

    if (response) {
        txt += `\n\nRole: ${response.role}\nTime: ${formatDateTime(new Date(response.created), shortDateTimeFormat)}\nMessage: ${response.content}\nTokens: ${response.tokens}\nWaitTimeSec: ${response.waitTimeSec}\nMood: ${request.mood}`;
    }

    copyTextToClipboard(txt);
    logActivity("Message copied to clipboard.");
}

/**
 * Adds a message to the chat UI.
 * @param {*} messageId 
 * @param {*} request 
 */
function addToChatUI(request, response) {
    const target = (request.mood === Personality.GOOD) ? messageGood : messageEvil;
    target.innerHTML = createMessageUI(request.messageId, request, response) + target.innerHTML;
}

/**
 * Creates a HTML UI presentation of a message.
 * @param {*} messageId 
 * @param {*} request 
 * @param {*} response 
 * @returns 
 */
function createMessageUI(messageId, request, response) {

    const copyIcon = `<i class="bi bi-copy icon mx-1" title="Copy message to clipboard." onclick="copyMessageToClipboard('${messageId}');"></i>`;
    const speakIcon = `<i class="bi bi-play-circle-fill icon mx-1" title="Speak the message out loud." onclick="speakMessage('${messageId}');"></i>`;
    const floatingIcons = `<span style="float: right">${copyIcon}${speakIcon}</span>`;

    const createdInfo = `<span id="@{messageId}-created" class="message-time-ago col-4 info-sm" title="${formatDateTime(request.created, shortDateTimeFormat).replaceAll(",", "")
        }">${timeAgo(request.created)
        }</span>`;

    const tokenInfo = `<span class="col-4 text-center info-sm">Tokens: <span id="${messageId}-response-tokens">${response ? response.tokens : "..."}</span></span>`;
    const waitTimeInfo = `<span class="col-4 text-end info-sm">Seconds: <span id="${messageId}-response-waitsec">${response ? response.waitTimeSec.toFixed(2) : "..."}</span></span>`;

    return `<div class="message bg-dark-transparent">
        <div id="${messageId}-request" class="message-${request.role}">
            ${floatingIcons}
            ${replaceNewlines(request.content)}
        </div>
        <div id="${messageId}-response" class="message-assistant mood-${request.mood} p-2">
            ${response ? replaceNewlines(response.content) : HTML_SPINNER}
        </div>
        <div class="row">
            ${createdInfo}
            ${tokenInfo}
            ${waitTimeInfo}
        </div>
    </div>`;
}

/**
 * Finds the token totals for a given roel and mood.
 * @param {*} role 
 * @param {*} mood 
 * @returns 
 */
function getTokenTotalsFor(role, mood) {
    const tokenTotals = messageLog.filter((log) => log.role === role && log.mood === mood).map((log) => log.tokens);
    return tokenTotals.length > 0 ? tokenTotals.reduce((num, sum) => sum + num, 0) : 0;
}

/**
 * Updates token counts.
 */
function updateTokenCount() {
    const goodCount = getTokenTotalsFor(GPT_ROLE_ASSISTANT, Personality.GOOD);
    const evilCount = getTokenTotalsFor(GPT_ROLE_ASSISTANT, Personality.EVIL);

    goodTokens.textContent = goodCount;
    evilTokens.textContent = evilCount;
    totalTokens.textContent = goodCount + evilCount;
}

/**
 * Finds the message count for a given mood.
 * @param {*} mood 
 * @returns 
 */
function getMessageCountFor(mood) {
    return messageLog.filter((message) => message.mood === mood).length;
}

/**
 * Updates message counts.
 */
function updateMessageCount() {

    const goodCount = getMessageCountFor(Personality.GOOD);
    const evilCount = getMessageCountFor(Personality.EVIL);

    goodMessageCount.textContent = (goodCount > 0) ? goodCount / 2 : 0;
    evilMessageCount.textContent = (evilCount > 0) ? evilCount / 2 : 0;
}

/**
 * Updates the message log on he page.
 */
function updateMessageLog() {
    txtMessageLog.innerHTML = JSON.stringify(messageLog, null, 2);
}

/**
 * Updates the UI.
 */
function updateUI() {
    updateMessageCount();
    updateTokenCount();
    updateMuteVoicesChanged();
    updateMessageLog();
}

/**
 * Updates UI for a given response.
 * @param {*} response 
 */
function updateResponseUI(response) {
    const id = "#" + response.messageId;
    qs(`${id}-response`).innerHTML = replaceNewlines(response.content);
    qs(`${id}-response-waitsec`).textContent = parseFloat(response.waitTimeSec).toFixed(1);
    qs(`${id}-response-tokens`).textContent = parseInt(response.tokens);
}

/**
 * Updates the message UI conversations.
 */
function updateConversations() {
    getMessagesByRole(GPT_ROLE_USER).forEach((request) => addToChatUI(request, getMessageByIdAndRole(request.messageId, GPT_ROLE_ASSISTANT)));
}

/**
 * Updates all the timeago info on shown UI messages.
 */
function updateTimeAgo() {
    const messages = document.querySelectorAll(".message");
    messages.forEach((m) => {
        const elem = m.querySelector(".message-time-ago");

        const currentTime = timeAgo(new Date(elem.title));
        const elemTime = elem.textContent;

        if (elemTime !== currentTime) {
            elem.textContent = currentTime;
        }
    });
}

/**
 * Shows the disclamer dialog.
 */
function showDisclaimerDialog() {
    let disclaimerModal = new bootstrap.Modal(document.getElementById('disclaimerModal'));
    disclaimerModal.show();
    setLocalItem(LOCAL_ITEM_DISCLAIMER, true);
}

function toggleActivityLog() {
    activityLog.style.display = (activityLog.style.display === "none") ? "block" : "none";
}

/**
 * Creates a new chat message.
 * @param {*} messageId 
 * @param {*} role 
 * @param {*} content 
 * @param {*} mood 
 * @returns 
 */
function createMessage(messageId, role, content, mood) {
    const name = (role === GPT_ROLE_ASSISTANT) ? getPersonalityName(mood) : user.name;
    return { name: name, role: role, content: content, created: new Date().getTime(), mood: mood, messageId: messageId };
}

/**
 * Adds a message to the message log.
 * @param {*} entry 
 */
function addToMessageLog(entry) {
    messageLog.push(entry);
    setLocalItemAsJson(LOCAL_ITEM_MESSAGE_LOG, messageLog);
}

/**
 * Asks the user for message input.
 */
function askForInput() {
    alert(MSG_INPUT_MESSAGE);
    txtMessageInput.focus();
}

/**
 * Sends a chat in a certain mood.
 * @param {*} mood 
 */
function chat(mood) {

    const input = txtMessageInput.value;
    if (!input) {
        askForInput();
        return;
    }

    setLocalItemAsJson(LOCAL_ITEM_PROFILES, { evil: moodEvil.value, good: moodGood.value });

    const messageId = `id${(new Date()).getTime()}`;
    const request = createMessage(messageId, GPT_ROLE_USER, input, mood);

    addToMessageLog(request);
    addToChatUI(request);

    chatWithGPT(request).then((gptResponse) => {

        const response = handleGptResponse(request, gptResponse);
        addToMessageLog(response);
        updateResponseUI(response);
        updateUI();

        if (!isVoicesMuted && chkAutoVoice.checked) {
            speakMessage(response.messageId);
        }
    });

}

/**
 * Creates a GPT request, based on the given message request.
 * @param {*} request 
 * @returns 
 */
function createGptRequest(request) {

    const settings = {
        model: gptModel.value,
        max_tokens: parseInt(gptMaxTokens.value),
        temperature: parseFloat(gptTemperature.value),
        top_p: parseFloat(gptTopP.value),
        frequency_penalty: parseFloat(gptFrequencyPenalty.value),
        presence_penalty: parseFloat(gptPresencePenalty.value)
    };
    setLocalItemAsJson(LOCAL_ITEM_GPT_SETTINGS, settings);

    const messages = messageLog.map((m) => { return { role: m.role, content: m.content } });
    messages.push({ role: GPT_ROLE_SYSTEM, content: getSystemPromptByMood(request.mood) });
    messages.push({ role: GPT_ROLE_USER, content: request.content });

    settings.messages = messages;

    return {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${atob(getLocalItem(LOCAL_ITEM_API_KEY))}`
        },
        body: JSON.stringify(settings)
    }
}

/**
 * Sends a prompt to ChatGPT and returns the response.
 * @param {*} request
 * @returns 
 */
async function chatWithGPT(request) {

    try {
        logActivity(`Sending message (${request.messageId}) to ${getPersonalityName(request.mood)} via ${gptModel.value}.`);
        const response = await fetch(GPT_URL, createGptRequest(request));
        if (!response.ok) {
            throw new Error(`The response ChatGPT returned an error: ${response.status} - ${response.statusText}`);
        }

        logActivity(`Got a response (${request.messageId}) from ${getPersonalityName(request.mood)} via ${gptModel.value}.`);
        return await response.json();

    } catch (error) {
        const msg = `${ERR_GPT_REQUEST}\nWhen trying to send to ${getPersonalityName(request.mood)} via ${gptModel.value}`;
        console.error(msg, error);
        alert(msg);
        logActivity(msg);
    }
}

/**
 * Handles the response from ChatGPT.
 * @param {*} request 
 * @param {*} gptResponse 
 * @returns 
 */
function handleGptResponse(request, gptResponse) {

    // Get the content of the first reply from the response. Responses can have multiple replies/answer variants.
    let reply = gptResponse.choices[0].message.content;
    // Get the reason why the response was finished. (length=max tokens exceeded/truncated)
    const finishReason = gptResponse.choices[0].finish_reason;

    if (finishReason === "length") {
        reply += `...\n\nNote: Message is truncated because of the max. tokens ${gptMaxTokens.value} limit.\nYou can adjust this value on the Settings page.`;
    }
    const timestamp = new Date().getTime();
    const waitTimeSec = (timestamp - request.created) / 1000;

    const response = createMessage(request.messageId, GPT_ROLE_ASSISTANT, reply, request.mood);

    response.waitTimeSec = waitTimeSec;
    response.tokens = gptResponse.usage.total_tokens;
    response.gpt = gptResponse;

    return response;
}

/**
 * Checks if an API key is stored in local storage, and prompts the user to enter one if it is not.
 */
function handleApiKey() {

    apiKey = getLocalItem(LOCAL_ITEM_API_KEY);

    // Do we have an API key
    if (apiKey === null || apiKey === "" || apiKey === DEFAULT_API_KEY) {

        logActivity("No API key in local storage, asking user for a key.");
        // Ask the user for an API key.
        apiKey = prompt(MSG_ENTER_APIKEY, "");

        if (apiKey === null || apiKey === "") {
            logActivity("User did not give a valid API key.");
            alert(MSG_PROVIDE_APIKEY);
        } else {
            // Yes, we've got an API key. Now encode it and save it to local storage.
            setLocalItem(LOCAL_ITEM_API_KEY, btoa(apiKey));
            logActivity("API key saved to local storage.");
        }
    } else {
        logActivity("API key found in local storage.");
    }
}

function logActivity(message) {
    activityLog.innerHTML = `${new Date().toISOString().slice(0, 19).replace("T", " ")} ${message}<br>` + activityLog.innerHTML;
}

/**
 * Initializes the app.
 */
function initializeApp() {

    logActivity("Initializing app.");
    txtMessageInput.focus();
    
    logActivity("Validating API key.");
    handleApiKey();
    
    logActivity("Loading storage.");
    loadLocalStorage();
    updateConversations(); 
    updateUI();

    logActivity("Preparing voices.");
    populateSystemVoices();

    if (getLocalItem(LOCAL_ITEM_AUTO_VOICE) === null) {
        logActivity("Showing auto voice dialog.");
        openAutoVoiceDialog();
    }

    if (getLocalItem(LOCAL_ITEM_DISCLAIMER) === null) {
        logActivity("Showing disclaimer dialog.");
        showDisclaimerDialog();
    };

    setInterval(updateTimeAgo, updateTimeAgoInterval);

    logActivity("Ready to serve.");   
}