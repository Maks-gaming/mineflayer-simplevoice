import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

export type ClientboundConnectionCheckAckPacketData = {};

export default class ClientboundConnectionCheckAckPacket extends ClientboundSocketPacket<ClientboundConnectionCheckAckPacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0xa, "ClientboundConnectionCheckAckPacket");
	}

	public deserialize(
		data: FriendlyByteBuf,
	): ClientboundConnectionCheckAckPacketData {
		return {};
	}
}
