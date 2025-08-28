import { Buffer } from "buffer";

interface ByteBuf {
	capacity(newCapacity: number): this;
	capacity(): number;
	maxCapacity(): number;
	readerIndex(index: number): this;
	readerIndex(): number;
	writerIndex(index: number): this;
	writerIndex(): number;
	setIndex(readerIndex: number, writerIndex: number): this;
	readableBytes(): number;
	writableBytes(): number;
	maxWritableBytes(): number;
	isReadable(): boolean;
	isReadable(numBytes: number): boolean;
	isWritable(): boolean;
	isWritable(numBytes: number): boolean;
	clear(): this;
	markReaderIndex(): this;
	resetReaderIndex(): this;
	markWriterIndex(): this;
	resetWriterIndex(): this;
	discardReadBytes(): this;
	ensureWritable(minWritableBytes: number): this;
	getByte(index: number): number;
	getBytes(
		index: number,
		dest: Buffer,
		destIndex: number,
		length: number,
	): this;
	setByte(index: number, value: number): this;
	setBytes(
		index: number,
		src: Buffer,
		srcIndex: number,
		length: number,
	): this;
	readByte(): number;
	readBytes(dest: Buffer, destIndex: number, length: number): this;
	writeByte(value: number): this;
	writeBytes(src: Buffer, srcIndex: number, length: number): this;
	writeBytes(src: Buffer): this;
	slice(index: number, length: number): Buffer;
	toString(encoding?: BufferEncoding): string;
	toString(start: number, end: number, encoding: BufferEncoding): string;
	writeShort(value: number): this;
	writeInt(value: number): this;
	writeLong(value: bigint): this;
	readShort(): number;
	readInt(): number;
	readLong(): bigint;
	readBoolean(): boolean;
	writeBoolean(value: boolean): this;
	readDouble(): number;
	writeDouble(value: number): this;
	getAllBytes(): Uint8Array;
}

export class FriendlyByteBuf implements ByteBuf {
	private buf: Buffer;
	private _readerIndex: number;
	private _writerIndex: number;
	private markedReaderIndex: number | null;
	private markedWriterIndex: number | null;

	constructor(byteBuf?: Buffer) {
		this.buf = byteBuf || Buffer.alloc(0);
		this._readerIndex = 0;
		this._writerIndex = byteBuf ? byteBuf.length : 0;
		this.markedReaderIndex = null;
		this.markedWriterIndex = null;
	}

	public getUnderlyingByteBuf(): Buffer {
		return this.buf;
	}

	public getAllBytes(): Uint8Array {
		return new Uint8Array(this.buf.slice(0, this.capacity()));
	}

	public writeByteArray(bs: Uint8Array | Buffer): this {
		this.writeVarInt(bs.length);
		this.writeBytes(Buffer.from(bs));
		return this;
	}

	public readByteArray(maxLength: number = this.readableBytes()): Uint8Array {
		const length = this.readVarInt();
		if (length > maxLength) {
			throw new Error(
				`ByteArray with size ${length} is bigger than allowed ${maxLength}`,
			);
		}
		const bs = Buffer.alloc(length);
		this.readBytes(bs, 0, length);
		return bs;
	}

	public readVarInt(): number {
		let value = 0;
		let position = 0;
		let currentByte: number;

		do {
			currentByte = this.readByte();
			value |= (currentByte & 0x7f) << (position * 7);
			position++;
			if (position > 5) {
				throw new Error("VarInt too big");
			}
		} while ((currentByte & 0x80) === 0x80);

		return value;
	}

	// Запись UUID
	public writeUUID(uuid: UUID): this {
		this.writeLong(uuid.mostSignificantBits);
		this.writeLong(uuid.leastSignificantBits);
		return this;
	}

	// Чтение UUID
	public readUUID(): UUID {
		const mostSignificantBits = this.readLong();
		const leastSignificantBits = this.readLong();
		return { mostSignificantBits, leastSignificantBits };
	}

	public readFloat(): number {
		if (!this.isReadable(4)) {
			throw new Error("Not enough readable bytes for float");
		}
		const value = this.buf.readFloatBE(this._readerIndex);
		this._readerIndex += 4;
		return value;
	}

	public writeFloat(value: number): this {
		this.ensureWritable(4);
		this.buf.writeFloatBE(value, this._writerIndex);
		this._writerIndex += 4;
		return this;
	}

	public writeVarInt(value: number): this {
		let v = value;
		while ((v & ~0x7f) !== 0) {
			this.writeByte((v & 0x7f) | 0x80);
			v >>>= 7;
		}
		this.writeByte(v);
		return this;
	}

