import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

export default class ClientboundAuthenticateAckPacket extends ClientboundSocketPacket<{}> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x6, "ClientboundAuthenticateAckPacket");
	}

	public deserialize(data: FriendlyByteBuf): {} {
		return {};
	}
}
