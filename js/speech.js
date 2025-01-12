
function speak(text, voice, volume, rate, pitch, name) {

    const speech = new SpeechSynthesisUtterance();

    speech.name = name;

    speech.onstart = (e) => {
        console.log("Voice start" + e)
    };
    speech.onend = (e) => {
        console.log("Voice end" + e)
    };

    speech.lang = "en_US";
    speech.text = text;
    speech.volume = volume ? volume : 1;
    speech.rate = rate ? rate : 1;
    speech.pitch = pitch ? pitch : 1;
    speech.voice = voice;

    if(isSpeaking) {
      //  cancelSpeaking();
    }
    
    window.speechSynthesis.speak(speech);
}

function isSpeaking() {
    return window.speechSynthesis.speaking;
}

function cancelSpeaking() {
    window.speechSynthesis.cancel();
}