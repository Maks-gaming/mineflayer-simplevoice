import { Bot } from "mineflayer";
import VoiceChat, { log } from "./lib";

/** The function for changing the logging level, by default - 4, and these are warnings, errors and fatal */
export function setLoggingLevel(level: number = 4) {
	log.settings.minLevel = level;
}

export function plugin(bot: Bot) {
	bot.voicechat = new VoiceChat(bot);
}

export * from "./lib";

export default {
	plugin,
	setLoggingLevel,
};

declare module "mineflayer" {
	interface Bot {
		voicechat: VoiceChat;
	}
	interface BotEvents {
		voicechat_location_sound: (data: {
			channelId: string;
			sender?: string;
			data: Buffer;
			sequenceNumber: BigInt;
			distance: number;
			category?: string;
		}) => void;
		voicechat_location_sound_end: (data: {
			channelId: string;
			sender?: string;
			sequenceNumber: BigInt;
			distance: number;
			category?: string;
		}) => void;
		voicechat_player_sound: (data: {
			channelId: string;
			sender?: string;
			data: Buffer;
			sequenceNumber: BigInt;
			distance: number;
			whispering: boolean;
			category?: string;
		}) => void;
		voicechat_player_sound_end: (data: {
			channelId: string;
			sender?: string;
			sequenceNumber: BigInt;
			distance: number;
			whispering: boolean;
			category?: string;
		}) => void;
		voicechat_group_sound: (data: {
			channelId: string;
			sender?: string;
			data: Buffer;
			sequenceNumber: BigInt;
			category?: string;
		}) => void;
		voicechat_group_sound_end: (data: {
			channelId: string;
			sender?: string;
			sequenceNumber: BigInt;
			category?: string;
		}) => void;
		voicechat_connect: () => void;
		voicechat_group_add: (data: {
			id: string;
			name: string;
			hasPassword: boolean;
			persistent: boolean;
			hidden: boolean;
			type: number;
		}) => void;
		voicechat_group_remove: (data: { id: string }) => void;
	}
}
