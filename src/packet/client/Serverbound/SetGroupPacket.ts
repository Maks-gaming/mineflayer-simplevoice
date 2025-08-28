import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ServerboundPacket } from "../Packet";

export type ServerboundSetGroupPacketData = {
	group: UUID;
	password?: string;
};

export default class ServerboundSetGroupPacket extends ServerboundPacket<ServerboundSetGroupPacketData> {
	constructor(bot: Bot) {
		super(bot, "voicechat:set_group", "ServerboundSetGroupPacket");
	}

	public serialize(data: ServerboundSetGroupPacketData): FriendlyByteBuf {
		const packet = new FriendlyByteBuf();
		packet.writeUUID(data.group);
		packet.writeBoolean(data.password != undefined);
		if (data.password) {
			packet.writeUtf(data.password);
		}
		return packet;
	}
}
