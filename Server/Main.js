/// <reference types="@altv/types-server" />
/// <reference types="@altv/types-shared" />

import alt from 'alt-server';

import { Chat } from './Chat';

const chat = new Chat({
    //handleIncomingMessages: false,
    //enablePlayerColor: false
});

chat.registerCommand("test", (player, ...args) => {
    alt.log("Test command performed: ", player.name, args);
    alt.log("Args size: ", args.length);
});

chat.on("text", (player, message) => {
    alt.log("Player inputted: " + player, message);
});