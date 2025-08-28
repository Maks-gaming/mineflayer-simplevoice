import { Bot } from "mineflayer";
import { log } from "./lib";
import ClientboundAddGroupPacket, {
	ClientboundAddGroupPacketData,
} from "./packet/client/Clientbound/AddGroupPacket";
import ClientboundJoinedGroupPacket from "./packet/client/Clientbound/JoinedGroupPacket";
import ClientboundPlayerStatePacket, {
	ClientboundPlayerStatePacketData,
} from "./packet/client/Clientbound/PlayerStatePacket";
import ClientboundPlayerStatesPacket from "./packet/client/Clientbound/PlayerStatesPacket";
import ClientboundRemoveGroupPacket from "./packet/client/Clientbound/RemoveGroupPacket";
import ClientboundSecretPacket from "./packet/client/Clientbound/SecretPacket";
import ServerboundLeaveGroupPacket from "./packet/client/Serverbound/LeaveGroupPacket";
import ServerboundRequestSecretPacket from "./packet/client/Serverbound/RequestSecretPacket";
import ServerboundSetGroupPacket from "./packet/client/Serverbound/SetGroupPacket";
import { StoredData } from "./packet/StoredData";
import { Utils } from "./utils";
import SimpleVoiceSocketClient from "./VoiceChatSocketClient";

export default class SimpleVoiceClient {
	private readonly bot;
	private readonly _compatibilityVersion: number = 18;

	readonly socketClient;

	// Packets
	readonly requestSecretPacket;
	readonly secretPacket;
	readonly playerStatePacket;
	readonly playerStatesPacket;
	readonly setGroupPacket;
	readonly addGroupPacket;
	readonly removeGroupPacket;
	readonly leaveGroupPacket;
	readonly joinedGroupPacket;

	// Data
	connected: boolean = false;
	players: Map<string, ClientboundPlayerStatePacketData> = new Map();
	groups: Map<string, ClientboundAddGroupPacketData> = new Map();

	constructor(bot: Bot) {
		this.bot = bot;
		this.socketClient = new SimpleVoiceSocketClient(bot);

		// Packets
		this.requestSecretPacket = new ServerboundRequestSecretPacket(bot);
		this.secretPacket = new ClientboundSecretPacket(bot);
		this.playerStatePacket = new ClientboundPlayerStatePacket(bot);
		this.playerStatesPacket = new ClientboundPlayerStatesPacket(bot);
		this.addGroupPacket = new ClientboundAddGroupPacket(bot);
		this.setGroupPacket = new ServerboundSetGroupPacket(bot);
		this.removeGroupPacket = new ClientboundRemoveGroupPacket(bot);
		this.leaveGroupPacket = new ServerboundLeaveGroupPacket(bot);
		this.joinedGroupPacket = new ClientboundJoinedGroupPacket(bot);

		this.setupEvents();
	}

	registerChannels() {
		log.debug("Registering channels..");

		// "voicechat:request_secret" - no clientbound packets
		const channels = [
			"voicechat:secret",
			"voicechat:player_state",
			"voicechat:player_states",
			"voicechat:set_group",
			"voicechat:add_group",
			"voicechat:remove_group",
			"voicechat:leave_group",
			"voicechat:joined_group",
			"voicechat:main",
		];

		for (const channel of channels) {
			this.bot._client.registerChannel(channel, undefined, true);
		}
	}

	setupEvents() {
		this.bot.once("login", () => this.registerChannels());

		this.bot.on("spawn", () => {
			this.requestSecretPacket.send({
				compatibilityVersion: this._compatibilityVersion,
			});
		});

		this.secretPacket.on("packet", (data) => {
			this.connected = false;
			this.players.clear();
			this.groups.clear();

			StoredData.secretPacketData = data;

			this.socketClient.connect();
			this.socketClient.socket!.on("connect", () => {
				log.getSubLogger({ name: "Socket" }).debug(
					"Connected to the socket",
				);

				this.setupSocketEvents();

				this.socketClient.authenticatePacket.send({
					playerUUID: StoredData.secretPacketData.playerUUID,
					secret: StoredData.secretPacketData.secret,
				});
			});
		});

		this.playerStatePacket.on("packet", (data) => {
			this.players.set(Utils.uuidToString(data.playerUUID), data);
		});

		this.playerStatesPacket.on("packet", (data) => {
			this.players = data;
		});

		this.addGroupPacket.on("packet", (data) => {
			this.groups.set(Utils.uuidToString(data.id), data);
		});

		this.removeGroupPacket.on("packet", (data) => {
			this.groups.delete(Utils.uuidToString(data.id));
		});

		this.addGroupPacket.on("packet", (data) => {
			this.bot.emit("voicechat_group_add", {
				id: Utils.uuidToString(data.id),
				name: data.name,
				hasPassword: data.hasPassword,
				persistent: data.persistent,
				hidden: data.hidden,
				type: data.type,
			});
		});

		this.removeGroupPacket.on("packet", (data) => {
			this.bot.emit("voicechat_group_remove", {
				id: Utils.uuidToString(data.id),
			});
		});
	}

	getNameBySenderID(senderID: string): string | undefined {
		const player = this.players.get(senderID);
		return player ? player.name : undefined;
	}

	getIdByName(username: string): string | undefined {
		for (const [id, player] of this.players) {
			if (player.name === username) {
				return id;
			}
		}
		return undefined;
	}

	setupSocketEvents() {
		this.socketClient.authenticateAckPacket.on("packet", (_) => {
			this.socketClient.connectionCheckPacket.send({});
		});

		this.socketClient.connectionCheckAckPacket.on("packet", (_) => {
			this.connected = true;

			this.bot.emit("voicechat_connect");
		});

		this.socketClient.clientboundKeepAlivePacket.on("packet", (_) => {
			this.socketClient.serverboundKeepAlivePacket.send({});
		});

		this.socketClient.clientboundPingPacket.on("packet", (_) => {
			this.socketClient.serverboundPingPacket.send({});
		});

		// Sound packets
		this.socketClient.playerSoundPacket.on("packet", (data) => {
			this.bot.emit("voicechat_player_sound", {
				...data,
				channelId: Utils.uuidToString(data.channelId),
				sender: this.getNameBySenderID(Utils.uuidToString(data.sender)),
			});
		});

		this.socketClient.locationSoundPacket.on("packet", (data) => {
			this.bot.emit("voicechat_location_sound", {
				...data,
				channelId: Utils.uuidToString(data.channelId),
				sender: this.getNameBySenderID(Utils.uuidToString(data.sender)),
			});
		});

		this.socketClient.groupSoundPacket.on("packet", (data) => {
			this.bot.emit("voicechat_group_sound", {
				...data,
				channelId: Utils.uuidToString(data.channelId),
				sender: this.getNameBySenderID(Utils.uuidToString(data.sender)),
			});
		});
	}
}
