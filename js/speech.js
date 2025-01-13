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

function speak(text, settings) {

    const speech = new SpeechSynthesisUtterance();

    speeches.push(speech);
    speech.name = settings ? settings.name : null;

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
    speech.volume = settings ? settings.volume : 1;
    speech.rate = settings ? settings.rate : 1;
    speech.pitch = settings ? settings.pitch : 1;
    speech.voice = settings ? systemVoices[settings.voiceIndex] : null;

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