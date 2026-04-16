export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  source: 'youtube' | 'local';
  youtubeId?: string;
  localUrl?: string;
  color?: string;
  cover?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  songIds: string[];
}
