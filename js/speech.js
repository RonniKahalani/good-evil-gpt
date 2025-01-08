function speak(message, voice) {

    const speech = new SpeechSynthesisUtterance();
    speech.lang = "en_US";
    speech.text = message;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    speech.voice = voice;
    window.speechSynthesis.speak(speech);
}