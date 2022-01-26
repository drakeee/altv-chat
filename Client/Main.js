/// <reference types="@altv/types-client" />
/// <reference types="@altv/types-natives" />
/// <reference types="@altv/types-shared" />

import alt from 'alt-client';
import native from 'natives';

import { Chat } from './Chat';
import { getBranchColor } from './Utils';

const chat = new Chat(6000);
chat.addMessage(`{${getBranchColor()}}alt:V {#FFF}Multiplayer has started`);

chat.on("text", (str) => alt.emitServer("chat:onMessage", str));

chat.registerCommand("timestamp", () => chat.toggleTimestamp(!chat.isTimestamp()));
chat.registerCommand("chat", () => chat.visible ? chat.hide() : chat.show());

alt.onServer("chat:addMessage", (message) => chat.addMessage(message));

const ChatFunction = {
    on: (eventName, callback) => chat.on(eventName, callback),
    off: (eventName, callback) => chat.off(eventName, callback),
    show: () => chat.show(),
    hide: () => chat.hide(),
    registerCommand: (cmd, callback) => chat.registerCommand(cmd, callback),
    addMessage: (message) => chat.addMessage(message)
};

export default ChatFunction;