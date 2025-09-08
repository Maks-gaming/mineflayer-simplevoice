import { Bot } from "mineflayer";
import { Logger } from "tslog";
import SoundConverter from "./SoundConverter";
import { StoredData } from "./StoredData";
import VoiceChatClient from "./VoiceChatClient";
import { Utils } from "./utils";

export const log = new Logger({ minLevel: 4 });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class VoiceChat {
	/** Are you sure you need this? */
	readonly _client;

	private isStreaming: boolean = false;
	private isPaused: boolean = false;
	private currentStreamController: {
		stop: () => void;
		pause: () => void;
		resume: () => void;
	} | null = null;

	private sequenceNumber: bigint = 0n;

	constructor(bot: Bot) {
		this._client = new VoiceChatClient(bot);

		bot.on("voicechat_connect", () => {
			this.sequenceNumber = 0n;
		});
	}

	/** Get player voice information by username */
	getPlayer(player: string) {
		const uuid = this._client.getIdByName(player);
		if (!uuid) return undefined;

		const data = this._client.getPlayers().get(uuid)!;
		const playerInfo = {
			...data,
			playerUUID: Utils.uuidToString(data.playerUUID),
			group: data.group ? Utils.uuidToString(data.group) : undefined,
		};
		return playerInfo;
	}

	/** Get all player voice information */
	getPlayers() {
		return Array.from(this._client.getPlayers().values()).map((data) => ({
			...data,
			playerUUID: Utils.uuidToString(data.playerUUID),
			group: data.group ? Utils.uuidToString(data.group) : undefined,
		}));
	}

	/** Get group voice information by UUID */
	getGroup(uuid: string) {
		return this._client.getGroups().get(uuid);
	}

	/** Get all group voice information */
	getGroups() {
		return Array.from(this._client.getGroups().values()).map((data) => ({
			...data,
			id: Utils.uuidToString(data.id),
		}));
	}

	/** Join a voice group by name */
	joinGroup(name: string, password?: string) {
		const group = Array.from(this._client.getGroups().values()).find(
			(group) => group.name === name,
		);

		if (!group) {
			throw new Error(`Group "${name}" not found!`);
		}

		this._client.getPackets().setGroupPacket.send({
			group: group.id,
			password,
		});
	}

	/** Join a voice group by UUID */
	joinGroupByUUID(uuid: string, password?: string) {
		this._client.getPackets().setGroupPacket.send({
			group: Utils.stringToUUID(uuid),
			password,
		});
	}

	/** Leave a voice group */
	leaveGroup() {
		this._client.getPackets().leaveGroupPacket.send({});
	}

	/** Check if the client is connected to the voice chat */
	isConnected() {
		return this._client.isConnected();
	}

	/** Stop the audio stream */
	stopAudio() {
		if (this.currentStreamController) {
			this.currentStreamController.stop();
			this.isStreaming = false;
			this.isPaused = false;
			this.currentStreamController = null;
			log.info("Audio stream stopped.");
		}
	}

	/** Pause the audio stream */
	pauseAudio() {
		if (
			this.isStreaming &&
			!this.isPaused &&
			this.currentStreamController
		) {
			this.currentStreamController.pause();
			this.isPaused = true;
			log.info("Audio stream paused.");
		}
	}

	/** Resume the audio stream */
	resumeAudio() {
		if (this.isStreaming && this.isPaused && this.currentStreamController) {
			this.currentStreamController.resume();
			this.isPaused = false;
			log.info("Audio stream resumed.");
		}
	}

	/**
	 * Send an audio file to the voice chat
	 * @param audio Path to the audio file (wav, mp3, ogg, flac, etc.)
	 * @throws Will throw an error if the voice chat is not connected or if another audio stream is active
	 */
	async sendAudio(audio: string): Promise<void> {
		if (!this.isConnected()) {
			throw log.error("Voice chat is not loaded!");
		}

		if (this.isStreaming) {
			throw log.error("Another audio stream is already active!");
		}

		const pcmBuffer = await SoundConverter.convertToPCM(
			audio,
			StoredData.SAMPLE_RATE,
			StoredData.CHANNELS,
		);
		await this.sendPCM(pcmBuffer);
	}

	/**
	 * Send a raw PCM buffer to the voice chat
	 * @param pcmBuffer Raw PCM buffer (16-bit signed PCM, 48kHz, mono)
	 * @throws Will throw an error if the voice chat is not connected or if another audio stream is active
	 */
	async sendPCM(pcmBuffer: Buffer) {
		if (this.isStreaming) {
			throw log.error("Another PCM stream is already active!");
		}

		this.isStreaming = true;
		this.isPaused = false;

		const frameSize =
			(StoredData.SAMPLE_RATE / 1000) *
			StoredData.FRAME_DURATION_MS *
			StoredData.CHANNELS *
			2; // 1920 bytes

		let shouldStop = false;
		let isPaused = false;

		const controller = {
			stop: () => {
				shouldStop = true;
			},
			pause: () => {
				isPaused = true;
			},
			resume: () => {
				isPaused = false;
			},
		};

		this.currentStreamController = controller;

		const loopStartTime = performance.now();
		const initialSequenceNumber = Number(this.sequenceNumber);

		try {
			for (let i = 0; i < pcmBuffer.length; i += frameSize) {
				if (!this.isConnected()) {
					log.warn("Voice chat disconnected, stopping audio stream.");
					break;
				}

				if (shouldStop) {
					break;
				}

				if (isPaused) {
					while (isPaused && !shouldStop) {
						await sleep(100);
					}
					if (shouldStop) {
						break;
					}
				}

				const frame = pcmBuffer.subarray(i, i + frameSize);
				if (frame.length !== frameSize) {
					break;
				}

				const opus = this._client.opusEncoder.encode(frame);

				this._client.getSocketClient().getPackets().micPacket.send({
					sequenceNumber: this.sequenceNumber,
					data: opus,
					whispering: false,
				});

				const nextPacketTime =
					loopStartTime +
					(Number(this.sequenceNumber) - initialSequenceNumber + 1) *
						StoredData.FRAME_DURATION_MS;

				const delay = nextPacketTime - performance.now();

				this.sequenceNumber++;

				if (delay > 0) {
					await sleep(delay);
				}
			}
		} finally {
			this.isStreaming = false;
			this.isPaused = false;
			this.currentStreamController = null;
		}
	}
}
