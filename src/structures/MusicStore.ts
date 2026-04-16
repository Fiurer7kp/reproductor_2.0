import { Song, Playlist } from '../types';
import { DoublyLinkedList } from '../structures/DoublyLinkedList';

export class MusicStore {
  private _queue: DoublyLinkedList<Song>;
  private _playlists: Map<string, { playlist: Playlist; songs: DoublyLinkedList<Song> }>;
  private _currentIndex: number = -1;
  private _allSongs: Map<string, Song>;

  constructor() {
    this._queue = new DoublyLinkedList<Song>();
    this._playlists = new Map();
    this._allSongs = new Map();
  }

  // ─── Queue management ───────────────────────────────────────────────

  get queue(): Song[] {
    return this._queue.toArray();
  }

  get currentIndex(): number {
    return this._currentIndex;
  }

  get currentSong(): Song | null {
    if (this._currentIndex < 0) return null;
    return this._queue.get(this._currentIndex);
  }

  addToQueueFirst(song: Song): void {
    this._allSongs.set(song.id, song);
    this._queue.addFirst(song);
    if (this._currentIndex >= 0) this._currentIndex++;
  }

  addToQueueLast(song: Song): void {
    this._allSongs.set(song.id, song);
    this._queue.addLast(song);
  }

  addToQueueAt(index: number, song: Song): void {
    this._allSongs.set(song.id, song);
    this._queue.addAt(index, song);
    if (index <= this._currentIndex) this._currentIndex++;
  }

  removeFromQueue(index: number): void {
    this._queue.removeAt(index);
    if (index < this._currentIndex) {
      this._currentIndex--;
    } else if (index === this._currentIndex) {
      this._currentIndex = Math.min(this._currentIndex, this._queue.size - 1);
    }
  }

  setCurrentIndex(index: number): void {
    if (index >= 0 && index < this._queue.size) {
      this._currentIndex = index;
    }
  }

  nextSong(shuffle: boolean = false): Song | null {
    if (this._queue.isEmpty) return null;
    if (shuffle) {
      this._currentIndex = Math.floor(Math.random() * this._queue.size);
    } else {
      this._currentIndex = (this._currentIndex + 1) % this._queue.size;
    }
    return this._queue.get(this._currentIndex);
  }

  previousSong(): Song | null {
    if (this._queue.isEmpty) return null;
    this._currentIndex = this._currentIndex <= 0
      ? this._queue.size - 1
      : this._currentIndex - 1;
    return this._queue.get(this._currentIndex);
  }

  moveForward(index: number): boolean {
    const moved = this._queue.moveForward(index);
    if (moved && index === this._currentIndex) this._currentIndex--;
    else if (moved && index - 1 === this._currentIndex) this._currentIndex++;
    return moved;
  }

  moveBackward(index: number): boolean {
    const moved = this._queue.moveBackward(index);
    if (moved && index === this._currentIndex) this._currentIndex++;
    else if (moved && index + 1 === this._currentIndex) this._currentIndex--;
    return moved;
  }

  shuffleQueue(): void {
    const current = this.currentSong;
    this._queue.shuffle();
    if (current) {
      this._currentIndex = this._queue.indexOf(s => s.id === current.id);
    }
  }

  clearQueue(): void {
    this._queue.clear();
    this._currentIndex = -1;
  }

  // ─── Playlist management ─────────────────────────────────────────────

  createPlaylist(name: string, description?: string): Playlist {
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date(),
      songIds: [],
    };
    this._playlists.set(playlist.id, {
      playlist,
      songs: new DoublyLinkedList<Song>(),
    });
    return playlist;
  }

  getPlaylists(): Playlist[] {
    return Array.from(this._playlists.values()).map(p => ({
      ...p.playlist,
      songIds: p.songs.toArray().map(s => s.id),
    }));
  }

  getPlaylistSongs(playlistId: string): Song[] {
    return this._playlists.get(playlistId)?.songs.toArray() ?? [];
  }

  addSongToPlaylist(playlistId: string, song: Song): void {
    const entry = this._playlists.get(playlistId);
    if (!entry) return;
    this._allSongs.set(song.id, song);
    entry.songs.addLast(song);
    entry.playlist.songIds.push(song.id);
  }

  removeSongFromPlaylist(playlistId: string, songId: string): void {
    const entry = this._playlists.get(playlistId);
    if (!entry) return;
    entry.songs.removeWhere(s => s.id === songId);
    entry.playlist.songIds = entry.playlist.songIds.filter(id => id !== songId);
  }

  deletePlaylist(playlistId: string): void {
    this._playlists.delete(playlistId);
  }

  renamePlaylist(playlistId: string, newName: string): void {
    const entry = this._playlists.get(playlistId);
    if (entry) entry.playlist.name = newName;
  }

  loadPlaylistToQueue(playlistId: string): void {
    const entry = this._playlists.get(playlistId);
    if (!entry) return;
    this.clearQueue();
    entry.songs.toArray().forEach(song => this._queue.addLast(song));
    this._currentIndex = this._queue.isEmpty ? -1 : 0;
  }

  getSong(id: string): Song | undefined {
    return this._allSongs.get(id);
  }

  getAllSongs(): Song[] {
    return Array.from(this._allSongs.values());
  }
}

// Singleton
export const musicStore = new MusicStore();