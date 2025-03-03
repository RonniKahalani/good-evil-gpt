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
const updateTimeAgoInterval = 30000;
const speeches = [];
const user = { name: "Anonymous" };

let messageLog = [];
let systemVoices = [];
let goodVoiceIndex = -1;
let evilVoiceIndex = -1;
let isVoicesMuted = false;

/**
 * Copies geolocation data to a user object (if the user allows it).
 */
function copyGeoLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            user.latitude = position.coords.latitude;
            user.longitude = position.coords.longitude;
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}

/**
 * Mutes/unmutes all voices.
 */
function toggleVoiceMuting() {
    isVoicesMuted = !isVoicesMuted;
    speakingNow.style.display = "none";
    speakingNowName.textContent = "";
    updateMuteVoices();
}

/**
 * Udates the mute buttons color and text.
 */
function updateMuteVoices() {

    setLocalItem(LOCAL_ITEM_MUTE_VOICES, isVoicesMuted);
    if (isVoicesMuted) {
        btnMuteVoices.classList.remove("btn-success");
        btnMuteVoices.classList.add("btn-danger");
        btnMuteVoices.textContent = "Unmute voices";
        cancelVoice();
    } else {
        btnMuteVoices.classList.remove("btn-danger");
        btnMuteVoices.classList.add("btn-success");
        btnMuteVoices.textContent = "Mute voices";
    }
}

/**
 * Cancels current voices.
 */
function cancelVoice() {
    cancelSpeaking();
}

/**
 * Updates auto voices.
 */
function updateAutoVoices() {
    setLocalItem(LOCAL_ITEM_AUTO_VOICE, chkAutoVoice.checked);
}

/**
 * Enables auto voices.
 */
function enableAutoVoices() {
    chkAutoVoice.checked = true;
    updateAutoVoices();
    populateSystemVoices();
    closeAutoVoiceDialog();

    // This is left out for now, as it can be a bit annoying, also my default system language is a danish voice that it terrible at speaking english. It is total crap to listen to.
    // Would rather like to wait with voices until the user has experimentet with the voices and found a voice that is good for them.
    /*
    if (!isVoicesMuted) {
        const speech = speak("hi, and welcome.", getVoiceSettingsByMood(Personality.EVIL));
        speeches.push(speech);
        speech.onstart = (e) => updateVoiceStarted(e);
        speech.onend = (e) => updateVoiceEnded(e);
    }
    */
}

/**
 * Ignores auto voices.
 */
function ignoreAutoVoices() {
    populateSystemVoices();
    chkAutoVoice.checked = false;
    closeAutoVoiceDialog();
    setLocalItem(LOCAL_ITEM_AUTO_VOICE, chkAutoVoice.checked);
}

/**
 * Opens auto voice dialog.
 */
function openAutoVoiceDialog() {
    dialogAutoVoice.showModal();
}

/**
 * Closes suto voices.
 */
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
    let voiceName = (voiceSelector.selectedIndex !== -1) ? voiceSelector.options[voiceSelector.selectedIndex].text : "";

    const settings = {
        name: getPersonalityName(mood),
        mood: mood,
        pitch: parseFloat(isGood ? inputGoodVoicePitch.value : inputEvilVoicePitch.value),
        rate: parseFloat(isGood ? inputGoodVoiceRate.value : inputEvilVoiceRate.value),
        volume: parseFloat(isGood ? inputGoodVoiceVolume.value : inputEvilVoiceVolume.value),
        voiceIndex: parseInt(isGood ? selectGoodVoice.value : selectEvilVoice.value),
        voiceName: voiceName
    };

    return settings;
}

/**
 * Returns the name for a given mood.
 * @param {*} mood 
 * @returns 
 */
function getPersonalityName(mood) {
    return (mood === Personality.GOOD) ? "Goodness" : "Evilness"
}

/**
 * Cancels all current speeches.
 */
function cancelSpeaking() {
    showSpeakingNow(false);
    window.speechSynthesis.cancel();
}

/**
 * Tests a voice.
 * @param {*} mood 
 */
function testVoice(mood) {
    const text = (mood === Personality.GOOD) ? moodGood.value : moodEvil.value;
    const speech = speak(text, getVoiceSettingsByMood(mood));
    speeches.push(speech);
    speech.onstart = (e) => updateVoiceStarted(e);
    speech.onend = (e) => updateVoiceEnded(e);
}

/**
 * Shows or hides the speaking now message.
 * @param {*} show 
 */
function showSpeakingNow(show) {
    speakingNow.style.display = show ? "block" : "none";
}

/**
 * Updates who is currently speaking.
 * @param {*} e 
 */
function updateVoiceStarted(e) {
    speakingNow.classList.remove("mood-evil", "mood-good");
    speakingNow.classList.add((e.utterance.mood === Personality.EVIL) ? "mood-evil" : "mood-good");
    speakingNowName.textContent = e.utterance.name + " is speaking...";
    showSpeakingNow(true);
}

/**
 * Clears and removes an ended speech.
 * @param {*} e 
 */
function updateVoiceEnded(e) {
    showSpeakingNow(false);
    speakingNowName.textContent = "";
    removeFromArray(speeches, e.utterance);
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
    chat(Personality.EVIL);
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
 * Sends a chat in a certain mood.
 * @param {*} mood 
 */
function chat(mood) {

    const input = txtMessageInput.value;
    if (input) {

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

        }).catch((error) => {
            console.error(ERR_GPT_REQUEST, error);
        });
    }
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
 * Returns the system prompt for the given mood.
 * @param {*} mood 
 * @returns 
 */
