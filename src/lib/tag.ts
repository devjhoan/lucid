import type { QobuzAlbum, Track } from "../types/album";
import { writeFlacTags } from "flac-tagger";

export async function writeCommonTags({
	track,
	album,
	filePath,
	albumArtworkBuffer,
}: {
	track: Track;
	album: QobuzAlbum;
	filePath: string;
	albumArtworkBuffer: Buffer;
}) {
	const tagMap = {
		ALBUM: album.title.trim(),
		ALBUMARTIST: album.artists.map((artist) => artist.name.trim()).join("; "),
		ARTIST:
			album.tracks.length === 1
				? album.artists.map((artist) => artist.name.trim()).join("; ")
				: track.artists.map((artist) => artist.name.trim()).join("; "),
		COPYRIGHT: album.copyright.trim(),
		ISRC: track.isrc.trim(),
		PUBLISHER: album.label.trim(),
		TITLE: track.title.trim(),
		TRACK: `${track.trackNumber}`.padStart(2, "0"),
		YEAR: String(new Date(album.releaseDate).getFullYear()),
	};

	await writeFlacTags(
		{
			tagMap,
			picture: {
				buffer: albumArtworkBuffer,
			},
		},
		filePath,
	);
}
