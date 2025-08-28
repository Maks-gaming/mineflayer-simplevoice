import { EventEmitter } from "events";
import { Bot } from "mineflayer";
import { FriendlyByteBuf } from "../../data/FriendlyByteBuf";
import { log } from "../../lib";

export abstract class ClientboundPacket<T extends Object> extends EventEmitter {
	constructor(
		private readonly bot: Bot,
		private readonly channel: string,
		private readonly name: string,
	) {
		bot._client.on(channel, (raw: Buffer) => {
			const buf = new FriendlyByteBuf(raw);

			const data = this.deserialize(buf);

			log.getSubLogger({ name: "Client" }).debug(`RECEIVE ${this.name}`);
			log.getSubLogger({ name: "Client" }).silly(data);

			this.emit("packet", data);
		});

		super();
	}

	public abstract deserialize(data: FriendlyByteBuf): T;
}

export abstract class ServerboundPacket<T extends Object> {
	constructor(
		private readonly bot: Bot,
		private readonly channel: string,
		private readonly name: string,
	) {}

	protected abstract serialize(data: T): FriendlyByteBuf;

	public send(data: T) {
		log.getSubLogger({ name: "Client" }).debug(`SEND ${this.name}`);
		log.getSubLogger({ name: "Client" }).silly(data);

		this.bot._client.write("custom_payload", {
			channel: this.channel,
			data: Buffer.from(this.serialize(data).getAllBytes()),
		});
	}
}
