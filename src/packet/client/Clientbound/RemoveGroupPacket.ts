import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundPacket } from "../Packet";

export type ClientboundRemoveGroupPacketData = {
	id: UUID;
};

export default class ClientboundRemoveGroupPacket extends ClientboundPacket<ClientboundRemoveGroupPacketData> {
	constructor(bot: Bot) {
		super(bot, "voicechat:remove_group", "ClientboundRemoveGroupPacket");
	}

	public deserialize(
		data: FriendlyByteBuf,
	): ClientboundRemoveGroupPacketData {
		return {
			id: data.readUUID(),
		};
	}
}
