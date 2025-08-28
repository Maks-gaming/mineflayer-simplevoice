import dgram from "dgram";
import { EventEmitter } from "events";
import { Bot } from "mineflayer";
import { log } from "./lib";
import ClientboundAuthenticateAckPacket from "./packet/socket/Clientbound/AuthenticateAckPacket";
import ClientboundConnectionCheckAckPacket from "./packet/socket/Clientbound/ConnectionCheckAckPacket";
import ClientboundGroupSoundPacket from "./packet/socket/Clientbound/GroupSoundPacket";
import ClientboundKeepAlivePacket from "./packet/socket/Clientbound/KeepAlivePacket";
import ClientboundLocationSoundPacket from "./packet/socket/Clientbound/LocationSoundPacket";
import ClientboundPingPacket from "./packet/socket/Clientbound/PingPacket";
import ClientboundPlayerSoundPacket from "./packet/socket/Clientbound/PlayerSoundPacket";
import ServerboundAuthenticatePacket from "./packet/socket/Serverbound/AuthenticatePacket";
import ServerboundConnectionCheckPacket from "./packet/socket/Serverbound/ConnectionCheckPacket";
import ServerboundKeepAlivePacket from "./packet/socket/Serverbound/KeepAlivePacket";
import ServerboundMicPacket from "./packet/socket/Serverbound/MicPacket";
import ServerboundPingPacket from "./packet/socket/Serverbound/PingPacket";
import { StoredData } from "./packet/StoredData";

interface PacketRegistry {
	authenticatePacket: ServerboundAuthenticatePacket;
	authenticateAckPacket: ClientboundAuthenticateAckPacket;
	connectionCheckPacket: ServerboundConnectionCheckPacket;
	connectionCheckAckPacket: ClientboundConnectionCheckAckPacket;
	pingPacket: ClientboundPingPacket;
	clientboundKeepAlivePacket: ClientboundKeepAlivePacket;
	serverboundKeepAlivePacket: ServerboundKeepAlivePacket;
	clientboundPingPacket: ClientboundPingPacket;
	serverboundPingPacket: ServerboundPingPacket;
	playerSoundPacket: ClientboundPlayerSoundPacket;
	groupSoundPacket: ClientboundGroupSoundPacket;
	locationSoundPacket: ClientboundLocationSoundPacket;
	micPacket: ServerboundMicPacket;
}

export default class VoiceChatSocketClient extends EventEmitter {
	private readonly bot: Bot;
	private socket?: dgram.Socket;
	private packets: PacketRegistry | null = null;
	private readonly logger = log.getSubLogger({ name: "Socket" });

	constructor(bot: Bot) {
		super();
		this.bot = bot;
		this.logger.debug("Initializing SimpleVoiceSocketClient");
	}

	public connect(): void {
		if (this.socket) {
			this.logger.warn("Socket is already connected");
			return;
		}

		this.socket = dgram.createSocket("udp4");
		this.setupSocketListeners();

		const ip = this.resolveIp();
		const port = StoredData.secretPacketData.serverPort;

		this.logger.debug(`Connecting to ${ip}:${port}`);
		this.socket.connect(port, ip);
	}

	public close(): void {
		if (this.socket) {
			this.socket.close();
			this.socket = undefined;
			this.packets = null;
			this.logger.debug("Socket closed and cleaned up");
		}
	}

	public getPackets(): PacketRegistry {
		if (!this.packets)
			throw new Error("Packet registry is not initialized");

		return this.packets;
	}

	private resolveIp(): string {
		const voiceHost = StoredData.secretPacketData.voiceHost;
		if (voiceHost.length > 0) {
			try {
				return new URL(`voicechat://${voiceHost}`).host;
			} catch (e) {
				this.logger.error(`Invalid voice host URL: ${voiceHost}`);
				throw new Error(`Invalid voice host URL: ${voiceHost}`);
			}
		}
		if (!this.bot._client.socket.remoteAddress) {
			throw new Error(
				"Bot client socket remote address is not available",
			);
		}
		return this.bot._client.socket.remoteAddress;
	}

	private setupSocketListeners(): void {
		if (!this.socket) {
			throw new Error("Socket is not initialized");
		}

		this.socket.on("connect", () => {
			this.logger.debug("Connected to the socket");
			this.initializePackets();
			this.emit("connect");
		});

		this.socket.on("close", () => {
			this.logger.warn("Socket closed");
			this.packets = null;
			this.emit("close");
		});

		this.socket.on("error", (err) => {
			this.logger.fatal(`Socket error: ${err.message}`);
			this.close();
			this.emit("error", err);
		});
	}

	private initializePackets(): void {
		if (!this.socket) {
			throw new Error("Socket is not initialized");
		}

		this.packets = {
			authenticatePacket: new ServerboundAuthenticatePacket(this.socket),
			authenticateAckPacket: new ClientboundAuthenticateAckPacket(
				this.socket,
			),
			connectionCheckPacket: new ServerboundConnectionCheckPacket(
				this.socket,
			),
			connectionCheckAckPacket: new ClientboundConnectionCheckAckPacket(
				this.socket,
			),
			pingPacket: new ClientboundPingPacket(this.socket),
			clientboundKeepAlivePacket: new ClientboundKeepAlivePacket(
				this.socket,
			),
			serverboundKeepAlivePacket: new ServerboundKeepAlivePacket(
				this.socket,
			),
			clientboundPingPacket: new ClientboundPingPacket(this.socket),
			serverboundPingPacket: new ServerboundPingPacket(this.socket),
			playerSoundPacket: new ClientboundPlayerSoundPacket(this.socket),
			groupSoundPacket: new ClientboundGroupSoundPacket(this.socket),
			locationSoundPacket: new ClientboundLocationSoundPacket(
				this.socket,
			),
			micPacket: new ServerboundMicPacket(this.socket),
		};

		this.logger.debug("Packet registry initialized");
	}
}
