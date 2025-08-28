import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

const HAS_CATEGORY_MASK = 0b10;

export type GroupSoundPacketData = {
	channelId: UUID;
	sender: UUID;
	data: Uint8Array<ArrayBufferLike>;
	sequenceNumber: bigint;
	category?: string;
};

export default class ClientboundGroupSoundPacket extends ClientboundSocketPacket<GroupSoundPacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x3, "GroupSoundPacket");
	}

	protected hasFlag(data: number, mask: number): boolean {
		return (data & mask) !== 0;
	}

	public deserialize(data: FriendlyByteBuf): GroupSoundPacketData {
		const soundPacket: GroupSoundPacketData = {
			channelId: data.readUUID(),
			sender: data.readUUID(),
			data: data.readByteArray(),
			sequenceNumber: data.readLong(),
		};

		const flags = data.readByte();
		if (this.hasFlag(flags, HAS_CATEGORY_MASK)) {
			soundPacket.category = data.readUtf(16);
		}
		return soundPacket;
	}
}
