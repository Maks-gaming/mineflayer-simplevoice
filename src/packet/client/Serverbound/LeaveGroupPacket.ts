import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ServerboundPacket } from "../Packet";

export default class ServerboundLeaveGroupPacket extends ServerboundPacket<{}> {
	constructor(bot: Bot) {
		super(bot, "voicechat:leave_group", "ServerboundLeaveGroupPacket");
	}

	public serialize(): FriendlyByteBuf {
		const packet = new FriendlyByteBuf();
		return packet;
	}
}
