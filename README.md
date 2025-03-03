# What?
This app creates two opposite AI personalities (Goodness & Evilness) for you to have a conversation with.

All you need is an OpenAI API key and you're up and running in a few minutes.

![Image of user interface](https://github.com/RonniKahalani/good-evil-gpt/raw/main/doc/thumb-demo-end.png)

## Features
- Keyboard shortcuts for most interactions.
- Synthesis speech, if available on the client system.
- Change personality system prompts and voices.
- Muting/replay voices/messages.
- Change AI request parameters (gpt model, max. tokens...).
- Clear and export chat history (Json format).
- Visualising used token counts (totals + per message).
- Copy a message text to the clipboard.

##  Technology
- Language: JavaScript.
- HTML & Bootstrap CSS.
- OpenAI ChatGPT API.

## Video
Watch a video with screenshots and live interaction.
Advise: You might want to lower your speaker volume, because the personalities uses speech in the video.
[Show Video](https://drive.google.com/file/d/1Y6ugVMStAKIMt-MXvJSHHzXBc0zKkChw/view?usp=drive_link)

## License
Free code use under the open-source software MIT license. Enjoy.

## Contact Info
- X: https://x.com/RonniKahalani
- Website: https://learningisliving.dk
- LinkedIn: https://www.linkedin.com/in/kahalani/

# Why?
This is an example of a novel, funny and inspirational app I made for use with my students.

## Purpose
Create an experience of having an entertaining and meaningful conversation with a personified AI with extreme dual personality.

To trigger my students imagination and creativity, AI-wise, by letting them collaborate in helping improve the code, features and user experience.

## Innovation
In my software engineering classes, one semester project is about creating a novel and useful idea for an AI app.

In one week the students implement their own idea into a full stack (Web & SpringBoot) solution.

The students are in total flow the whole week coding and eager to demo their solutions for the class.

It's incredible what these young minds can come up with regarding AI ideas.

## Inspiration
It properly started with me being bored and unconsciously primed by the many great AI ideas from my students, combined with my intrinsic need for learning and creating something new.

Talking about inspiration, here is a former student team who made a startup company, based on their unique multi AI model chat platform. Check it out at: http://intellioptima.com

# How?
Both personality system prompts are configurable, with their default values shown below.

## Evilness Personality
*"If asked about your name, you answer Evilness. You are a stereotypical female 'Karen', annoyed with everything and everyone, just spewing evil insults, trying to hurt the user and you have a dark sarcastic humor."*

## Goodness Personality
*"If asked about your name, you answer Goodness. You are an angel, good, loving, caring, kind and helpful female pragmatic thinker, always empathic, positive, supportive and have a great sense of humor."*

## Chat Awareness
Both personalities knows your chat history (context). 
Ex. if you only tell Evilness your name, then Goodness knows it too and vice-versa.

## Security
- No data is sent or fetched anywhere, besides ChatGPT.
- Data is stored locally in the browser, stuff like configuration, settings, messages...
- Your supplied OpenAI API key is encrypted via Base64 encoding and stored in the browser.
- You're adviced to clear the message log via the app, when appropriate.

## Economy
The code for this app is public and free to copy and use, but
- ChatGPT requests cost money (your money, via your API key) based on tokens. 
- Be aware of your OpenAI balance ($).
- Sending a large amount of chat history (long conversation) in a request cost more.
- Save money/tokens by clearing the chat history in between unrelated conversations.

## Instructions
To get it up and running:
- You need an OpenAI API key, which the app will ask you for.
- Clone/Fork this [GitHub repository](https://github.com/RonniKahalani/good-evil-gpt)
- Use ex. VS Code to run the web app, via the Live Server plugin.
- Check this [Keyboard Shortcuts](https://github.com/RonniKahalani/good-evil-gpt/blob/main/doc/Keys.md),  [Ethical AI Disclaimer](https://github.com/RonniKahalani/good-evil-gpt/blob/main/doc/Ethical-AI.md), [Ethical AI Discussion](https://github.com/RonniKahalani/good-evil-gpt/discussions/3).
- Have fun :)
- Please share any [feedback and ideas here](https://github.com/RonniKahalani/good-evil-gpt/discussions/new?category=ideas)

## Stuff left to do
The code needs cleaning up and refactoring.

### Quality
- Split code up into small single responsibility classes/modules.
- Configure automated testing.

### Security
- Create API key clear/reset feature.

### Testing
Only tested manually, in my Chrome browser on Windows 10.
- Pick a UI test framework.

### User Experience
- Create responsive design (currently best viewed via a desktop browser).
- Design final graphical look n feel concept.


This is one of several OpenAI ChatGPT example apps. See also [ChatGPT Jokes App](https://github.com/RonniKahalani/chatgpt-jokes).

