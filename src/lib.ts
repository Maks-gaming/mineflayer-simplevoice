import { OpusEncoder } from "@discordjs/opus";
import { Bot } from "mineflayer";
import { Logger } from "tslog";
import SoundConverter from "./SoundConverter";
import VoiceChatClient from "./VoiceChatClient";
import { Utils } from "./utils";

export const log = new Logger({ minLevel: 4 });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class VoiceChat {
	/** Are you sure you need this? */
	readonly _client;

	private readonly SAMPLE_RATE = 48000;
	private readonly CHANNELS = 1;
	private readonly FRAME_DURATION_MS = 20;
	private readonly BITRATE = 48000;

	private isStreaming: boolean = false;
	private isPaused: boolean = false;
	private currentStreamController: {
		stop: () => void;
		pause: () => void;
		resume: () => void;
	} | null = null;

	constructor(bot: Bot) {
		this._client = new VoiceChatClient(bot);
	}

	getPlayer(player: string) {
		const uuid = this._client.getIdByName(player);
		if (!uuid) return undefined;

		const data = this._client.players.get(uuid)!;
		const playerInfo = {
			...data,
			playerUUID: Utils.uuidToString(data.playerUUID),
			group: data.group ? Utils.uuidToString(data.group) : undefined,
		};
		return playerInfo;
	}

	getPlayers() {
		return Array.from(this._client.players.values()).map((data) => ({
			...data,
			playerUUID: Utils.uuidToString(data.playerUUID),
			group: data.group ? Utils.uuidToString(data.group) : undefined,
		}));
	}

	getGroup(uuid: string) {
		return this._client.groups.get(uuid);
	}

	getGroups() {
		return Array.from(this._client.groups.values()).map((data) => ({
			...data,
			id: Utils.uuidToString(data.id),
		}));
	}

	joinGroup(name: string, password?: string) {
		const group = Array.from(this._client.groups.values()).find(
			(group) => group.name === name,
		);

		if (!group) {
			throw new Error(`Group "${name}" not found!`);
		}

		this._client.setGroupPacket.send({
			group: group.id,
			password,
		});
	}

	joinGroupByUUID(uuid: string, password?: string) {
		this._client.setGroupPacket.send({
			group: Utils.stringToUUID(uuid),
			password,
		});
	}

	leaveGroup() {
		this._client.leaveGroupPacket.send({});
	}

	isConnected() {
		return this._client.connected;
	}

	stopAudio() {
		if (this.currentStreamController) {
			this.currentStreamController.stop();
			this.isStreaming = false;
			this.isPaused = false;
			this.currentStreamController = null;
			log.info("Audio stream stopped.");
		}
	}

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

	resumeAudio() {
		if (this.isStreaming && this.isPaused && this.currentStreamController) {
			this.currentStreamController.resume();
			this.isPaused = false;
			log.info("Audio stream resumed.");
		}
	}

	async sendAudio(audio: string): Promise<void> {
		if (!this.isConnected()) {
			throw log.error("Voice chat is not loaded!");
		}

		if (this.isStreaming) {
			throw log.error("Another audio stream is already active!");
		}

		this.isStreaming = true;
		this.isPaused = false;

		try {
			const pcmBuffer = await SoundConverter.convertToPCM(
				audio,
				this.SAMPLE_RATE,
				this.CHANNELS,
			);
			await this.sendPCM(pcmBuffer);
		} finally {
			this.isStreaming = false;
			this.isPaused = false;
			this.currentStreamController = null;
		}
	}

	async sendPCM(pcmBuffer: Buffer) {
		if (this.isStreaming) {
			throw log.error("Another PCM stream is already active!");
		}

		this.isStreaming = true;
		this.isPaused = false;

		const opusEncoder = new OpusEncoder(this.SAMPLE_RATE, this.CHANNELS);
		opusEncoder.setBitrate(this.BITRATE);

		const frameSize =
			(this.SAMPLE_RATE / 1000) *
			this.FRAME_DURATION_MS *
			this.CHANNELS *
			2; // 1920 bytes
		let sequenceNumber = 0;
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

		try {
			for (let i = 0; i < pcmBuffer.length; i += frameSize) {
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

				const opus = opusEncoder.encode(frame);

				this._client.socketClient.micPacket.send({
					sequenceNumber: BigInt(sequenceNumber),
					data: opus,
					whispering: false,
				});

				const nextPacketTime =
					loopStartTime +
					(sequenceNumber + 1) * this.FRAME_DURATION_MS;

				const delay = nextPacketTime - performance.now();

				sequenceNumber++;

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
