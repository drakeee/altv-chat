/// <reference types="@altv/types-server" />
/// <reference types="@altv/types-shared" />

import alt from 'alt-server';

import { flatColor, removeTags } from '../Shared/Shared';

//Forward message to players
alt.onClient("chat:onMessage", function(player, message)
{
    message = removeTags(message);
    alt.emitAllClients("chat:addMessage", `{${player.getLocalMeta("color")}}${player.name}(${player.id}): {#FFF}${message}`);
});

//Set players color on resource start
alt.on("resourceStart", () => alt.Player.all.forEach(p => p.setLocalMeta("color", flatColor().hex)));

//Set player's color on connect
alt.on("playerConnect", (player) => player.setLocalMeta("color", flatColor().hex));