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
 * Updates the mute voices change.
 */
function updateMuteVoicesChanged() {
    setLocalItem(LOCAL_ITEM_MUTE_VOICES, isVoicesMuted);
    updateMuteVoices();
}
