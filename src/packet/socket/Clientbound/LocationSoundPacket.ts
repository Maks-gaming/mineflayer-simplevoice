import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

const HAS_CATEGORY_MASK = 0b10;

export type LocationSoundPacketData = {
	channelId: UUID;
	sender: UUID;
	location: { x: number; y: number; z: number };
	data: Uint8Array<ArrayBufferLike>;
	sequenceNumber: bigint;
	distance: number;
	category?: string;
};

export default class ClientboundLocationSoundPacket extends ClientboundSocketPacket<LocationSoundPacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x4, "ClientboundLocationSoundPacket");
	}

	protected hasFlag(data: number, mask: number): boolean {
		return (data & mask) !== 0;
	}

	public deserialize(data: FriendlyByteBuf): LocationSoundPacketData {
		const soundPacket: LocationSoundPacketData = {
			channelId: data.readUUID(),
			sender: data.readUUID(),
			location: {
				x: data.readDouble(),
				y: data.readDouble(),
				z: data.readDouble(),
			},
			data: data.readByteArray(),
			sequenceNumber: data.readLong(),
			distance: data.readFloat(),
		};

		const flags = data.readByte();
		if (this.hasFlag(flags, HAS_CATEGORY_MASK)) {
			soundPacket.category = data.readUtf(16);
		}
		return soundPacket;
	}
}
