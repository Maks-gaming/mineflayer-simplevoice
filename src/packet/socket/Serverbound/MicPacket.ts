import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ServerboundSocketPacket } from "../SocketPacket";

export type ServerboundMicPacketData = {
	data: Uint8Array;
	whispering: boolean;
	sequenceNumber: bigint;
};

export default class ServerboundMicPacket extends ServerboundSocketPacket<ServerboundMicPacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x1, "MicPacket");
	}

	protected serialize(data: ServerboundMicPacketData): FriendlyByteBuf {
		const buf = new FriendlyByteBuf();
		buf.writeByteArray(data.data);
		buf.writeLong(data.sequenceNumber);
		buf.writeBoolean(data.whispering);
		return buf;
	}
}
