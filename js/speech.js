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
 * Starts the speech recognition.
 */
function startListening() { 

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();
    recognition.lang = selectListenLanguage.options[selectListenLanguage.selectedIndex].value;
    setLocalItem(LOCAL_ITEM_LANGUAGE, recognition.lang);

    recognition.onstart = () => {
        const languageText = selectListenLanguage.options[selectListenLanguage.selectedIndex].text;
        txtMessageInput.placeholder = 'I am listening in ' + languageText + '...';
        btnListen.style = 'background-color: green';
        btnListen.disabled = true;
    };

    recognition.onresult = (event) => {
        const insertNewline = txtMessageInput.value.length > 0;
        txtMessageInput.value += (insertNewline ? "\n" : "") + event.results[0][0].transcript;
    };

    recognition.onend = () => {
        txtMessageInput.placeholder = 'Ask me anything...'; 

        btnListen.style = 'background-color: none';
        btnListen.disabled = false;
    };

    recognition.start();
}