import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, ListMusic, Upload, Search,
  Plus, Trash2, ChevronUp, ChevronDown, Music, Youtube,
  X, Check, Edit3, PlayCircle, Heart, Mic2
} from 'lucide-react';
import { Song, Playlist } from './types';
import { musicStore } from './structures/MusicStore';
import { useTranslation } from './hooks/useTranslation';
import './App.css';

// ─── Utilities ──────────────────────────────────────────────────────────────

const formatTime = (s: number): string => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const generateId = (): string => crypto.randomUUID();

// Función para convertir duración de YouTube (ISO 8601 a segundos)
function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match?.[1] ? parseInt(match[1]) : 0);
  const minutes = (match?.[2] ? parseInt(match[2]) : 0);
  const seconds = (match?.[3] ? parseInt(match[3]) : 0);
  return hours * 3600 + minutes * 60 + seconds;
}

const DEMO_SONGS: Song[] = [
  {
    id: generateId(), title: 'Blinding Lights', artist: 'The Weeknd',
    album: 'After Hours', duration: 200, source: 'youtube',
    youtubeId: 'XXYlFuWEuKI', color: '#ff3b5c',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36'
  },
  {
    id: generateId(), title: 'As It Was', artist: 'Harry Styles',
    album: "Harry's House", duration: 167, source: 'youtube',
    youtubeId: 'H5v3kku4y6Q', color: '#1db954',
    cover: 'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14'
  },
  {
    id: generateId(), title: 'Stay', artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3', duration: 141, source: 'youtube',
    youtubeId: 'kTJczUoc26U', color: '#7c3aed',
    cover: 'https://i.scdn.co/image/ab67616d0000b2737e89bd9f4f38b953f4fdbf72'
  },
];

// Populate demo
DEMO_SONGS.forEach(s => musicStore.addToQueueLast(s));
const demoPlaylist = musicStore.createPlaylist('Mis Favoritas', 'Las mejores canciones 🔥');
DEMO_SONGS.forEach(s => musicStore.addSongToPlaylist(demoPlaylist.id, s));

// ─── YouTube Player ──────────────────────────────────────────────────────────

interface YTPlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  onTimeUpdate?: (t: number, d: number) => void;
  onEnded?: () => void;
  volume: number;
}

