import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ServerboundPacket } from "../Packet";

export type ServerboundRequestSecretPacketData = {
	compatibilityVersion: number;
};

export default class ServerboundRequestSecretPacket extends ServerboundPacket<ServerboundRequestSecretPacketData> {
	constructor(bot: Bot) {
		super(
			bot,
			"voicechat:request_secret",
			"ServerboundRequestSecretPacket",
		);
	}

	public serialize(
		data: ServerboundRequestSecretPacketData,
	): FriendlyByteBuf {
		const packet = new FriendlyByteBuf();
		packet.writeInt(data.compatibilityVersion);
		return packet;
	}
}
