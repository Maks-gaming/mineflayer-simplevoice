import dgram from "dgram";
import EventEmitter from "events";
import { AESEncryption } from "../../AESEncryption";
import { FriendlyByteBuf } from "../../data/FriendlyByteBuf";
import { log } from "../../lib";
import { StoredData } from "../StoredData";

const MAGIC_BYTE = 0xff;

export abstract class ClientboundSocketPacket<
	T extends Object,
> extends EventEmitter {
	constructor(
		private readonly socket: dgram.Socket,
		private readonly index: number,
		private readonly name: string,
	) {
		super();

		this.socket.on("message", (raw: Buffer) => {
			const buf = new FriendlyByteBuf(raw);

			if (buf.readByte() !== MAGIC_BYTE) return;

			const rawPayload = buf.readByteArray();
			const payload = new FriendlyByteBuf(
				AESEncryption.decrypt(Buffer.from(rawPayload)),
			);

			const index = payload.readByte();
			if (this.index != index) return;

			const data = this.deserialize(payload);

			log.getSubLogger({ name: "Socket" }).debug(`RECEIVE ${this.name}`);
			log.getSubLogger({ name: "Socket" }).silly(data);

			this.emit("packet", data);
		});
	}

	public abstract deserialize(data: FriendlyByteBuf): T;
}

export abstract class ServerboundSocketPacket<T extends Object> {
	constructor(
		private readonly socket: dgram.Socket,
		protected readonly index: number,
		private readonly name: string,
	) {}

	protected abstract serialize(data: T): FriendlyByteBuf;

	public send(data: T) {
		log.getSubLogger({ name: "Socket" }).debug(`SEND ${this.name}`);
		log.getSubLogger({ name: "Socket" }).silly(data);

		// Create single buffer with packet data
		const buf = new FriendlyByteBuf();
		buf.writeByte(MAGIC_BYTE);
		buf.writeUUID(StoredData.secretPacketData.playerUUID);

		const packetbuf = new FriendlyByteBuf();
		packetbuf.writeByte(this.index);
		packetbuf.writeBytes(Buffer.from(this.serialize(data).getAllBytes()));
		const payload = Buffer.from(packetbuf.getAllBytes());

		buf.writeByteArray(AESEncryption.encrypt(payload));

		// Send encrypted data
		this.socket.send(buf.getAllBytes());
	}
}
