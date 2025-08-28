import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export default class SoundConverter {
	static convertToPCM(
		name: string,
		sampleRate: number,
		channels: number,
	): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			let chunks: Uint8Array[] = [];

			const ffmpegCommand = ffmpeg(name)
				.audioCodec("pcm_s16le")
				.format("s16le")
				.audioChannels(channels)
				.audioFrequency(sampleRate)
				.audioFilters("aresample=48000")
				.on("error", reject);

			const audioStream = ffmpegCommand.pipe();

			audioStream.on("data", (chunk) => {
				chunks.push(chunk);
			});

			audioStream.on("end", () => {
				let outputBuffer = Buffer.concat(chunks);
				resolve(outputBuffer);
			});
		});
	}
}
