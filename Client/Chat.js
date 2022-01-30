import alt from 'alt-client';

import { colorifyText } from "../Shared/Shared";

export class Chat
{
    constructor(settings)
    {
        alt.loadRmlFont("./rml/fonts/Roboto-Bold.ttf", "RobotoBold", false, true);
        alt.loadRmlFont("./rml/fonts/Raleway-Bold.ttf", "RalewayBold", false, true);
        alt.loadRmlFont("./rml/fonts/Inter-Bold.ttf", "InterBold", false, true);
        alt.toggleRmlControls(false);

        this.settings = {
            maxMessage: 50,

            fadeTime: 6000,
            fadeFrom: 1.0,
            fadeTo: 0.3,

            emitMessages: true,
            emitCommands: true,

            serverMessages: true
        };
        this.settings = Object.assign({}, this.settings, settings);

        this.document = new alt.RmlDocument("./rml/index.rml");
        this.chatInput = this.document.getElementByID("chatInput");
        this.chatMessages = this.document.getElementByID("chatMessages");
        this.timestamp = false;
        this.visible = true;

        this.history = {
            data: [],
            index: -1
        };

        this.commands = [];
        this.events = {
            "message": [],
            "text": [],
            "command": [],
            "fadeIn": [],
            "fadedIn": [],
            "fadeOut": [],
            "fadedOut": []
        };
        this.eventPrefix = "chat:events:on";
        
        this.fadeSettings = {
            startTime: null,
            endTime: null,
            fadeTime: this.settings.fadeTime,

            inProgress: false,
            tickHandler: null,

            fromOpacity: this.settings.fadeFrom,
            toOpacity: this.settings.fadeTo,
            opacity: 1.0,
        };

        //Key presses
        alt.on("keydown", (key) => this._handleKeyDown(key));

        //Handle outgoing messages to the server
        if(this.settings.emitMessages)
        {
            this.on("text", (str) => alt.emitServer("chat:onMessage", str));
        }

        //Handle outgoing commands to the server
        if(this.settings.emitCommands)
        {
            this.on("command", (commandFound, commandName, ...commandArgs) => {
                if(!commandFound)
                    alt.emitServer("chat:events:onCommand", commandName, ...commandArgs);
            });
        }

        //Handle server messages
        if(this.settings.serverMessages)
        {
            alt.onServer("chat:addMessage", (message) => chat.addMessage(message));
        }
    }

    _emit(eventName, ...args)
    {
        if(this.events[eventName] === undefined)
            return false;

        for (const callback of this.events[eventName]) {
            callback(...args);
        }
    }

    _executeCommand(cmd, ...args)
    {
        if(this.commands[cmd] === undefined)
            return false;

        this.commands[cmd](...args);
        return true;
    }

    on(eventName, cb)
    {
        if(this.events[eventName] === undefined)
            this.events[eventName] = [];

        this.events[eventName].push(cb);
    }

    off(eventName, cb)
    {
        if(this.events[eventName] === undefined)
            return false;

        const index = this.events[eventName].indexOf(cb);
        if (index === -1)
            return false;

        this.events[eventName].splice(index, 1);
        return false;
    }

    show()
    {
        this.chatMessages.setProperty("visibility", "visible");
        this.visible = true;
    }

    hide()
    {
        this.chatMessages.setProperty("visibility", "hidden");
        this.visible = false;
    }

    addMessage(str)
    {
        const newMessage = this.document.createElement("div");
        newMessage.id = "message";
        
        const timeStamp = this.document.createElement("span");
        timeStamp.id = "timestamp";
        timeStamp.innerRML = colorifyText(`{#5c5c5c}[${new Date().toTimeString().split(' ')[0]}]`);
        if(!this.timestamp)
            timeStamp.setProperty("display", "none");

        const text = this.document.createElement("span");
        text.id = "text";
        text.innerRML = colorifyText(str);

        newMessage.appendChild(timeStamp);
        newMessage.appendChild(text);
        this.chatMessages.appendChild(newMessage);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        this._emit("message", str);

        const allMessages = this.chatMessages.querySelectorAll("#message");
        if(allMessages.length > this.settings.maxMessage)
            allMessages.slice(0, allMessages.length - this.settings.maxMessage).forEach(e => this.chatMessages.removeChild(e));

        if(!this.fadeSettings.isFadedIn)
            this.fadeMessages(true);

        if(this.fadeSettings.isFadedIn)
            this._resetFadeTimeout();
    }

    _clearFadeTimeout()
    {
        if(this.fadeSettings.timeoutHandler)
            alt.clearTimeout(this.fadeSettings.timeoutHandler);
    }

