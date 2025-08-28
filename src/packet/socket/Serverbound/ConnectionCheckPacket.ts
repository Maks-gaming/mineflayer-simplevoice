import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ServerboundSocketPacket } from "../SocketPacket";

export default class ServerboundConnectionCheckPacket extends ServerboundSocketPacket<{}> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x9, "ServerboundConnectionCheckPacket");
	}

	protected serialize(): FriendlyByteBuf {
		return new FriendlyByteBuf();
	}
}
