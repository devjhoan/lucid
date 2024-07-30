export interface QobuzArtist {
	id: string;
	url: string;
	name: string;
	albums: Album[];
	type: "artist";
	success: boolean;
	stats: Stats;
	fromServer: boolean;
	fromServerName: string;
}

export interface Album {
	title: string;
	id: string;
	url: string;
	coverArtwork: CoverArtwork[];
	artists: ArtistElement[];
	upc: string;
	releaseDate: Date;
	label: string;
	genre: string[];
}

export interface ArtistElement {
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
