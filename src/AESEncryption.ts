import crypto from "crypto";
import { StoredData } from "./StoredData";

export namespace AESEncryption {
	export function encrypt(data: Buffer): Buffer {
		if (!StoredData.secretPacketData.secret)
			throw new Error("Not initialized");

		const iv = crypto.randomBytes(16);

		// Convert UUID to a 16-byte buffer by combining most and least significant bits
		const uuidBuffer = Buffer.alloc(16);
		uuidBuffer.writeBigInt64BE(
			StoredData.secretPacketData.secret.mostSignificantBits,
			0,
		);
		uuidBuffer.writeBigInt64BE(
			StoredData.secretPacketData.secret.leastSignificantBits,
			8,
		);

		const cipher = crypto.createCipheriv("aes-128-cbc", uuidBuffer, iv);
		const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

		return Buffer.concat([iv, encrypted]);
	}

	export function decrypt(encryptedData: Buffer): Buffer {
		if (!StoredData.secretPacketData.secret)
			throw new Error("Not initialized");

		// Extract IV from the first 16 bytes
		const iv = encryptedData.subarray(0, 16);
		const data = encryptedData.subarray(16);

		// Convert UUID to a 16-byte buffer by combining most and least significant bits
		const uuidBuffer = Buffer.alloc(16);
		uuidBuffer.writeBigInt64BE(
			StoredData.secretPacketData.secret.mostSignificantBits,
			0,
		);
		uuidBuffer.writeBigInt64BE(
			StoredData.secretPacketData.secret.leastSignificantBits,
			8,
		);

		const decipher = crypto.createDecipheriv("aes-128-cbc", uuidBuffer, iv);
		return Buffer.concat([decipher.update(data), decipher.final()]);
	}
}
