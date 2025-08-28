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

// Интерфейс для пакетов
interface PacketRegistry {
	requestSecretPacket: ServerboundRequestSecretPacket;
	secretPacket: ClientboundSecretPacket;
	playerStatePacket: ClientboundPlayerStatePacket;
	playerStatesPacket: ClientboundPlayerStatesPacket;
	addGroupPacket: ClientboundAddGroupPacket;
	setGroupPacket: ServerboundSetGroupPacket;
	removeGroupPacket: ClientboundRemoveGroupPacket;
	leaveGroupPacket: ServerboundLeaveGroupPacket;
	joinedGroupPacket: ClientboundJoinedGroupPacket;
}

export default class VoiceChatClient {
	private readonly bot: Bot;
	private readonly compatibilityVersion: number = 18;
	private readonly socketClient: SimpleVoiceSocketClient;
	private readonly logger = log.getSubLogger({ name: "VoiceClient" });
	private readonly packets: PacketRegistry;
	private connected: boolean = false;
	private players: Map<string, ClientboundPlayerStatePacketData> = new Map();
	private groups: Map<string, ClientboundAddGroupPacketData> = new Map();

	constructor(bot: Bot) {
		this.bot = bot;
		this.socketClient = new SimpleVoiceSocketClient(bot);
		this.logger.debug("Initializing SimpleVoiceClient");

		this.packets = this.initializePackets();
		this.setupEvents();
	}

	public getSocketClient(): SimpleVoiceSocketClient {
		return this.socketClient;
	}

	public isConnected(): boolean {
		return this.connected;
	}

	public getPlayers(): Map<string, ClientboundPlayerStatePacketData> {
		return this.players;
	}

	public getGroups(): Map<string, ClientboundAddGroupPacketData> {
		return this.groups;
	}

	public getNameBySenderID(senderID: string): string | undefined {
		const player = this.players.get(senderID);
		return player?.name;
	}

	public getIdByName(username: string): string | undefined {
		for (const [id, player] of this.players) {
			if (player.name === username) {
				return id;
			}
		}
		return undefined;
	}

	private initializePackets(): PacketRegistry {
		return {
			requestSecretPacket: new ServerboundRequestSecretPacket(this.bot),
			secretPacket: new ClientboundSecretPacket(this.bot),
			playerStatePacket: new ClientboundPlayerStatePacket(this.bot),
			playerStatesPacket: new ClientboundPlayerStatesPacket(this.bot),
			addGroupPacket: new ClientboundAddGroupPacket(this.bot),
			setGroupPacket: new ServerboundSetGroupPacket(this.bot),
			removeGroupPacket: new ClientboundRemoveGroupPacket(this.bot),
			leaveGroupPacket: new ServerboundLeaveGroupPacket(this.bot),
			joinedGroupPacket: new ClientboundJoinedGroupPacket(this.bot),
		};
	}

	public getPackets() {
		return this.packets;
	}

	private registerChannels(): void {
		this.logger.debug("Registering channels");

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

	private setupEvents(): void {
		this.bot.once("login", () => {
			this.registerChannels();
		});

		this.bot.on("spawn", () => {
			this.packets.requestSecretPacket.send({
				compatibilityVersion: this.compatibilityVersion,
			});
		});

		this.packets.secretPacket.on("packet", (data) => {
			this.connected = false;
			this.players.clear();
			this.groups.clear();
			StoredData.secretPacketData = data;

			this.socketClient.connect();
			this.socketClient.on("connect", () => {
				this.logger.debug(
					"Connected to socket, sending authentication",
				);

				this.setupSocketEvents();

				this.socketClient.getPackets().authenticatePacket.send({
					playerUUID: StoredData.secretPacketData.playerUUID,
					secret: StoredData.secretPacketData.secret,
				});
			});
		});

		this.packets.playerStatePacket.on("packet", (data) => {
			this.players.set(Utils.uuidToString(data.playerUUID), data);
		});

		this.packets.playerStatesPacket.on("packet", (data) => {
			this.players = data;
		});

		this.packets.addGroupPacket.on("packet", (data) => {
			const groupId = Utils.uuidToString(data.id);
			this.groups.set(groupId, data);
			this.bot.emit("voicechat_group_add", {
				id: groupId,
				name: data.name,
				hasPassword: data.hasPassword,
				persistent: data.persistent,
				hidden: data.hidden,
				type: data.type,
			});
		});

		this.packets.removeGroupPacket.on("packet", (data) => {
			const groupId = Utils.uuidToString(data.id);
			this.groups.delete(groupId);
			this.bot.emit("voicechat_group_remove", { id: groupId });
		});
	}

	private setupSocketEvents(): void {
		const socketPackets = this.socketClient.getPackets();
		if (!socketPackets) {
			this.logger.error("Socket packets not initialized");
			return;
		}

		socketPackets.authenticateAckPacket.on("packet", () => {
			socketPackets.connectionCheckPacket.send({});
		});

		socketPackets.connectionCheckAckPacket.on("packet", () => {
			this.connected = true;
			this.bot.emit("voicechat_connect");
		});

		socketPackets.clientboundKeepAlivePacket.on("packet", () => {
			socketPackets.serverboundKeepAlivePacket.send({});
		});

		socketPackets.clientboundPingPacket.on("packet", () => {
			socketPackets.serverboundPingPacket.send({});
		});

		socketPackets.playerSoundPacket.on("packet", (data) => {
			this.bot.emit("voicechat_player_sound", {
				...data,
				channelId: Utils.uuidToString(data.channelId),
				sender: this.getNameBySenderID(Utils.uuidToString(data.sender)),
			});
		});

		socketPackets.locationSoundPacket.on("packet", (data) => {
			this.bot.emit("voicechat_location_sound", {
				...data,
				channelId: Utils.uuidToString(data.channelId),
				sender: this.getNameBySenderID(Utils.uuidToString(data.sender)),
			});
		});

		socketPackets.groupSoundPacket.on("packet", (data) => {
			this.bot.emit("voicechat_group_sound", {
				...data,
				channelId: Utils.uuidToString(data.channelId),
				sender: this.getNameBySenderID(Utils.uuidToString(data.sender)),
			});
		});
	}
}
