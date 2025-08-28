import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundPacket } from "../Packet";

export type ClientboundPlayerStatePacketData = {
	disabled: boolean;
	disconnected: boolean;
	playerUUID: UUID;
	name: string;
	group: UUID | undefined;
};

export default class ClientboundPlayerStatePacket extends ClientboundPacket<ClientboundPlayerStatePacketData> {
	constructor(bot: Bot) {
		super(bot, "voicechat:player_state", "ClientboundPlayerStatePacket");
	}

	public deserialize(
		data: FriendlyByteBuf,
	): ClientboundPlayerStatePacketData {
		return {
			disabled: data.readBoolean(),
			disconnected: data.readBoolean(),
			playerUUID: data.readUUID(),
			name: data.readUtf(),
			group: data.readBoolean() ? data.readUUID() : undefined,
		};
	}
}
