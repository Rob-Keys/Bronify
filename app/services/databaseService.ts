import { Platform } from 'react-native';
import { token } from '../../env.ts';
import { BASE_URL } from '../../env.ts';


export interface Song {
  id: number;
  title: string;
  artist: string;
  plays: number;
  song_url: string;
  art_url: string;
  artist_socials: Record<string, string>;
  image?: any;
  audio?: any;
  isLiked?: boolean;
  progress?: number;
  isPlaying?: boolean;
  duration?: number;
}

// Fetch all songs from the database
// How To Use:
// Path: /tableName/select
// JSON request body: 
// {
//  "column": "title",
//  "value": "Man On The Lakers"
// }
// use value : "*" to get all records
export const fetchSongs = async (): Promise<Song[]> => {
  try {
    const response = await fetch(`${BASE_URL}/songs/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        column: "id",
        value: "*" // Special value to get all songs
      })
    });

    if (!response.ok) {
      console.error('Failed to fetch songs:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data) {
      console.error('Invalid response format:', data);
      return [];
    }

    return data.data.map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      plays: song.plays || 0,
      song_url: song.song_url,
      art_url: song.art_url,
      artist_socials: song.artist_socials || {},
      image: null, // These will be handled by the UI layer
      audio: null
    }));
  } catch (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
};

// Fetch songs by artist
export const fetchSongsByArtist = async (artist: string): Promise<Song[]> => {
  try {
    const response = await fetch(`${BASE_URL}/songs/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        column: 'artist',
        value: artist
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch songs by artist');
    }

    const data = await response.json();
    return data.data.map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      plays: song.plays,
      song_url: song.song_url,
      art_url: song.art_url,
      artist_socials: song.artist_socials
    }));
  } catch (error) {
    console.error('Error fetching songs by artist:', error);
    return [];
  }
};

// Update song play count
export const updateSongPlayCount = async (songId: number, newCount: number): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/songs/put`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        set_column: 'plays',
        set_value: newCount.toString(),
        where_column: 'id',
        where_value: songId.toString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update play count');
    }
  } catch (error) {
    console.error('Error updating play count:', error);
  }
};

// Get song by ID
export const getSongById = async (id: number): Promise<Song | null> => {
  try {
    const response = await fetch(`${BASE_URL}/songs/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        column: 'id',
        value: id.toString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch song');
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const song = data.data[0];
      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        plays: song.plays,
        song_url: song.song_url,
        art_url: song.art_url,
        artist_socials: song.artist_socials
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching song:', error);
    return null;
  }
};

export async function searchSongs(query: string): Promise<Song[]> {
  try {
    const response = await fetch(`${BASE_URL}/songs/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search songs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching songs:', error);
    return [];
  }
} 