function getSystemPromptByMood(mood) {
    return (mood === Personality.EVIL) ? moodEvil.value : moodGood.value
}

/**
 * Checks if an API key is stored in local storage, and prompts the user to enter one if it is not.
 */
function handleApiKey() {
    apiKey = getLocalItem(LOCAL_ITEM_API_KEY);
    if (apiKey === null || apiKey === "" || apiKey === DEFAULT_API_KEY) {
        apiKey = prompt(MSG_ENTER_APIKEY, "");
        if (apiKey === null || apiKey === "") {
            alert(MSG_PROVIDE_APIKEY);
        } else {
            setLocalItem(LOCAL_ITEM_API_KEY, btoa(apiKey));
        }
    }
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
        body: JSON.stringify(settings),
    }
}

/**
 * Sends a prompt to ChatGPT and returns the response.
 * @param {*} request
 * @returns 
 */
async function chatWithGPT(request) {

    try {
        const response = await fetch(GPT_URL, createGptRequest(request));
        if (!response.ok) {
            throw new Error(`The response ChatGPT returned an error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();

    } catch (error) {
        alert(ERR_GPT_COMMUNICATION + "\n" + error);
    }
}

/**
 * Updates the message UI conversations.
 */
function updateConversations() {
    getMessagesByRole(GPT_ROLE_USER).forEach((request) => addToChatUI(request, getMessageByIdAndRole(request.messageId, GPT_ROLE_ASSISTANT)));
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

    const settings = getLocalItemAsJson(LOCAL_ITEM_GPT_SETTINGS);
    if (settings !== null) {
        gptModel.value = settings.model;
        gptMaxTokens.value = settings.max_tokens;
        gptTemperature.value = settings.temperature;
        gptTopP.value = settings.top_p;
        gptFrequencyPenalty.value = settings.frequency_penalty;
        gptPresencePenalty.value = settings.presence_penalty;
    }

    const profiles = getLocalItemAsJson(LOCAL_ITEM_PROFILES);
    if (profiles !== null) {
        moodEvil.value = profiles.evil;
        moodGood.value = profiles.good;
    }

    updateConversations();
    updateUI();
}

/**
 * Updates the mute voices change.
 */
function updateMuteVoicesChanged() {
    setLocalItem(LOCAL_ITEM_MUTE_VOICES, isVoicesMuted);
    updateMuteVoices();
}

/**
 * Speaks a message via a message id.
 * @param {*} messageId 
 * @returns 
 */
function speakMessage(messageId) {

    if (isVoicesMuted) {
        if (confirm(MSG_UNMUTE_CONFIRM)) {
            isVoicesMuted = false;
            updateMuteVoicesChanged();
        } else {
            return;
        }
    }

    populateSystemVoices();

    const localVoices = getLocalItemAsJson(LOCAL_ITEM_VOICES);

    if (localVoices === null) {
        alert(MSG_CONFIGURE_VOICES);
        return;
    }

    const response = getMessageByIdAndRole(messageId, GPT_ROLE_ASSISTANT);
    const speech = speak(response.content, getVoiceSettingsByMood(response.mood));
    speeches.push(speech);
    speech.onstart = (e) => updateVoiceStarted(e);
    speech.onend = (e) => updateVoiceEnded(e);
}

/**
 * Adds voice options to a voice select.
 * @param {*} select 
 */
function populateSelectVoices(select) {
    let index = 0;
    select.options.length = 0;
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

function showDisclaimerDialog() {
    let disclaimerModal = new bootstrap.Modal(document.getElementById('disclaimerModal'));
    disclaimerModal.show();
    setLocalItem(LOCAL_ITEM_DISCLAIMER, true);
}

/**
 * Initializes the app.
 */
function initializeApp() {

    txtMessageInput.focus();
    handleApiKey();
    loadLocalStorage();
    populateSystemVoices();
    copyGeoLocation();

    if (getLocalItem(LOCAL_ITEM_AUTO_VOICE) === null) {
        openAutoVoiceDialog();
    }

    if (getLocalItem(LOCAL_ITEM_DISCLAIMER) === null) {
        showDisclaimerDialog();
    };

    setInterval(updateTimeAgo, updateTimeAgoInterval);
    // createFakeMessages();
}

/**
 * Create fake messages.
 */
function createFakeMessages() {
    let messageId = "idgood" + new Date().getTime();

    let request = createMessage(messageId, GPT_ROLE_USER, "Hi there, how are you?", Personality.GOOD);
    let response = createMessage(messageId, GPT_ROLE_ASSISTANT, "Hi, I'm perfect, how about you?", Personality.GOOD, messageId);
    response.waitTimeSec = 1.2;
    response.tokens = 39;

    messageLog.push(request);
    messageLog.push(response);
    addToChatUI(request, response);

    messageId = "idevil" + new Date().getTime();
    request = createMessage(messageId, GPT_ROLE_USER, "Hi there, how are you?", Personality.EVIL);
    response = createMessage(messageId, GPT_ROLE_ASSISTANT, "Hi, I'm perfect, how about you?", Personality.EVIL, messageId);
    response.waitTimeSec = 1.2;
    response.tokens = 39;

    messageLog.push(request);
    messageLog.push(response);
    addToChatUI(request, response);
}