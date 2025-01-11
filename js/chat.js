const DEFAULT_YOUR_API_KEY = "your-api-key";

const GPT_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const GPT_CHAT_ROLE_ASSISTANT = "assistant";
const GPT_CHAT_ROLE_SYSTEM = "system";
const GPT_CHAT_ROLE_USER = "user";

const LOCAL_ITEM_API_KEY = "api-key";
const LOCAL_ITEM_MESSAGE_LOG = "message-log";
const LOCAL_ITEM_GPT_LOG = "gpt-log";
const LOCAL_ITEM_VOICES = "voices";
const LOCAL_ITEM_AUTO_VOICE = "auto-voice";
let apiKey = DEFAULT_YOUR_API_KEY;

const dialogVoiceSettings = document.querySelector("#dialog-voice-settings");

const selectGoodVoice = document.querySelector("#select-good-voice");
const selectEvilVoice = document.querySelector("#select-evil-voice");

const inputGoodVoicePitch = document.querySelector("#input-good-voice-pitch");
const inputGoodVoiceRate = document.querySelector("#input-good-voice-rate");
const inputGoodVoiceVolume = document.querySelector("#input-good-voice-volume");

const inputEvilVoicePitch = document.querySelector("#input-evil-voice-pitch");
const inputEvilVoiceRate = document.querySelector("#input-evil-voice-rate");
const inputEvilVoiceVolume = document.querySelector("#input-evil-voice-volume");

const txtMessageInput = document.querySelector("#message-input");
const txtMessageLog = document.querySelector("#message-log");

const chkAutoVoice = document.querySelector("#chk-auto-voice");

const btnAskBoth = document.querySelector("#btn-ask-both");
const btnAskEvil = document.querySelector("#btn-ask-evil");
const btnAskGood = document.querySelector("#btn-ask-good");
const btnClearInput = document.querySelector("#btn-clear-input");
const btnClearHistory = document.querySelector("#btn-clear-history");
const btnCopyHistory = document.querySelector("#btn-copy-history");
const btnOpenVoiceSettings = document.querySelector("#btn-open-voice-settings");
const btnCloseVoiceSettings = document.querySelector("#btn-close-voice-settings");
const btnTestGoodVoice = document.querySelector("#btn-test-good-voice");
const btnTestEvilVoice = document.querySelector("#btn-test-evil-voice");
const btnCancelGoodVoice = document.querySelector("#btn-cancel-good-voice");
const btnCancelEvilVoice = document.querySelector("#btn-cancel-evil-voice");


btnAskBoth.addEventListener("click", chatBoth);
btnAskEvil.addEventListener("click", chatEvil);
btnAskGood.addEventListener("click", chatGood);
btnClearInput.addEventListener("click", () => clearInput());
btnClearHistory.addEventListener("click", () => clearMessageLog());
btnCopyHistory.addEventListener("click", () => copyTextToClipboard(txtMessageLog.innerHTML));
btnOpenVoiceSettings.addEventListener("click", () => openVoiceSettingsDialog());
btnCloseVoiceSettings.addEventListener("click", () => closeVoiceSettingsDialog());
btnTestGoodVoice.addEventListener("click", () => testVoice(Personality.GOOD));
btnTestEvilVoice.addEventListener("click", () => testVoice(Personality.EVIL));
btnCancelGoodVoice.addEventListener("click", () => cancelVoice());
btnCancelEvilVoice.addEventListener("click", () => cancelVoice());
chkAutoVoice.addEventListener("click", () => localStorage.setItem(LOCAL_ITEM_AUTO_VOICE, chkAutoVoice.checked));

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

const shortDateTimeFormat = { dateStyle: 'short', timeStyle: 'short' };

let messageLog = [];
let gptLog = [];
let systemVoices = [];
let goodVoiceIndex = -1;
let evilVoiceIndex = -1;

/**
 * Cancels current voices.
 */
function cancelVoice() {
    cancelSpeaking();
}

/**
 * Gets the voice settings for a given mood.
 * @param {*} mood 
 * @returns 
 */