function YouTubePlayer({ videoId, isPlaying, onTimeUpdate, onEnded, volume }: YTPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<number>(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadAPI = () => {
      if ((window as any).YT?.Player) {
        initPlayer();
        return;
      }
      if (!(window as any).onYouTubeIframeAPIReady) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = () => initPlayer();
    };

    const initPlayer = () => {
      if (!containerRef.current) return;
      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        height: '1',
        width: '1',
        videoId: videoId ?? '',
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            if (e.data === 0) onEnded?.();
          },
        },
      });
    };

    loadAPI();
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (videoId) playerRef.current.loadVideoById(videoId);
  }, [videoId, ready]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (isPlaying) {
      playerRef.current.playVideo();
      timerRef.current = setInterval(() => {
        const t = playerRef.current?.getCurrentTime?.() ?? 0;
        const d = playerRef.current?.getDuration?.() ?? 0;
        onTimeUpdate?.(t, d);
      }, 500) as unknown as number;
    } else {
      playerRef.current.pauseVideo();
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, ready]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    playerRef.current.setVolume(volume * 100);
  }, [volume, ready]);

  return <div ref={containerRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />;
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  // Player state
  const [queue, setQueue] = useState<Song[]>(musicStore.queue);
  const [currentSong, setCurrentSong] = useState<Song | null>(musicStore.currentSong);
  const [currentIndex, setCurrentIndex] = useState(musicStore.currentIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');
  const [liked, setLiked] = useState<Set<string>>(new Set());

  // UI state
  const [activeTab, setActiveTab] = useState<'queue' | 'library' | 'search'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState<'youtube' | 'spotify'>('youtube');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>(musicStore.getPlaylists());
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Add song modal
  const [showAddSong, setShowAddSong] = useState(false);
  const [addPosition, setAddPosition] = useState<'first' | 'last' | number>('last');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongYtId, setNewSongYtId] = useState('');

  // Theme state (modo oscuro/claro)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Translation hook (idioma)
  const { t, language, toggleLanguage } = useTranslation();

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshQueue = useCallback(() => {
    setQueue([...musicStore.queue]);
    setCurrentSong(musicStore.currentSong);
    setCurrentIndex(musicStore.currentIndex);
  }, []);

  const refreshPlaylists = useCallback(() => {
    setPlaylists(musicStore.getPlaylists());
  }, []);

  // Theme effect - aplica el tema al DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // ─── Playback ─────────────────────────────────────────────────────────

  const playSongAt = (index: number) => {
    musicStore.setCurrentIndex(index);
    refreshQueue();
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleNext = useCallback(() => {
    if (repeat === 'one') { setCurrentTime(0); return; }
    musicStore.nextSong(shuffle);
    refreshQueue();
    setCurrentTime(0);
    setIsPlaying(true);
  }, [repeat, shuffle, refreshQueue]);

  const handlePrev = () => {
    if (currentTime > 3) { setCurrentTime(0); return; }
    musicStore.previousSong();
    refreshQueue();
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    if (repeat === 'one') { setCurrentTime(0); setIsPlaying(true); return; }
    if (repeat === 'all' || currentIndex < queue.length - 1) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  // Local audio handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentSong?.source !== 'local') return;
    audio.src = currentSong.localUrl ?? '';
    if (isPlaying) audio.play();
    else audio.pause();
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentSong?.source !== 'local') return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, currentSong?.source]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // ─── File Upload ───────────────────────────────────────────────────────

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('audio/')) return;
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        const song: Song = {
          id: generateId(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Artista Desconocido',
          duration: audio.duration,
          source: 'local',
          localUrl: url,
          color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
        };
        musicStore.addToQueueLast(song);
        refreshQueue();
      };
    });
  };

  // ─── YouTube search (REAL con API) ─────────────────────────────────────

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    // Extract YouTube video ID from URL if pasted
    const ytUrlMatch = searchQuery.match(/(?:v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (ytUrlMatch) {
      const videoId = ytUrlMatch[1];
      try {
        const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (!API_KEY) {
          console.warn("YouTube API Key no configurada");
          const song: Song = {
            id: generateId(),
            title: 'Video de YouTube',
            artist: 'YouTube',
            duration: 0,
            source: 'youtube',
            youtubeId: videoId,
            color: '#ff0000',
            cover: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          };
          setSearchResults([song]);
          setIsSearching(false);
          return;
        }
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`);
        const data = await res.json();
        if (data.items && data.items[0]) {
          const item = data.items[0];
          const duration = parseYouTubeDuration(item.contentDetails.duration);
          const song: Song = {
            id: generateId(),
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            duration: duration,
            source: 'youtube',
            youtubeId: videoId,
            color: '#ff0000',
            cover: item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          };
          setSearchResults([song]);
        }
      } catch (err) {
        console.error("Error fetching video:", err);
      }
      setIsSearching(false);
      return;
    }

    // Search YouTube API
    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!API_KEY) {
        console.warn("YouTube API Key no configurada - usando resultados simulados");
        await new Promise(r => setTimeout(r, 800));
        const mockResults: Song[] = [
          {
            id: generateId(), title: `${searchQuery} - Result 1`,
            artist: 'YouTube', duration: 210, source: 'youtube',
            youtubeId: 'dQw4w9WgXcQ', color: '#ff0000',
            cover: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
          },
          {
            id: generateId(), title: `${searchQuery} - Result 2`,
            artist: 'YouTube', duration: 185, source: 'youtube',
            youtubeId: 'XXYlFuWEuKI', color: '#ff3b5c',
            cover: `https://img.youtube.com/vi/XXYlFuWEuKI/mqdefault.jpg`,
          },
        ];
        setSearchResults(mockResults);
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(searchQuery)}&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
        const durationRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
        );
        const durationData = await durationRes.json();
        const durationMap = new Map();
        durationData.items?.forEach((item: any) => {
          durationMap.set(item.id, parseYouTubeDuration(item.contentDetails.duration));
        });

        const results: Song[] = data.items.map((item: any) => ({
          id: generateId(),
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          duration: durationMap.get(item.id.videoId) || 180,
          source: 'youtube',
          youtubeId: item.id.videoId,
          color: '#ff0000',
          cover: item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
        }));
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching YouTube:", error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // ─── Queue controls ────────────────────────────────────────────────────

  const addSongToQueue = () => {
    if (!newSongTitle.trim()) return;
    const song: Song = {
      id: generateId(),
      title: newSongTitle,
      artist: newSongArtist || 'Desconocido',
      duration: 0,
      source: newSongYtId ? 'youtube' : 'local',
      youtubeId: newSongYtId || undefined,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    };
    if (addPosition === 'first') musicStore.addToQueueFirst(song);
    else if (addPosition === 'last') musicStore.addToQueueLast(song);
    else musicStore.addToQueueAt(addPosition as number, song);
    refreshQueue();
    setShowAddSong(false);
    setNewSongTitle(''); setNewSongArtist(''); setNewSongYtId('');
  };

  const moveUp = (index: number) => {
    musicStore.moveForward(index);
    refreshQueue();
  };

  const moveDown = (index: number) => {
    musicStore.moveBackward(index);
    refreshQueue();
  };

  const removeFromQueue = (index: number) => {
    musicStore.removeFromQueue(index);
    refreshQueue();
  };

  // ─── Playlist controls ─────────────────────────────────────────────────

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    musicStore.createPlaylist(newPlaylistName);
    refreshPlaylists();
    setNewPlaylistName('');
    setShowCreatePlaylist(false);
  };

  const loadPlaylist = (id: string) => {
    musicStore.loadPlaylistToQueue(id);
    refreshQueue();
    setActivePlaylist(id);
    setActiveTab('queue');
    setIsPlaying(true);
  };

  const deletePlaylist = (id: string) => {
    musicStore.deletePlaylist(id);
    refreshPlaylists();
    if (activePlaylist === id) setActivePlaylist(null);
  };

  const renamePlaylist = (id: string) => {
    musicStore.renamePlaylist(id, playlistName);
    refreshPlaylists();
    setEditingPlaylist(null);
    setPlaylistName('');
  };

  const toggleLike = (id: string) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  const accentColor = currentSong?.color ?? '#1db954';
  const playlistSongs = activePlaylist ? musicStore.getPlaylistSongs(activePlaylist) : [];

  return (
    <div className="app" style={{ '--accent': accentColor } as React.CSSProperties}>
      {/* Hidden audio for local files */}
      <audio
        ref={audioRef}
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />

      {/* YouTube Player (hidden) */}
      {currentSong?.source === 'youtube' && (
        <YouTubePlayer
          videoId={currentSong.youtubeId ?? null}
          isPlaying={isPlaying}
          volume={isMuted ? 0 : volume}
          onTimeUpdate={(t, d) => { setCurrentTime(t); setDuration(d); }}
          onEnded={handleEnded}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Mic2 size={28} />
          <span>SoundWave</span>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}>
            <ListMusic size={20} /> Cola de reproducción
          </button>
          <button className={`nav-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}>
            <Music size={20} /> Mi Biblioteca
          </button>
          <button className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}>
            <Search size={20} /> Buscar
          </button>
        </nav>

        <div className="sidebar-section">
          <div className="section-header">
            <span>MIS PLAYLISTS</span>
            <button className="icon-btn" onClick={() => setShowCreatePlaylist(true)} title="Nueva playlist">
              <Plus size={18} />
            </button>
          </div>

          {showCreatePlaylist && (
            <div className="inline-form">
              <input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)}
                placeholder="Nombre de playlist..." onKeyDown={e => e.key === 'Enter' && createPlaylist()} autoFocus />
              <button onClick={createPlaylist}><Check size={14} /></button>
              <button onClick={() => setShowCreatePlaylist(false)}><X size={14} /></button>
            </div>
          )}

          <div className="playlist-list">
            {playlists.map(pl => (
              <div key={pl.id} className={`playlist-item ${activePlaylist === pl.id ? 'active' : ''}`}>
                {editingPlaylist === pl.id ? (
                  <div className="inline-form">
                    <input value={playlistName} onChange={e => setPlaylistName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && renamePlaylist(pl.id)} autoFocus />
                    <button onClick={() => renamePlaylist(pl.id)}><Check size={12} /></button>
                  </div>
                ) : (
                  <>
                    <button className="playlist-name" onClick={() => {
                      setActivePlaylist(activePlaylist === pl.id ? null : pl.id);
                      setActiveTab('library');
                    }}>
                      <span className="pl-dot" style={{ background: accentColor }} />
                      {pl.name}
                    </button>
                    <div className="pl-actions">
                      <button onClick={() => loadPlaylist(pl.id)} title="Reproducir"><PlayCircle size={13} /></button>
                      <button onClick={() => { setEditingPlaylist(pl.id); setPlaylistName(pl.name); }} title="Renombrar"><Edit3 size={13} /></button>
                      <button onClick={() => deletePlaylist(pl.id)} title="Eliminar"><Trash2 size={13} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botones de tema e idioma */}
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>

        <button className="lang-toggle-btn" onClick={toggleLanguage}>
          {language === 'es' ? '🇬🇧 English' : '🇪🇸 Español'}
        </button>
      </aside>

      {/* ── Main Panel ── */}
      <main className="main-panel">

        {/* Header gradient */}
        <div className="panel-header" style={{ background: `linear-gradient(180deg, ${accentColor}44 0%, transparent 100%)` }}>
          <h1 className="panel-title">
            {activeTab === 'queue' && 'Cola de Reproducción'}
            {activeTab === 'library' && (activePlaylist ? playlists.find(p => p.id === activePlaylist)?.name : 'Mi Biblioteca')}
            {activeTab === 'search' && 'Buscar música'}
          </h1>

          <div className="header-actions">
            {activeTab === 'queue' && (
              <>
                <button className="action-btn" onClick={() => setShowAddSong(true)}>
                  <Plus size={16} /> Agregar canción
                </button>
                <label className="action-btn upload-btn">
                  <Upload size={16} /> Subir archivo
                  <input ref={fileInputRef} type="file" accept="audio/*" multiple hidden
                    onChange={e => e.target.files && handleFileUpload(e.target.files)} />
                </label>
              </>
            )}
          </div>
        </div>

        {/* ── Search Tab ── */}
        {activeTab === 'search' && (
          <div className="tab-content">
            <div className="search-bar">
              <div className="source-toggle">
                <button className={searchSource === 'youtube' ? 'active' : ''} onClick={() => setSearchSource('youtube')}>
                  <Youtube size={16} /> YouTube
                </button>
                <button className={searchSource === 'spotify' ? 'active' : ''} onClick={() => setSearchSource('spotify')}>
                  🎵 Spotify
                </button>
              </div>
              <div className="search-input">
                <Search size={18} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={searchSource === 'youtube' ? 'Buscar en YouTube o pegar URL...' : 'Buscar en Spotify...'} />
                <button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? '...' : 'Buscar'}
                </button>
              </div>
            </div>

            <div className="search-hint">
              💡 Pega una URL de YouTube directamente para añadir ese video, o escribe para buscar.
            </div>

            <div className="song-list">
              {searchResults.map((song, i) => (
                <div key={song.id} className="song-row search-result">
                  <span className="row-num">{i + 1}</span>
                  {song.cover && <img src={song.cover} alt="" className="song-cover" />}
                  <div className="song-meta">
                    <span className="song-title">{song.title}</span>
                    <span className="song-artist">{song.artist}</span>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => { musicStore.addToQueueLast(song); refreshQueue(); }}>
                      <Plus size={16} /> Cola
                    </button>
                    {playlists.map(pl => (
                      <button key={pl.id} onClick={() => {
                        musicStore.addSongToPlaylist(pl.id, song);
                        refreshPlaylists();
                      }}>
                        + {pl.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Library Tab ── */}
        {activeTab === 'library' && (
          <div className="tab-content">
            {activePlaylist ? (
              <>
                <div className="playlist-header">
                  <div className="playlist-cover" style={{ background: `linear-gradient(135deg, ${accentColor}, #000)` }}>
                    <Music size={40} />
                  </div>
                  <div>
                    <p className="pl-label">PLAYLIST</p>
                    <h2>{playlists.find(p => p.id === activePlaylist)?.name}</h2>
                    <p className="pl-sub">{playlistSongs.length} canciones</p>
                    <button className="play-all-btn" style={{ background: accentColor }}
                      onClick={() => loadPlaylist(activePlaylist!)}>
                      <Play size={18} fill="white" /> Reproducir todo
                    </button>
                  </div>
                </div>
                <div className="song-list">
                  {playlistSongs.map((song, i) => (
                    <div key={song.id} className={`song-row ${currentSong?.id === song.id ? 'playing' : ''}`}
                      onDoubleClick={() => { musicStore.loadPlaylistToQueue(activePlaylist!); playSongAt(i); }}>
                      <span className="row-num">{currentSong?.id === song.id ? <Pause size={14} /> : i + 1}</span>
                      <div className="song-dot" style={{ background: song.color ?? accentColor }} />
                      <div className="song-meta">
                        <span className="song-title">{song.title}</span>
                        <span className="song-artist">{song.artist}</span>
                      </div>
                      <span className="song-duration">{formatTime(song.duration)}</span>
                      <button className={`like-btn ${liked.has(song.id) ? 'liked' : ''}`}
                        onClick={() => toggleLike(song.id)}>
                        <Heart size={15} fill={liked.has(song.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button className="row-del" onClick={() => {
                        musicStore.removeSongFromPlaylist(activePlaylist!, song.id);
                        refreshPlaylists();
                      }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="library-grid">
                {playlists.map(pl => (
                  <div key={pl.id} className="library-card" onClick={() => setActivePlaylist(pl.id)}>
                    <div className="card-cover" style={{ background: `linear-gradient(135deg, ${accentColor}88, #111)` }}>
                      <Music size={32} />
                      <button className="card-play" style={{ background: accentColor }}
                        onClick={e => { e.stopPropagation(); loadPlaylist(pl.id); }}>
                        <Play size={20} fill="white" />
                      </button>
                    </div>
                    <p className="card-name">{pl.name}</p>
                    <p className="card-sub">{musicStore.getPlaylistSongs(pl.id).length} canciones</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Queue Tab ── */}
        {activeTab === 'queue' && (
          <div className="tab-content">
            {/* Add Song Modal */}
            {showAddSong && (
              <div className="modal-overlay" onClick={() => setShowAddSong(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Agregar canción</h3>
                    <button onClick={() => setShowAddSong(false)}><X size={20} /></button>
                  </div>
                  <input placeholder="Título *" value={newSongTitle} onChange={e => setNewSongTitle(e.target.value)} />
                  <input placeholder="Artista" value={newSongArtist} onChange={e => setNewSongArtist(e.target.value)} />
                  <input placeholder="YouTube Video ID (ej: dQw4w9WgXcQ)" value={newSongYtId} onChange={e => setNewSongYtId(e.target.value)} />
                  <div className="position-select">
                    <label>Posición:</label>
                    <select value={addPosition as string} onChange={e => {
                      const v = e.target.value;
                      setAddPosition(v === 'first' || v === 'last' ? v : parseInt(v));
                    }}>
                      <option value="first">Al inicio</option>
                      <option value="last">Al final</option>
                      {queue.map((_, i) => (
                        <option key={i} value={i + 1}>Después de posición {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <button className="modal-add-btn" style={{ background: accentColor }} onClick={addSongToQueue}>
                    <Plus size={16} /> Agregar
                  </button>
                </div>
              </div>
            )}

            <div className="queue-stats">
              <span>{queue.length} canciones en cola</span>
              <button onClick={() => { musicStore.shuffleQueue(); refreshQueue(); }} className="ghost-btn">
                <Shuffle size={14} /> Mezclar
              </button>
              <button onClick={() => { musicStore.clearQueue(); refreshQueue(); setIsPlaying(false); }} className="ghost-btn danger">
                <Trash2 size={14} /> Limpiar
              </button>
            </div>

            <div className="song-list">
              {queue.map((song, i) => (
                <div key={song.id + i}
                  className={`song-row ${i === currentIndex ? 'playing' : ''}`}
                  onDoubleClick={() => playSongAt(i)}>
                  <span className="row-num">
                    {i === currentIndex && isPlaying ? <Pause size={14} /> : i + 1}
                  </span>
                  <div className="song-dot" style={{ background: song.color ?? accentColor }} />
                  <div className="song-meta">
                    <span className="song-title">{song.title}</span>
                    <span className="song-artist">
                      {song.source === 'youtube' && <Youtube size={11} style={{ marginRight: 4 }} />}
                      {song.artist}
                    </span>
                  </div>
                  <span className="song-duration">{formatTime(song.duration)}</span>
                  <div className="row-controls">
                    <button onClick={() => moveUp(i)} disabled={i === 0} title="Adelantar"><ChevronUp size={14} /></button>
                    <button onClick={() => moveDown(i)} disabled={i === queue.length - 1} title="Retroceder"><ChevronDown size={14} /></button>
                    <button className="like-btn" onClick={() => toggleLike(song.id)}>
                      <Heart size={14} fill={liked.has(song.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => removeFromQueue(i)} className="row-del" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {queue.length === 0 && (
                <div className="empty-queue">
                  <Music size={48} opacity={0.3} />
                  <p>La cola está vacía</p>
                  <p>Sube archivos o busca en YouTube para empezar</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Now Playing Bar ── */}
      <footer className="now-playing-bar">
        {/* Song info */}
        <div className="np-info">
          <div className="np-cover" style={{ background: currentSong ? `linear-gradient(135deg, ${currentSong.color ?? accentColor}, #000)` : '#222' }}>
            {currentSong?.cover
              ? <img src={currentSong.cover} alt="" />
              : <Music size={20} />}
            {isPlaying && <div className="np-bars"><span /><span /><span /></div>}
          </div>
          <div>
            <p className="np-title">{currentSong?.title ?? '—'}</p>
            <p className="np-artist">{currentSong?.artist ?? 'Selecciona una canción'}</p>
          </div>
          {currentSong && (
            <button className={`np-like ${liked.has(currentSong.id) ? 'liked' : ''}`}
              onClick={() => currentSong && toggleLike(currentSong.id)}>
              <Heart size={18} fill={currentSong && liked.has(currentSong.id) ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="np-controls">
          <div className="control-btns">
            <button className={`ctrl-btn ${shuffle ? 'active' : ''}`} onClick={() => setShuffle(!shuffle)} title="Aleatorio">
              <Shuffle size={18} />
            </button>
            <button className="ctrl-btn main" onClick={handlePrev}><SkipBack size={22} fill="white" /></button>
            <button className="play-btn" style={{ background: accentColor }}
              onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
            </button>
            <button className="ctrl-btn main" onClick={handleNext}><SkipForward size={22} fill="white" /></button>
            <button className={`ctrl-btn ${repeat !== 'none' ? 'active' : ''}`}
              onClick={() => setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none')}>
              {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          <div className="progress-row">
            <span className="time-label">{formatTime(currentTime)}</span>
            <div className="progress-bar" onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const newTime = ratio * duration;
              setCurrentTime(newTime);
              if (audioRef.current) audioRef.current.currentTime = newTime;
            }}>
              <div className="progress-fill" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%', background: accentColor }} />
              <div className="progress-thumb" style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%', background: accentColor }} />
            </div>
            <span className="time-label">{formatTime(duration || currentSong?.duration || 0)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="np-volume">
          <button onClick={() => setIsMuted(!isMuted)} className="ctrl-btn">
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="volume-bar" onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const vol = (e.clientX - rect.left) / rect.width;
            setVolume(Math.max(0, Math.min(1, vol)));
            setIsMuted(false);
          }}>
            <div className="volume-fill" style={{ width: `${(isMuted ? 0 : volume) * 100}%`, background: accentColor }} />
          </div>
        </div>
      </footer>
    </div>
  );
}