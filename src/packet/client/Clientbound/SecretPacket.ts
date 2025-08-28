import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundPacket } from "../Packet";

export type ClientboundSecretPacketData = {
	secret: UUID;
	serverPort: number;
	playerUUID: UUID;
	codec: number;
	mtuSize: number;
	voiceChatDistance: number;
	keepAlive: number;
	groupsEnabled: boolean;
	voiceHost: string;
	allowRecording: boolean;
};

export default class ClientboundSecretPacket extends ClientboundPacket<ClientboundSecretPacketData> {
	constructor(bot: Bot) {
		super(bot, "voicechat:secret", "ClientboundSecretPacket");
	}

	public deserialize(packet: FriendlyByteBuf): ClientboundSecretPacketData {
		const secret = packet.readUUID();
		const serverPort = packet.readInt();
		const playerUUID = packet.readUUID();
		const codec = packet.readByte();
		const mtuSize = packet.readInt();
		const voiceChatDistance = packet.readDouble();
		const keepAlive = packet.readInt();
		const groupsEnabled = packet.readBoolean();
		const voiceHost = packet.readUtf();
		const allowRecording = packet.readBoolean();

		return {
			secret: secret,
			serverPort: serverPort,
			playerUUID: playerUUID,
			codec: codec,
			mtuSize: mtuSize,
			voiceChatDistance: voiceChatDistance,
			keepAlive: keepAlive,
			groupsEnabled: groupsEnabled,
			voiceHost: voiceHost,
			allowRecording: allowRecording,
		} as ClientboundSecretPacketData;
	}
}
