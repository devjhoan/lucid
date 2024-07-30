export interface QobuzAlbum {
	title: string;
	id: string;
	url: string;
	coverArtwork: CoverArtwork[];
	artists: Artist[];
	upc: string;
	releaseDate: Date;
	copyright: string;
	label: string;
	genre: string[];
	tracks: Track[];
	type: "album";
	success: boolean;
	stats: Stats;
	fromServer: boolean;
	fromServerName: string;
}

export interface Artist {
	id: string;
	url: string;
	name: string;
}

export interface CoverArtwork {
	url: string;
	width: number;
	height: number;
}

export interface Stats {
	account: string;
	service: string;
}

export interface Track {
	title: string;
	id: string;
	url: string;
	copyright: string;
	artists: Artist[];
	durationMs: number;
	explicit: boolean;
	isrc: string;
	genres: [];
	trackNumber: number;
	discNumber: number;
	producers: string[];
	composers: string[];
	lyricists: [];
	performers: [];
	engineers: string[];
}
