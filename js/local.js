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
 * Local storage keys.
 */
const LOCAL_ITEM_API_KEY = "api-key";
const LOCAL_ITEM_MESSAGE_LOG = "message-log";
const LOCAL_ITEM_VOICES = "voices";
const LOCAL_ITEM_AUTO_VOICE = "auto-voice";
const LOCAL_ITEM_MUTE_VOICES = "mute-voices";
const LOCAL_ITEM_DISCLAIMER = "disclaimer";
const LOCAL_ITEM_GPT_SETTINGS = "gpt-settings";
const LOCAL_ITEM_PROFILES = "profiles";
const LOCAL_ITEM_LANGUAGE = "language";

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

    const language = getLocalItem(LOCAL_ITEM_LANGUAGE);
    if (language !== null) {
        selectListenLanguage.value = language;
    } else {
        selectListenLanguage.value = "en_US";
    }
}