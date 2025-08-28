import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ServerboundSocketPacket } from "../SocketPacket";

export type ServerboundAuthenticatePacketData = {
	playerUUID: UUID;
	secret: UUID;
};

export default class ServerboundAuthenticatePacket extends ServerboundSocketPacket<ServerboundAuthenticatePacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x5, "AuthenticatePacket");
	}

	protected serialize(
		data: ServerboundAuthenticatePacketData,
	): FriendlyByteBuf {
		const buf = new FriendlyByteBuf();
		buf.writeUUID(data.playerUUID);
		buf.writeUUID(data.secret);
		return buf;
	}
}