    _resetFadeTimeout()
    {
        this._clearFadeTimeout();
        
        this.fadeSettings.timeoutHandler = alt.setTimeout(() => {
            if(!this.isChatOpen())
                this.fadeMessages();
        },
        this.fadeSettings.fadeTime);
    }

    isChatOpen()
    {
        return this.document.focusedElement === this.chatInput;
    }

    toggleInput(state)
    {
        state ? this.chatInput.focus() : this.chatInput.blur();
        alt.toggleRmlControls(state);
        alt.toggleGameControls(!state);
        alt.showCursor(state);
    }

    getInputText()
    {
        return this.chatInput.getAttribute("value");
    }

    clearInput()
    {
        this.chatInput.setAttribute("value", "");
    }

    registerCommand(cmd, callback)
    {
        this.commands[cmd] = callback;
    }

    toggleTimestamp(state = true)
    {
        this.timestamp = state;
        this.chatMessages.querySelectorAll("#timestamp").forEach(t => t.setProperty("display", state ? "inline" : "none"));
    }

    isTimestamp()
    {
        return this.timestamp;
    }

    fadeMessages(fadeIn = false, fadeTime = 500)
    {
        if(this.fadeSettings.isFadedIn === fadeIn)
            return;

        this._emit(fadeIn ? "fadeIn" : "fadeOut");
        
        let fromOpacity = (!fadeIn ? this.fadeSettings.fromOpacity : this.fadeSettings.toOpacity);
        let toOpacity = (!fadeIn ? this.fadeSettings.toOpacity : this.fadeSettings.fromOpacity);

        this.fadeSettings.startTime = new Date().getTime();
        this.fadeSettings.endTime = this.fadeSettings.startTime + fadeTime;
        this.fadeSettings.inProgress = true;
        this.fadeSettings.isFadedIn = fadeIn;

        if(this.fadeSettings.tickHandler !== null)
            alt.clearEveryTick(this.fadeSettings.tickHandler);

        this.fadeSettings.tickHandler = alt.everyTick(() => {
            const dateNow = new Date().getTime();
            const elapsedTime = dateNow - this.fadeSettings.startTime;
            const duration = this.fadeSettings.endTime - this.fadeSettings.startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            const s = (fromOpacity - ((fromOpacity - toOpacity) * progress));
            this.fadeSettings.opacity = s;

            this.chatMessages.setProperty('font-effect', `shadow( 1px 1px rgba(0, 0, 0, ${parseInt(this.fadeSettings.opacity * 255)}) )`);
            this.chatMessages.setProperty('opacity', this.fadeSettings.opacity);

            if(progress === 1)
            {
                alt.clearEveryTick(this.fadeSettings.tickHandler);
                this.fadeSettings.tickHandler = null;
                this.fadeSettings.inProgress = false;

                this._emit(this.fadeSettings.isFadedIn ? "fadedIn" : "fadedOut");
            }
        });
    }

    _handleKeyDown(key)
    {
        //Page up and down
        if(key === 33 || (key === 34) && this.isChatOpen())
        {
            this.chatMessages.scrollTop += (key === 33) ? -70 : 70;
        }

        //Up and down arrow for chat history
        if((key === 38 || key === 40) && this.isChatOpen())
        {
            const isUp = (key === 38);
            this.history.index += (isUp ? 1 : -1);
            if(this.history.index >= this.history.data.length)
                this.history.index = -1;

            if(this.history.index < -1)
                this.history.index = ((this.history.data.length === 0) ? -1 : (this.history.data.length - 1));

            this.chatInput.setAttribute("value", (this.history.index === -1) ? "" : this.history.data[this.history.index]);
        }

        //T - open chat
        if(key === 'T'.charCodeAt(0) && !alt.isConsoleOpen() && !this.isChatOpen())
        {
            this.toggleInput(true);
            this.fadeMessages(true);

            this.history.index = -1;
        }

        //Enter - send input
        if(key === 13 && this.isChatOpen())
        {
            const message = this.getInputText();
            this.toggleInput(false);
            this.clearInput();

            if(message === "")
                return;
            
            if(message[0] === '/')
            {
                const fullCommand = message.substring(1);
                const [commandName, ...commandArgs] = fullCommand.split(' ');

                let commandFound = false;
                if(commandArgs === undefined)
                {
                    commandFound = this._executeCommand(commandName);
                    this._emit("command", commandFound, commandName);
                }
                else
                {
                    commandFound = this._executeCommand(commandName, ...commandArgs);
                    this._emit("command", commandFound, commandName, ...commandArgs);
                }
            } else
                this._emit("text", message);

            this.history.data.unshift(message);
            this.history.data = this.history.data.slice(0, 16);

            this._resetFadeTimeout();
        }
    }
}