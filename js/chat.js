/**
 * This script handle the chat UI an
 */
document.addEventListener("DOMContentLoaded", () => {
    if (getLocalItem(LOCAL_ITEM_AUTO_VOICE) === null) {
        openAutoVoiceDialog();
    }
});

const DEFAULT_YOUR_API_KEY = "your-api-key";

const GPT_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const GPT_CHAT_ROLE_ASSISTANT = "assistant";
const GPT_CHAT_ROLE_SYSTEM = "system";
const GPT_CHAT_ROLE_USER = "user";

const LOCAL_ITEM_API_KEY = "api-key";
const LOCAL_ITEM_MESSAGE_LOG = "message-log";
const LOCAL_ITEM_VOICES = "voices";
const LOCAL_ITEM_AUTO_VOICE = "auto-voice";
const LOCAL_ITEM_MUTE_VOICES = "mute-voices";

let apiKey = DEFAULT_YOUR_API_KEY;

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

btnAskBoth.onclick = () => chatBoth();
btnAskEvil.onclick = () => chatEvil();
btnAskGood.onclick = () => chatGood();
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

const messageGood = qs("#message-good");
const messageEvil = qs("#message-evil");
const moodEvil = qs("#mood-evil");
const moodGood = qs("#mood-good");
const goodMessageCount = qs("#good-message-count");
const evilMessageCount = qs("#evil-message-count");

const goodTokens = qs("#good-tokens");
const evilTokens = qs("#evil-tokens");
const totalTokens = qs("#total-tokens");

const gptModel = qs("#gpt-model");
const gptMaxTokens = qs("#gpt-max-tokens");
const gptTemperature = qs("#gpt-temperature");
const gptTopP = qs("#gpt-top-p");
const gptFrequencyPenalty = qs("#gpt-frequency-penalty");
const gptPresencePenalty = qs("#gpt-presence-penalty");

const spinner = `<div class="spinner-border message-spinner" role="status"></div>`;

const Personality = {
    EVIL: "evil",
    GOOD: "good"
};

const shortDateTimeFormat = { dateStyle: 'short', timeStyle: 'short' };

let messageLog = [];
let systemVoices = [];
let goodVoiceIndex = -1;
let evilVoiceIndex = -1;
let isVoicesMuted = false;

function qs(key) {
    return document.querySelector(key);
}

/**
 * Mutes/unmutes all voices.
 */
function toggleVoiceMuting() {
    isVoicesMuted = !isVoicesMuted;
    updateMuteButton()
    setLocalItem(LOCAL_ITEM_MUTE_VOICES, isVoicesMuted);
}

/**
 * Udates the mute buttons color and text.
 */
function updateMuteButton() {
    if (isVoicesMuted) {
        btnMuteVoices.classList.remove("btn-success");
        btnMuteVoices.classList.add("btn-danger");
        btnMuteVoices.textContent = "Unmute";
    } else {
        btnMuteVoices.classList.remove("btn-danger");
        btnMuteVoices.classList.add("btn-success");
        btnMuteVoices.textContent = "Mute";
    }
}

/**
 * Cancels current voices.
 */
function cancelVoice() {
    cancelSpeaking();
}

function enableAutoVoices() {
    populateSystemVoices();
    chkAutoVoice.checked = true;
    closeAutoVoiceDialog();
    setLocalItem(LOCAL_ITEM_AUTO_VOICE, chkAutoVoice.checked);

    const mood = Personality.EVIL;
    const settings = getVoiceSettingsByMood(mood);

    if (!isVoicesMuted) {
        speak("hi, and welcome.", systemVoices[settings.voiceIndex], settings.volume, settings.rate, settings.pitch, getPersonalityName(mood));
    }
}

function ignoreAutoVoices() {
    populateSystemVoices();
    chkAutoVoice.checked = false;
    closeAutoVoiceDialog();
    setLocalItem(LOCAL_ITEM_AUTO_VOICE, chkAutoVoice.checked);
}

function openAutoVoiceDialog() {
    dialogAutoVoice.showModal();
}

function closeAutoVoiceDialog() {
    dialogAutoVoice.close();
}

/**
 * Gets the voice settings for a given mood.
 * @param {*} mood 
 * @returns 
 */
