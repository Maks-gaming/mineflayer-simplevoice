import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

export default class ClientboundPingPacket extends ClientboundSocketPacket<{}> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x7, "ClientboundPingPacket");
	}

	public deserialize(data: FriendlyByteBuf): {} {
		return {};
	}
}
