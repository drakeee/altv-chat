import alt from 'alt-server';

import { removeTags, flatColor } from '../Shared/Shared';

export class Chat
{
    constructor(settings)
    {
        this.settings = {
            handleIncomingMessages: true,
            enablePlayerColor: true
        };
        this.settings = Object.assign({}, this.settings, settings);

        this.commands = [];
        this.events = {
            "text": [],
            "command": []
        };

        if(this.settings.enablePlayerColor)
        {
            //Set players color on resource start
            alt.on("resourceStart", () => alt.Player.all.forEach(p => p.setLocalMeta("color", flatColor().hex)));

            //Set player's color on connect
            alt.on("playerConnect", (player) => player.setLocalMeta("color", flatColor().hex));
        }

        //Handle incoming messages
        alt.onClient("chat:onMessage", (player, message) => 
        {
            if(this.settings.handleIncomingMessages)
            {
                message = removeTags(message);
                this.addMessage(`{${player.getLocalMeta("color")}}${player.name}(${player.id}): {#FFF}${message}`);
            }

            this._emit("text", player, message);
        });

        //Handle commands which not found on client side
        alt.onClient("chat:events:onCommand", (player, commandName, ...commandArgs) => {
            let commandFound = false;
            if(commandArgs === undefined)
            {
                commandFound = this._executeCommand(player, commandName);
                this._emit("command", player, commandFound, commandName);
            }
            else
            {
                commandFound = this._executeCommand(player, commandName, ...commandArgs);
                this._emit("command", player, commandFound, commandName, ...commandArgs);
            }
        });
    }

    addMessage(str, players = alt.Player.all)
    {
        alt.emitClient(players, "chat:addMessage", str);
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

    registerCommand(cmd, callback)
    {
        this.commands[cmd] = callback;
    }

    _emit(eventName, ...args)
    {
        if(this.events[eventName] === undefined)
            return false;

        for (const callback of this.events[eventName]) {
            callback(...args);
        }
    }

    _executeCommand(player, cmd, ...args)
    {
        if(this.commands[cmd] === undefined)
            return false;

        this.commands[cmd](player, ...args);
        return true;
    }
}