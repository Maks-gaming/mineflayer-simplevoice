import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

export type ClientboundPingPacketData = {};

export default class ClientboundPingPacket extends ClientboundSocketPacket<ClientboundPingPacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x7, "ClientboundPingPacket");
	}

	public deserialize(data: FriendlyByteBuf): ClientboundPingPacketData {
		return {};
	}
}
