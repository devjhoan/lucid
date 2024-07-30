import { Presets, SingleBar } from "cli-progress";
import type { QobuzAlbum } from "./types/album";
import { rm } from "node:fs/promises";
import { ApiScraper } from "./lib";
import prompts from "prompts";

const api = new ApiScraper("https://lucida.to");
const urlAnswer = await prompts([
	{
		name: "url",
		type: "text",
		message: "Qobuz url you want to download:",
	},
]);

const qobuzInformation = await api.getQobuzInformation(urlAnswer.url);
if (!qobuzInformation) {
	console.error("Invalid Qobuz url");
	process.exit(1);
}

const removeOldFiles = await prompts([
	{
		name: "removeOldFiles",
		type: "confirm",
		message: "Do you want to remove old files?",
	},
]);

if (removeOldFiles.removeOldFiles) {
	await rm("output", { recursive: true, force: true });
}

if (qobuzInformation?.type === "album") {
	const confirmAnswer = await prompts([
		{
			name: "confirm",
			type: "confirm",
			message: `Do you want to download ${qobuzInformation.title}?`,
		},
	]);

	if (!confirmAnswer.confirm) {
		console.log("Bye 👋");
		process.exit(0);
	}

	await api.downloadAlbum(qobuzInformation);
	console.log("Bye 👋");
}

if (qobuzInformation?.type === "artist") {
	const selectedAlbums = await prompts([
		{
			name: "albumUrls",
			type: "multiselect",
			message: "Select the albums you want to download: ",
			choices: qobuzInformation.albums.map((album) => ({
				title: `${album.title} (${new Date(album.releaseDate).getFullYear()})`,
				value: album.url,
			})),
			instructions: false,
			hint: "- Space to select. Return to submit",
			validate: (value) => value.length > 0,
		},
	]);

	const albumPromises = selectedAlbums.albumUrls.map(
		async (albumUrl: string) => {
			const data = await api.getQobuzInformation(albumUrl);
			if (data?.type === "album") {
				return data;
			}
			return null;
		},
	);

	const albumsData = await Promise.all(albumPromises);
	const fetchedAlbums = albumsData.filter(
		(data): data is QobuzAlbum => data !== null,
	);

	const totalTracks = fetchedAlbums.reduce(
		(total, album) => total + album.tracks.length,
		0,
	);

	const confirmAnswer = await prompts([
		{
			name: "confirm",
			type: "confirm",
			message: `Do you want to download ${totalTracks} tracks?`,
		},
	]);

	if (!confirmAnswer.confirm) {
		console.log("Bye 👋");
		process.exit(0);
	}

	const bar1 = new SingleBar({}, Presets.rect);
	bar1.start(totalTracks, 0);

	for await (const album of fetchedAlbums) {
		await api.downloadAlbum(album, (increment) => {
			bar1.increment(Math.floor(increment / 100));
		});
	}

	bar1.stop();
}