function getVoiceSettingsByMood(mood) {

    if (systemVoices.length === 0) {
        populateSystemVoices();
    }

    const isGood = (mood == Personality.GOOD);
    const voiceSelector = isGood ? selectGoodVoice : selectEvilVoice;

    let voiceName = "";
    if (voiceSelector.selectedIndex !== -1) {
        voiceName = voiceSelector.options[voiceSelector.selectedIndex].text;
    }

    const settings = {
        pitch: parseFloat(isGood ? inputGoodVoicePitch.value : inputEvilVoicePitch.value),
        rate: parseFloat(isGood ? inputGoodVoiceRate.value : inputEvilVoiceRate.value),
        volume: parseFloat(isGood ? inputGoodVoiceVolume.value : inputEvilVoiceVolume.value),
        text: isGood ? moodGood.value : moodEvil.value,
        voiceIndex: parseInt(isGood ? selectGoodVoice.value : selectEvilVoice.value),
        voiceName: voiceName
    };

    return settings;
}

function getPersonalityName(mood) {
    return (mood === Personality.GOOD) ? "Goodness" : "Evilness"
}

/**
 * Tests a voice.
 * @param {*} mood 
 */
function testVoice(mood) {
    const voiceSettings = getVoiceSettingsByMood(mood);
    speak(voiceSettings.text, systemVoices[voiceSettings.voiceIndex], voiceSettings.volume, voiceSettings.rate, voiceSettings.pitch, getPersonalityName(mood));
}

/**
 * Opens the voice settings dialog.
 */
function openVoiceSettingsDialog() {
    populateSystemVoices();
    dialogVoiceSettings.showModal();
}

/**
 * Closes the voice settings dialog and saves the changes.
 */
function closeVoiceSettingsDialog() {

    const goodVoiceSettings = getVoiceSettingsByMood(Personality.GOOD);
    const evilVoiceSettings = getVoiceSettingsByMood(Personality.EVIL);
    goodVoiceIndex = goodVoiceSettings.voiceIndex;
    evilVoiceIndex = evilVoiceSettings.voiceIndex;

    const voiceSelection = {};
    voiceSelection.good = goodVoiceSettings;
    voiceSelection.evil = evilVoiceSettings;

    setLocalItemAsJson(LOCAL_ITEM_VOICES, voiceSelection);
    dialogVoiceSettings.close();
}

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
 * Clears the message log.
 */
