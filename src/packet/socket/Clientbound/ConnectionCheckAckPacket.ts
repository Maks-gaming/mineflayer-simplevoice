import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

export default class ClientboundConnectionCheckAckPacket extends ClientboundSocketPacket<{}> {
	constructor(socket: dgram.Socket) {
		super(socket, 0xa, "ClientboundConnectionCheckAckPacket");
	}

	public deserialize(data: FriendlyByteBuf): {} {
		return {};
	}
}
