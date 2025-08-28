import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { Utils } from "../../../utils";
import { ClientboundPacket } from "../Packet";
import { ClientboundPlayerStatePacketData } from "./PlayerStatePacket";

export type ClientboundPlayerStatesPacketData = Map<
	string,
	ClientboundPlayerStatePacketData
>;

export default class ClientboundPlayerStatesPacket extends ClientboundPacket<ClientboundPlayerStatesPacketData> {
	constructor(bot: Bot) {
		super(bot, "voicechat:player_states", "ClientboundPlayerStatesPacket");
	}

	public deserialize(
		data: FriendlyByteBuf,
	): ClientboundPlayerStatesPacketData {
		const list: ClientboundPlayerStatesPacketData = new Map();
		const amount = data.readInt();
		for (let i = 0; i < amount; i++) {
			const playerState = {
				disabled: data.readBoolean(),
				disconnected: data.readBoolean(),
				playerUUID: data.readUUID(),
				name: data.readUtf(),
				group: data.readBoolean() ? data.readUUID() : undefined,
			};
			list.set(Utils.uuidToString(playerState.playerUUID), playerState);
		}

		return list;
	}
}
