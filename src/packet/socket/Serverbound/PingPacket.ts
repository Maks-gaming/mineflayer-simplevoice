import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ServerboundSocketPacket } from "../SocketPacket";

export type ServerboundPingPacketData = {};

export default class ServerboundPingPacket extends ServerboundSocketPacket<ServerboundPingPacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x7, "ServerboundPingPacket");
	}

	public serialize(): FriendlyByteBuf {
		return new FriendlyByteBuf();
	}
}
