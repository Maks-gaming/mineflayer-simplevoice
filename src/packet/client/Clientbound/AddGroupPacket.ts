import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundPacket } from "../Packet";

export type ClientboundAddGroupPacketData = {
	id: UUID;
	name: string;
	hasPassword: boolean;
	persistent: boolean;
	hidden: boolean;
	type: number;
};

export default class ClientboundAddGroupPacket extends ClientboundPacket<ClientboundAddGroupPacketData> {
	constructor(bot: Bot) {
		super(bot, "voicechat:add_group", "ClientboundAddGroupPacket");
	}

	public deserialize(data: FriendlyByteBuf): ClientboundAddGroupPacketData {
		return {
			id: data.readUUID(),
			name: data.readUtf(512),
			hasPassword: data.readBoolean(),
			persistent: data.readBoolean(),
			hidden: data.readBoolean(),
			type: data.readShort(),
		};
	}
}
