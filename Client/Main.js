/// <reference types="@altv/types-client" />
/// <reference types="@altv/types-natives" />
/// <reference types="@altv/types-shared" />

import alt from 'alt-client';
import native from 'natives';

import { Chat } from './Chat';
import { getBranchColor } from './Utils';

const chat = new Chat({
    //maxMessage: 50, //how many messages to save in the chat window

    //fadeTime: 6000, //after how many ms to fade messages
    //fadeFrom: 1.0, //fade opacity
    //fadeTo: 0.3, //fade opacity

    //emitMessages: true, //send messages to server | true: send, false: block
    //emitCommands: true, //send commands to server | true: send, false: block

    //serverMessages: true //block messages from the server | true: receive, false: block
});

//Default message
chat.addMessage(`{${getBranchColor()}}alt:V {#FFF}Multiplayer has started`);

//Default commands to handle chat
chat.registerCommand("timestamp", () => chat.toggleTimestamp(!chat.isTimestamp()));
chat.registerCommand("chat", () => chat.visible ? chat.hide() : chat.show());

//Export functions
const ChatFunction = {
    on: (eventName, callback) => chat.on(eventName, callback),
    off: (eventName, callback) => chat.off(eventName, callback),
    show: () => chat.show(),
    hide: () => chat.hide(),
    registerCommand: (cmd, callback) => chat.registerCommand(cmd, callback),
    addMessage: (message) => chat.addMessage(message)
};
export default ChatFunction;