	public readUtf(maxLength: number = 32767): string {
		const length = this.readVarInt();
		if (length > maxLength * 4) {
			throw new Error(
				`The received encoded string buffer length is longer than maximum allowed (${length} > ${maxLength * 4})`,
			);
		}
		if (length < 0) {
			throw new Error(
				"The received encoded string buffer length is less than zero! Weird string!",
			);
		}
		const str = this.toString(
			this.readerIndex(),
			this.readerIndex() + length,
			"utf8",
		);
		this.readerIndex(this.readerIndex() + length);
		if (str.length > maxLength) {
			throw new Error(
				`The received string length is longer than maximum allowed (${length} > ${maxLength})`,
			);
		}
		return str;
	}

	public writeUtf(str: string, maxLength: number = 32767): this {
		const bs = Buffer.from(str, "utf8");
		if (bs.length > maxLength) {
			throw new Error(
				`String too big (was ${bs.length} bytes encoded, max ${maxLength})`,
			);
		}
		this.writeVarInt(bs.length);
		this.writeBytes(bs);
		return this;
	}

	public capacity(): number;
	public capacity(newCapacity: number): this;
	public capacity(newCapacity?: number): number | this {
		if (newCapacity === undefined) {
			return this.buf.length;
		}
		if (newCapacity < 0 || newCapacity > this.maxCapacity()) {
			throw new Error(`Invalid capacity: ${newCapacity}`);
		}
		if (newCapacity > this.buf.length) {
			const newBuf = Buffer.alloc(newCapacity);
			this.buf.copy(newBuf, 0, 0, this.buf.length);
			this.buf = newBuf;
		} else if (newCapacity < this.buf.length) {
			this.buf = this.buf.slice(0, newCapacity);
		}
		return this;
	}

	public maxCapacity(): number {
		return 2 ** 31 - 1;
	}

	public readerIndex(): number;
	public readerIndex(index: number): this;
	public readerIndex(index?: number): number | this {
		if (index === undefined) {
			return this._readerIndex;
		}
		if (index < 0 || index > this._writerIndex) {
			throw new Error(`Invalid readerIndex: ${index}`);
		}
		this._readerIndex = index;
		return this;
	}

	public writerIndex(): number;
	public writerIndex(index: number): this;
	public writerIndex(index?: number): number | this {
		if (index === undefined) {
			return this._writerIndex;
		}
		if (index < this._readerIndex || index > this.capacity()) {
			throw new Error(`Invalid writerIndex: ${index}`);
		}
		this._writerIndex = index;
		return this;
	}

	public setIndex(readerIndex: number, writerIndex: number): this {
		if (
			readerIndex < 0 ||
			readerIndex > writerIndex ||
			writerIndex > this.capacity()
		) {
			throw new Error(
				`Invalid indices: readerIndex=${readerIndex}, writerIndex=${writerIndex}`,
			);
		}
		this._readerIndex = readerIndex;
		this._writerIndex = writerIndex;
		return this;
	}

	public readableBytes(): number {
		return this._writerIndex - this._readerIndex;
	}

	public writableBytes(): number {
		return this.capacity() - this._writerIndex;
	}

	public maxWritableBytes(): number {
		return this.maxCapacity() - this._writerIndex;
	}

	public isReadable(): boolean;
	public isReadable(numBytes: number): boolean;
	public isReadable(numBytes?: number): boolean {
		return numBytes === undefined
			? this.readableBytes() > 0
			: this.readableBytes() >= numBytes;
	}

	public isWritable(): boolean;
	public isWritable(numBytes: number): boolean;
	public isWritable(numBytes?: number): boolean {
		return numBytes === undefined
			? this.writableBytes() > 0
			: this.writableBytes() >= numBytes;
	}

	public clear(): this {
		this._readerIndex = 0;
		this._writerIndex = 0;
		return this;
	}

	public markReaderIndex(): this {
		this.markedReaderIndex = this._readerIndex;
		return this;
	}

	public resetReaderIndex(): this {
		if (this.markedReaderIndex !== null) {
			this._readerIndex = this.markedReaderIndex;
		}
		return this;
	}

	public markWriterIndex(): this {
		this.markedWriterIndex = this._writerIndex;
		return this;
	}

	public resetWriterIndex(): this {
		if (this.markedWriterIndex !== null) {
			this._writerIndex = this.markedWriterIndex;
		}
		return this;
	}

	public discardReadBytes(): this {
		if (this._readerIndex === 0) {
			return this;
		}
		const newBuf = Buffer.alloc(this.capacity());
		this.buf.copy(newBuf, 0, this._readerIndex, this._writerIndex);
		this._writerIndex -= this._readerIndex;
		this._readerIndex = 0;
		this.buf = newBuf;
		return this;
	}

	public ensureWritable(minWritableBytes: number): this {
		if (minWritableBytes <= this.writableBytes()) {
			return this;
		}
		const newCapacity = this._writerIndex + minWritableBytes;
		if (newCapacity > this.maxCapacity()) {
			throw new Error(
				`Required capacity exceeds maxCapacity: ${newCapacity} > ${this.maxCapacity()}`,
			);
		}
		this.capacity(newCapacity);
		return this;
	}

