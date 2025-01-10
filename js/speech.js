
function speak(text, voice) {

    const speech = new SpeechSynthesisUtterance();
    speech.lang = "en_US";
    speech.text = text;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    speech.voice = voice;
    window.speechSynthesis.speak(speech);
}

function isSpeaking() {
    return window.speechSynthesis.speaking;
}

function cancel() {
    window.speechSynthesis.cancel();
}