function getVoiceSettingsByMood(mood) {
    return {
        pitch: parseFloat((mood == Personality.GOOD) ? inputGoodVoicePitch.value : inputEvilVoicePitch.value),
        rate: parseFloat((mood == Personality.GOOD) ? inputGoodVoiceRate.value : inputEvilVoiceRate.value),
        volume: parseFloat((mood == Personality.GOOD) ? inputGoodVoiceVolume.value : inputEvilVoiceVolume.value),
        text: (mood == Personality.GOOD) ? moodGood.value : moodEvil.value,
        voiceIndex: parseInt((mood == Personality.GOOD) ? selectGoodVoice.value : selectEvilVoice.value),
        voiceName: (mood == Personality.GOOD) ? selectGoodVoice.options[selectGoodVoice.selectedIndex].text : selectEvilVoice.options[selectEvilVoice.selectedIndex].text
    };
}

/**
 * Tests a voice.
 * @param {*} mood 
 */
function testVoice(mood) {
    const voiceSettings = getVoiceSettingsByMood(mood);
    speak(voiceSettings.text, systemVoices[voiceSettings.voiceIndex], voiceSettings.volume, voiceSettings.rate, voiceSettings.pitch);
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

    localStorage.setItem(LOCAL_ITEM_VOICES, JSON.stringify(voiceSelection));
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
    gptLog.length = 0;

    messageLog.textContent = "";
    txtMessageLog.textContent = "";
    messageGood.textContent = "";
    messageEvil.textContent = "";
    totalTokens.textContent = 0;
    goodTokens.textContent = 0;
    evilTokens.textContent = 0;
    goodMessageCount.textContent = 0;
    evilMessageCount.textContent = 0;

    localStorage.setItem(LOCAL_ITEM_MESSAGE_LOG, JSON.stringify(messageLog));
    localStorage.setItem(LOCAL_ITEM_GPT_LOG, JSON.stringify(gptLog));
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
function addToChatUI(messageId, request, response) {
    const htmlMessage = createMessageUI(messageId, request, response);
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
    const goodTokenTotals = gptLog.filter((log) => log.mood === Personality.GOOD).map((log) => log.response.usage.total_tokens);
    const evilTokenTotals = gptLog.filter((log) => log.mood === Personality.EVIL).map((log) => log.response.usage.total_tokens);

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
            document.querySelector("#" + messageId + "-response-waitsec").textContent = parseFloat(message.waitTimeSec).toFixed(1);
            document.querySelector("#" + messageId + "-response-tokens").textContent = parseInt(message.tokens);

            const messagesAsStrings = JSON.stringify(messageLog, null, 2);
            localStorage.setItem(LOCAL_ITEM_MESSAGE_LOG, messagesAsStrings);
            txtMessageLog.innerHTML = messagesAsStrings;

            updateUI();

            if (chkAutoVoice.checked) {
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

/**
 * Loads local storage data.
 */
function loadLocalStorage() {
    const localMessageLog = localStorage.getItem(LOCAL_ITEM_MESSAGE_LOG);
    messageLog = localMessageLog ? JSON.parse(localMessageLog) : [];
    txtMessageLog.innerHTML = JSON.stringify(messageLog, null, 2);

    const localGptLog = localStorage.getItem(LOCAL_ITEM_GPT_LOG);
    gptLog = localGptLog ? JSON.parse(localGptLog) : [];

    const localVoices = JSON.parse(localStorage.getItem(LOCAL_ITEM_VOICES));

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

    chkAutoVoice.checked = localStorage.getItem(LOCAL_ITEM_AUTO_VOICE);
}

/**
 * Speaks out the message.
 * @param {*} messageId 
 * @returns 
 */
function speakMessage(messageId) {

    populateSystemVoices();

    const localVoices = JSON.parse(localStorage.getItem(LOCAL_ITEM_VOICES));

    if (localVoices === null) {
        alert("Please configure the voices on the Profile tab.");
        return;
    }

    const response = messageLog.filter(m => m.messageId === messageId && m.role === GPT_CHAT_ROLE_ASSISTANT)[0];
    const voiceSettings = getVoiceSettingsByMood(response.mood);
    speak(response.content, systemVoices[voiceSettings.voiceIndex], voiceSettings.volume, voiceSettings.rate, voiceSettings.pitch);
}

/**
 * Adds voice options to a voice select.
 * @param {*} select 
 */
function populateSelectVoices(select) {
    select.add(new Option("Select voice", "-1", true));

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
    addToChatUI(messageId, request, response);
}
