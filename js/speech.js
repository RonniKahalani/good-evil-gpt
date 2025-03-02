/**
 * Speaks out a voice.
 * @param {*} text 
 * @param {*} settings 
 * @returns 
 */
function speak(text, settings) {

    const speech = new SpeechSynthesisUtterance();
    speech.name = settings ? settings.name : null;
    speech.mood = settings ? settings.mood : null;
    speech.lang = "en_US";
    speech.text = text;
    speech.volume = settings ? settings.volume : 1;
    speech.rate = settings ? settings.rate : 1;
    speech.pitch = settings ? settings.pitch : 1;
    speech.voice = settings ? systemVoices[settings.voiceIndex] : null;

    window.speechSynthesis.speak(speech);
    return speech;
}

/**
 * Tests wether a current speech is active.
 * @returns false if no voice is currently being spoken.
 */
function isSpeaking() {
    return window.speechSynthesis.speaking;
}