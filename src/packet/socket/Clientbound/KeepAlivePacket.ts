import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

export type ClientboundKeepAlivePacketData = {};

export default class ClientboundKeepAlivePacket extends ClientboundSocketPacket<ClientboundKeepAlivePacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x8, "ClientboundKeepAlivePacket");
	}

	public deserialize(data: FriendlyByteBuf): ClientboundKeepAlivePacketData {
		return {};
	}
}
