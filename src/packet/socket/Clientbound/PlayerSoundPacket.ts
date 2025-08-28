import dgram from "dgram";
import { FriendlyByteBuf } from "../../../data/FriendlyByteBuf";
import { ClientboundSocketPacket } from "../SocketPacket";

const WHISPER_MASK = 0b1;
const HAS_CATEGORY_MASK = 0b10;

export type PlayerSoundPacketData = {
	channelId: UUID;
	sender: UUID;
	data: Uint8Array<ArrayBufferLike>;
	sequenceNumber: bigint;
	distance: number;
	whispering: boolean;
	category?: string;
};

export default class ClientboundPlayerSoundPacket extends ClientboundSocketPacket<PlayerSoundPacketData> {
	constructor(socket: dgram.Socket) {
		super(socket, 0x2, "ClientboundPlayerSoundPacket");
	}

	protected hasFlag(data: number, mask: number): boolean {
		return (data & mask) !== 0;
	}

	public deserialize(data: FriendlyByteBuf): PlayerSoundPacketData {
		const soundPacket: PlayerSoundPacketData = {
			channelId: data.readUUID(),
			sender: data.readUUID(),
			data: data.readByteArray(),
			sequenceNumber: data.readLong(),
			distance: data.readFloat(),
			whispering: false,
		};

		const flags = data.readByte();
		soundPacket.whispering = this.hasFlag(flags, WHISPER_MASK);
		if (this.hasFlag(flags, HAS_CATEGORY_MASK)) {
			soundPacket.category = data.readUtf(16);
		}
		return soundPacket;
	}
}
