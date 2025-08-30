import { ClientboundSecretPacketData } from "./packet/client/Clientbound/SecretPacket";

export namespace StoredData {
	export let secretPacketData: ClientboundSecretPacketData;

	export const SAMPLE_RATE = 48000;
	export const CHANNELS = 1;
	export const FRAME_DURATION_MS = 20;
	export const BITRATE = 48000;
}
