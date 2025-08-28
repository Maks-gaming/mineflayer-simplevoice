import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ServerboundSocketPacket } from "../SocketPacket";

export default class ServerboundKeepAlivePacket extends ServerboundSocketPacket<{}> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x8, "ServerboundKeepAlivePacket");
	}

	protected serialize(): FriendlyByteBuf {
		return new FriendlyByteBuf();
	}
}