function clearMessageLog() {

    txtMessageInput.focus();
    if (messageLog.length === 0) {
        alert("No chat history found.");
        return
    }

    if (!confirm("You are about to clear all the chat history.\nYou can copy the current history on the Messages pane.\n\nAre you sure you want to continue?")) {
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
}

/**
 * Copies a message to the clipboard.
 * @param {*} messageId 
 */
function copyMessageToClipboard(messageId) {
    const request = messageLog.filter(m => m.messageId === messageId && m.role === GPT_CHAT_ROLE_USER)[0];
    const response = messageLog.filter(m => m.messageId === messageId && m.role === GPT_CHAT_ROLE_ASSISTANT)[0];

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
function addToChatUI(request, response) {
    const htmlMessage = createMessageUI(request.messageId, request, response);
    const target = (request.mood === Personality.GOOD) ? messageGood : messageEvil;
    target.innerHTML = htmlMessage + target.innerHTML;
}

/**
 * Formats a date, using a given format.
 * @param {*} datetime 
 * @param {*} format 
 * @returns 
 */
function formatDateTime(datetime, format) {
    const currentBrowserLocale = navigator.language || navigator.userLanguage;
    return Intl.DateTimeFormat(currentBrowserLocale, format).format(datetime);
}

/**
 * Creates a HTML UI presentation of a message.
 * @param {*} messageId 
 * @param {*} request 
 * @param {*} response 
 * @returns 
 */
function createMessageUI(messageId, request, response) {
    const timestamp = formatDateTime(request.created, shortDateTimeFormat).replaceAll(",", "");

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
            <span class="col-4 text-center info-sm">Tokens: <span id="${messageId}-response-tokens">${response ? response.tokens : "..."}</span></span>
            <span class="col-4 text-end info-sm">Time: <span id="${messageId}-response-waitsec">${response ? response.waitTimeSec : "..."}</span></span>
        </div>
    </div>`;

    return htmlMessage;
}

/**
 * Updates token counts.
 */
function updateTokenCount() {
    const goodTokenTotals = messageLog.filter((log) => log.role === GPT_CHAT_ROLE_ASSISTANT && log.mood === Personality.GOOD).map((log) => log.tokens);
    const evilTokenTotals = messageLog.filter((log) => log.role === GPT_CHAT_ROLE_ASSISTANT && log.mood === Personality.EVIL).map((log) => log.tokens);

    const goodCount = goodTokenTotals.length > 0 ? goodTokenTotals.reduce((num, sum) => sum + num, 0) : 0;
    const evilCount = evilTokenTotals.length > 0 ? evilTokenTotals.reduce((num, sum) => sum + num, 0) : 0;

    goodTokens.textContent = goodCount;
    evilTokens.textContent = evilCount;
    totalTokens.textContent = goodCount + evilCount;
}

/**
 * Updates message counts.
 */
function updateMessageCount() {

    const goodCount = messageLog.filter((message) => message.mood === Personality.GOOD).length;
    const evilCount = messageLog.filter((message) => message.mood === Personality.EVIL).length;

    goodMessageCount.textContent = (goodCount > 0) ? goodCount / 2 : 0;
    evilMessageCount.textContent = (evilCount > 0) ? evilCount / 2 : 0;
}

/**
 * Updates the UI.
 */
function updateUI() {
    updateMessageCount();
    updateTokenCount();
    updateMuteVoicesChanged();
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
    const userName = "John Doe";
    const name = (role === GPT_CHAT_ROLE_ASSISTANT) ? (mood === Personality.GOOD) ? "Goodness" : "Evilness" : userName;
    return { name: name, role: role, content: content, created: new Date().getTime(), mood: mood, messageId: messageId };
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

        addToChatUI(request);

        chatWithGPT(request).then((gptResponse) => {

            const reply = gptResponse.choices[0].message.content;
            console.log("ChatGPT response:", reply);

            const timestamp = new Date().getTime();
            const waitTimeSec = (timestamp - request.created) / 1000;

            const response = createMessage(messageId, GPT_CHAT_ROLE_ASSISTANT, reply, request.mood);
            response.waitTimeSec = waitTimeSec;
            response.tokens = gptResponse.usage.total_tokens;
            response.gpt = gptResponse;

            messageLog.push(response);

            const id = "#" + messageId;
            document.querySelector(id + "-response").innerHTML = replaceNewlines(reply);
            document.querySelector(id + "-response-waitsec").textContent = parseFloat(response.waitTimeSec).toFixed(1);
            document.querySelector(id + "-response-tokens").textContent = parseInt(response.tokens);

            setLocalItemAsJson(LOCAL_ITEM_MESSAGE_LOG, messageLog);
            txtMessageLog.innerHTML = JSON.stringify(messageLog, null, 2);

            updateUI();

            if (!isVoicesMuted && chkAutoVoice.checked) {
                speakMessage(messageId);
            }

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
        "Authorization": `Bearer ${atob(getLocalItem(LOCAL_ITEM_API_KEY))}`,
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
    apiKey = getLocalItem(LOCAL_ITEM_API_KEY);
    if (apiKey === null || apiKey === "" || apiKey === DEFAULT_YOUR_API_KEY) {
        apiKey = prompt("Please enter a valid ChatGPT API key.\n\nThe API key will be enchrypted and saved in local browser storage.", "");
        if (apiKey === null || apiKey === "") {
            alert("You need to provide a valid ChatGPT API key to use this page.");
        } else {
            setLocalItem(LOCAL_ITEM_API_KEY, btoa(apiKey));
        }
    }
}

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

function updateConversations() {
    const requests = messageLog.filter((m) => m.role === GPT_CHAT_ROLE_USER);
    const responses = messageLog.filter((m) => m.role === GPT_CHAT_ROLE_ASSISTANT);

    for(i=0; i < requests.length; i++) {
        addToChatUI(requests[i], responses[i]);
    }
}
/**
 * Loads local storage data.
 */
function loadLocalStorage() {
    const localMessageLog = getLocalItem(LOCAL_ITEM_MESSAGE_LOG);
    messageLog = localMessageLog ? JSON.parse(localMessageLog) : [];
    txtMessageLog.innerHTML = JSON.stringify(messageLog, null, 2);

    const localVoices = getLocalItemAsJson(LOCAL_ITEM_VOICES);

    goodVoiceIndex = localVoices ? localVoices.good.voiceIndex : -1;
    selectGoodVoice.value = goodVoiceIndex;
    inputGoodVoicePitch.value = localVoices ? localVoices.good.pitch : 1;
    inputGoodVoiceRate.value = localVoices ? localVoices.good.rate : 1;
    inputGoodVoiceVolume.value = localVoices ? localVoices.good.volume : 1;

    evilVoiceIndex = localVoices ? localVoices.evil.voiceIndex : -1;
    selectEvilVoice.value = evilVoiceIndex;
    inputEvilVoicePitch.value = localVoices ? localVoices.evil.pitch : 1;
    inputEvilVoiceRate.value = localVoices ? localVoices.evil.rate : 1;
    inputEvilVoiceVolume.value = localVoices ? localVoices.evil.volume : 1;

    let value = getLocalItem(LOCAL_ITEM_AUTO_VOICE);
    if (value === null) {
        chkAutoVoice.checked = true;
    } else {
        chkAutoVoice.checked = JSON.parse(value);
    }

    value = getLocalItem(LOCAL_ITEM_MUTE_VOICES);
    if (value === null) {
        isVoicesMuted = false;
    } else {
        isVoicesMuted = JSON.parse(value);
    }

    updateConversations();
    updateUI();
}

function updateMuteVoicesChanged() {
    setLocalItem(LOCAL_ITEM_MUTE_VOICES, isVoicesMuted);
    updateMuteButton();
}

/**
 * Speaks out the message.
 * @param {*} messageId 
 * @returns 
 */
function speakMessage(messageId) {

    if (isVoicesMuted) {
        if (confirm("You have voices muted.\nDo you want to unmute?")) {
            isVoicesMuted = false;
            updateMuteVoicesChanged();
        } else {
            return;
        }
    }

    populateSystemVoices();

    const localVoices = getLocalItemAsJson(LOCAL_ITEM_VOICES);

    if (localVoices === null) {
        alert("Please configure the voices on the Profile tab.");
        return;
    }

    const response = messageLog.filter(m => m.messageId === messageId && m.role === GPT_CHAT_ROLE_ASSISTANT)[0];
    const voiceSettings = getVoiceSettingsByMood(response.mood);
    speak(response.content, systemVoices[voiceSettings.voiceIndex], voiceSettings.volume, voiceSettings.rate, voiceSettings.pitch, getPersonalityName(response.mood));
}

/**
 * Adds voice options to a voice select.
 * @param {*} select 
 */
function populateSelectVoices(select) {
    //select.add(new Option("Select voice", "-1", true));

    let index = 0;
    systemVoices.forEach(voice => {
        select.add(new Option(voice.name, index++, false));
    });
}

/**
 * Adds voice options to the voice selects.
 */
function populateSystemVoices() {

    systemVoices = speechSynthesis.getVoices();

    populateSelectVoices(selectGoodVoice);
    populateSelectVoices(selectEvilVoice);

    selectGoodVoice.value = goodVoiceIndex;
    selectEvilVoice.value = evilVoiceIndex;
}

// Code being run on page load.
txtMessageInput.focus();
handleApiKey();
loadLocalStorage();
populateSystemVoices();

const simulate = false;
if (simulate) {
    let messageId = "id" + new Date().getTime();

    let request = createMessage(messageId, GPT_CHAT_ROLE_USER, "Hi there, how are you?", Personality.GOOD);
    let response = createMessage(messageId, GPT_CHAT_ROLE_ASSISTANT, "Hi, I'm perfect, how about you?", Personality.GOOD, messageId);
    response.waitTimeSec = 1.2;
    response.tokens = 39;

    messageLog.push(request);
    messageLog.push(response);
    addToChatUI(request, response);
}
