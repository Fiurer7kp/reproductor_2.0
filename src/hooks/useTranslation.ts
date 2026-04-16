import { useState, useEffect } from 'react';

type Language = 'es' | 'en';

const translations = {
  es: {
    queue: 'Cola de reproducción',
    library: 'Mi Biblioteca',
    search: 'Buscar',
    myPlaylists: 'MIS PLAYLISTS',
    newPlaylist: 'Nueva playlist',
    addSong: 'Agregar canción',
    uploadFile: 'Subir archivo',
    playAll: 'Reproducir todo',
    songs: 'canciones',
    noSongs: 'La cola está vacía',
    uploadHint: 'Sube archivos o busca en YouTube para empezar',
    clearQueue: 'Limpiar',
    shuffle: 'Mezclar',
    searchYoutube: 'YouTube',
    searchSpotify: 'Spotify',
    searchPlaceholder: 'Buscar en YouTube...',
    searchHint: '💡 Pega una URL de YouTube directamente para añadir ese video, o escribe para buscar.',
    nowPlaying: 'Reproduciendo ahora',
    previous: 'Anterior',
    next: 'Siguiente',
    repeat: 'Repetir',
    volume: 'Volumen',
    delete: 'Eliminar',
    edit: 'Editar',
    addToQueue: 'Cola',
    favorite: 'Favorito',
    libraryTitle: 'Mi Biblioteca',
    searchTitle: 'Buscar música',
  },
  en: {
    queue: 'Play Queue',
    library: 'My Library',
    search: 'Search',
    myPlaylists: 'MY PLAYLISTS',
    newPlaylist: 'New Playlist',
    addSong: 'Add Song',
    uploadFile: 'Upload File',
    playAll: 'Play All',
    songs: 'songs',
    noSongs: 'Queue is empty',
    uploadHint: 'Upload files or search YouTube to start',
    clearQueue: 'Clear',
    shuffle: 'Shuffle',
    searchYoutube: 'YouTube',
    searchSpotify: 'Spotify',
    searchPlaceholder: 'Search on YouTube...',
    searchHint: '💡 Paste a YouTube URL directly to add that video, or type to search.',
    nowPlaying: 'Now Playing',
    previous: 'Previous',
    next: 'Next',
    repeat: 'Repeat',
    volume: 'Volume',
    delete: 'Delete',
    edit: 'Edit',
    addToQueue: 'Queue',
    favorite: 'Favorite',
    libraryTitle: 'My Library',
    searchTitle: 'Search Music',
  },
};

export function useTranslation() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'es' || saved === 'en') ? saved : 'es';
  });

  const t = (key: keyof typeof translations.es): string => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
  };

  return { t, language, toggleLanguage };
}