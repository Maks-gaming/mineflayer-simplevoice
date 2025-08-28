import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

export type ClientboundAuthenticateAckPacketData = {};

export default class ClientboundAuthenticateAckPacket extends ClientboundSocketPacket<ClientboundAuthenticateAckPacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x6, "ClientboundAuthenticateAckPacket");
	}

	public deserialize(
		data: FriendlyByteBuf,
	): ClientboundAuthenticateAckPacketData {
		return {};
	}
}
