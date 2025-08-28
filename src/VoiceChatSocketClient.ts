import dgram from "dgram";
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

export default class SimpleVoiceSocketClient {
	private readonly bot;

	socket: dgram.Socket | undefined;

	// Serverbound packets
	authenticatePacket: ServerboundAuthenticatePacket = undefined!;
	connectionCheckPacket: ServerboundConnectionCheckPacket = undefined!;
	serverboundPingPacket: ServerboundPingPacket = undefined!;
	serverboundKeepAlivePacket: ServerboundKeepAlivePacket = undefined!;

	// Clientbound packets
	authenticateAckPacket: ClientboundAuthenticateAckPacket = undefined!;
	connectionCheckAckPacket: ClientboundConnectionCheckAckPacket = undefined!;
	pingPacket: ClientboundPingPacket = undefined!;
	clientboundKeepAlivePacket: ClientboundKeepAlivePacket = undefined!;
	clientboundPingPacket: ClientboundPingPacket = undefined!;
	playerSoundPacket: ClientboundPlayerSoundPacket = undefined!;
	groupSoundPacket: ClientboundGroupSoundPacket = undefined!;
	locationSoundPacket: ClientboundLocationSoundPacket = undefined!;
	micPacket: ServerboundMicPacket = undefined!;

	constructor(bot: Bot) {
		this.bot = bot;

		log.debug("Registering socket packet encoder");
	}

	connect() {
		this.socket = dgram.createSocket("udp4");

		this.socket.on("connect", () => {
			log.getSubLogger({ name: "Socket" }).debug(
				"Connected to the socket",
			);

			this.setupPackets();
		});

		this.socket.on("close", () => {
			log.warn(`Socket closed`);
		});

		this.socket.on("error", (err) => {
			log.fatal(`Socket error: ${err.message}`);
		});

		const ip =
			StoredData.secretPacketData.voiceHost.length > 0
				? new URL(
						"voicechat://" + StoredData.secretPacketData.voiceHost,
					).host
				: this.bot._client.socket.remoteAddress;
		const port = StoredData.secretPacketData.serverPort;

		this.socket.connect(port, ip);
	}

	setupPackets() {
		if (!this.socket) throw new Error("Socket is not connected");

		this.authenticatePacket = new ServerboundAuthenticatePacket(
			this.socket,
		);
		this.authenticateAckPacket = new ClientboundAuthenticateAckPacket(
			this.socket,
		);
		this.connectionCheckPacket = new ServerboundConnectionCheckPacket(
			this.socket,
		);
		this.connectionCheckAckPacket = new ClientboundConnectionCheckAckPacket(
			this.socket,
		);
		this.pingPacket = new ClientboundPingPacket(this.socket);
		this.clientboundKeepAlivePacket = new ClientboundKeepAlivePacket(
			this.socket,
		);
		this.serverboundKeepAlivePacket = new ServerboundKeepAlivePacket(
			this.socket,
		);
		this.clientboundPingPacket = new ClientboundPingPacket(this.socket);
		this.serverboundPingPacket = new ServerboundPingPacket(this.socket);
		this.playerSoundPacket = new ClientboundPlayerSoundPacket(this.socket);
		this.groupSoundPacket = new ClientboundGroupSoundPacket(this.socket);
		this.locationSoundPacket = new ClientboundLocationSoundPacket(
			this.socket,
		);
		this.micPacket = new ServerboundMicPacket(this.socket);
	}
}
