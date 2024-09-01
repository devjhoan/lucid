import type { QobuzAlbum, Track } from "../types/album";
import { mkdir, writeFile } from "node:fs/promises";
import type { QobuzArtist } from "../types/artist";
import { createWriteStream } from "node:fs";
import { writeCommonTags } from "./tag";
import { join } from "node:path";
import { load } from "cheerio";
import axios from "axios";

type QobuzResponse = QobuzAlbum | QobuzArtist;

export class ApiScraper {
	private url: string;

	constructor(url: string) {
		this.url = url.endsWith("/") ? url.slice(0, -1) : url;
	}

	async getQobuzInformation(url: string) {
		const response = await fetch(`${this.url}/?url=${url}`);
		const html = await response.text();

		const $ = load(html);

		const scriptContent = $("script")
			.get()
			.map((script) => $(script).html())
			.find((content) => content?.includes("const data ="));

		if (scriptContent) {
			const dataRegex = /const data = (\[.*?\]);/s;
			const match = dataRegex.exec(scriptContent);

			if (match?.[0]) {
				// TODO!: Quitar el eval
				const payloadString = match[0]
					.replaceAll("const data = ", "")
					.replaceAll("null,", "")
					.replaceAll(/\n/g, "")
					.replaceAll(/\t/g, "")
					.replaceAll(/\s{2,}/g, " ")
					.replaceAll(
						/,selectedCountry:token:"album"/g,
						',selectedCountry:"US",token:"album"',
					)
					.replaceAll(/;/g, "")
					.trim();

				// biome-ignore lint/security/noGlobalEval: no encuentro otra manera de hacerlo
				const data = eval(payloadString)[0];

				const albumInformation = data.data.info as QobuzResponse;
				return albumInformation;
			}
		}

		return null;
	}

	async downloadAlbum(
		album: QobuzAlbum,
		callback?: (increment: number) => void,
	) {
		const outputDir = join(
			process.cwd(),
			"output",
			`${album.title.replaceAll("/", "-").trim()} (${new Date(album.releaseDate).getFullYear()})`,
		);

		await mkdir(join(outputDir), {
			recursive: true,
		});

		const albumArtworkResponse = await axios.get(
			album.coverArtwork.reverse()[0].url.replace("_600", "_org"),
			{
				responseType: "arraybuffer",
			},
		);

		const albumArtworkBuffer = Buffer.from(albumArtworkResponse.data);
		await writeFile(join(outputDir, "cover.jpg"), albumArtworkBuffer);

		const downloadPromises = album.tracks.map((track) =>
			this.downloadFile({
				albumArtworkBuffer,
				outputDir,
				callback,
				track,
				album,
			}),
		);

		await Promise.all(downloadPromises);
	}

	async downloadFile({
		track,
		outputDir,
		callback,
		albumArtworkBuffer,
		album,
	}: {
		track: Track;
		outputDir: string;
		album: QobuzAlbum;
		albumArtworkBuffer: Buffer;
		callback?: (progress: number) => void;
	}) {
		try {
			const url = `https://hund.lucida.to/api/fetch/stream?url=${track.url}&meta=true&downscale=original&album=true&private=false&country=US&csrf=${track.csrf}`;
			const response = await axios.get(url, { responseType: "stream" });

			const totalLength = response.headers["content-length"];

			const extension = response.headers["x-download-extension"] || "flac";
			const filename =
				`${String(track.trackNumber).padStart(2, "0")}. ${track.title}.${extension}`
					.replaceAll(/\//g, " ")
					.replaceAll(/"/g, "'");

			const filePath = join(outputDir, filename);

			let downloaded = 0;
			return new Promise<string>((resolve, reject) => {
				const writer = createWriteStream(filePath);
				response.data.pipe(writer);

				response.data.on("data", (chunk: Array<unknown>) => {
					downloaded += chunk.length;
					if (totalLength && callback) {
						const progress = (downloaded / parseInt(totalLength)) * 100;
						callback(progress);
					}
				});

				writer.on("finish", async () => {
					if (callback) callback(100);
					writeCommonTags({
						album,
						filePath,
						track,
						albumArtworkBuffer,
					});
					resolve(filePath);
				});

				writer.on("error", reject);
			});
		} catch (error) {
			console.error("Error downloading file:", error);
			throw error;
		}
	}
}