	public getByte(index: number): number {
		return this.buf.readUInt8(index);
	}

	public getBytes(
		index: number,
		dest: Buffer,
		destIndex: number,
		length: number,
	): this {
		this.buf.copy(dest, destIndex, index, index + length);
		return this;
	}

	public setByte(index: number, value: number): this {
		this.buf.writeUInt8(value, index);
		return this;
	}

	public setBytes(
		index: number,
		src: Buffer,
		srcIndex: number,
		length: number,
	): this {
		src.copy(this.buf, index, srcIndex, srcIndex + length);
		return this;
	}

	public readByte(): number {
		if (!this.isReadable()) {
			throw new Error("No readable bytes");
		}
		const value = this.buf.readUInt8(this._readerIndex);
		this._readerIndex++;
		return value;
	}

	public readBytes(dest: Buffer, destIndex: number, length: number): this {
		if (!this.isReadable(length)) {
			throw new Error(
				`Not enough readable bytes: ${length} required, ${this.readableBytes()} available`,
			);
		}
		this.buf.copy(
			dest,
			destIndex,
			this._readerIndex,
			this._readerIndex + length,
		);
		this._readerIndex += length;
		return this;
	}

	public writeByte(value: number): this {
		this.ensureWritable(1);
		this.buf.writeUInt8(value, this._writerIndex);
		this._writerIndex++;
		return this;
	}

	public writeBytes(src: Buffer, srcIndex: number, length: number): this;
	public writeBytes(src: Buffer): this;
	public writeBytes(src: Buffer, srcIndex?: number, length?: number): this {
		if (srcIndex !== undefined && length !== undefined) {
			this.ensureWritable(length);
			src.copy(this.buf, this._writerIndex, srcIndex, srcIndex + length);
			this._writerIndex += length;
		} else {
			this.ensureWritable(src.length);
			src.copy(this.buf, this._writerIndex);
			this._writerIndex += src.length;
		}
		return this;
	}

	public writeShort(value: number): this {
		this.ensureWritable(2);
		this.buf.writeInt16BE(value, this._writerIndex);
		this._writerIndex += 2;
		return this;
	}

	public writeInt(value: number): this {
		this.ensureWritable(4);
		this.buf.writeInt32BE(value, this._writerIndex);
		this._writerIndex += 4;
		return this;
	}

	public readInt(): number {
		if (!this.isReadable(4)) {
			throw new Error("Not enough readable bytes for int");
		}
		const value = this.buf.readInt32BE(this._readerIndex);
		this._readerIndex += 4;
		return value;
	}

	public writeLong(value: bigint): this {
		this.ensureWritable(8);
		this.buf.writeBigInt64BE(value, this._writerIndex);
		this._writerIndex += 8;
		return this;
	}

	public readShort(): number {
		if (!this.isReadable(2)) {
			throw new Error("Not enough readable bytes for short");
		}
		const value = this.buf.readInt16BE(this._readerIndex);
		this._readerIndex += 2;
		return value;
	}

	public readLong(): bigint {
		if (!this.isReadable(8)) {
			throw new Error("Not enough readable bytes for long");
		}
		const value = this.buf.readBigInt64BE(this._readerIndex);
		this._readerIndex += 8;
		return value;
	}

	public readBoolean(): boolean {
		if (!this.isReadable(1)) {
			throw new Error("Not enough readable bytes for boolean");
		}
		const value = this.buf.readUInt8(this._readerIndex);
		this._readerIndex++;
		return value !== 0;
	}

	public writeBoolean(value: boolean): this {
		this.ensureWritable(1);
		this.buf.writeUInt8(value ? 1 : 0, this._writerIndex);
		this._writerIndex++;
		return this;
	}

	public readDouble(): number {
		if (!this.isReadable(8)) {
			throw new Error("Not enough readable bytes for double");
		}
		const value = this.buf.readDoubleBE(this._readerIndex);
		this._readerIndex += 8;
		return value;
	}

	public writeDouble(value: number): this {
		this.ensureWritable(8);
		this.buf.writeDoubleBE(value, this._writerIndex);
		this._writerIndex += 8;
		return this;
	}

	public slice(index: number, length: number): Buffer {
		return this.buf.slice(index, index + length);
	}

	public toString(encoding?: BufferEncoding): string;
	public toString(
		start: number,
		end: number,
		encoding: BufferEncoding,
	): string;
	public toString(
		startOrEncoding?: BufferEncoding | number,
		end?: number,
		encoding?: BufferEncoding,
	): string {
		if (
			typeof startOrEncoding === "string" ||
			startOrEncoding === undefined
		) {
			return this.buf.toString(startOrEncoding);
		}
		if (startOrEncoding !== undefined && end !== undefined && encoding) {
			return this.buf.toString(encoding, startOrEncoding, end);
		}
		return this.buf.toString();
	}
}
