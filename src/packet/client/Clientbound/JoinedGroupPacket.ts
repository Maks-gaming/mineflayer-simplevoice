import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundPacket } from "../Packet";

export type ClientboundJoinedGroupPacketData = {
	id?: UUID;
	wrongPassword: boolean;
};

export default class ClientboundJoinedGroupPacket extends ClientboundPacket<ClientboundJoinedGroupPacketData> {
	constructor(bot: Bot) {
		super(bot, "voicechat:joined_group", "ClientboundJoinedGroupPacket");
	}

	public deserialize(
		data: FriendlyByteBuf,
	): ClientboundJoinedGroupPacketData {
		return {
			id: data.readBoolean() ? data.readUUID() : undefined,
			wrongPassword: data.readBoolean(),
		};
	}
}
