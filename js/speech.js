const speakingNow = document.querySelector("#speaking-now");
const speakingNowName = document.querySelector("#speaking-now-name");

const speeches = [];

const removeFromArray = function (array, ...deleteElement) {
    for (let element of deleteElement) {
        if (array.includes(element)) {
            array.splice(array.indexOf(element), 1);
        }
    }
    return array;
};

function speak(text, voice, volume, rate, pitch, name) {

    const speech = new SpeechSynthesisUtterance();

    speeches.push(speech);
    speech.name = name;

    speech.onstart = (e) => {
        console.log("Voice start" + e)
        speakingNowName.textContent = e.utterance.name + " is speaking...";
        speakingNow.style.display = "block";
    };
    speech.onend = (e) => {
        speakingNow.style.display = "none";
        speakingNowName.textContent = "";
        removeFromArray(speeches, e.utterance);
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