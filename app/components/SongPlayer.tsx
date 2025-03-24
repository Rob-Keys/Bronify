import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useMusic } from '@/app/context/MusicContext';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
}

interface SongPlayerProps {
  onClose: () => void;
  song: Song;
}

export default function SongPlayer({ onClose, song }: SongPlayerProps) {
  const { colors } = useTheme();
  const { 
    playSong, 
    togglePlayPause, 
    currentSong,
    isPlaying
  } = useMusic();
  
  // Check if this is the current song
  const isCurrentSong = currentSong?.id === song.id;
  const songIsPlaying = isCurrentSong && isPlaying;
  
  const handlePlayPause = () => {
    if (isCurrentSong) {
      togglePlayPause();
    } else {
      playSong(song);
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    albumArt: {
      width: 300,
      height: 300,
      borderRadius: 8,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    artist: {
      fontSize: 18,
      color: colors.neutral,
      textAlign: 'center',
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      paddingBottom: 32,
    },
    playButton: {
      marginHorizontal: 16,
    },
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <Ionicons name="chevron-down" size={24} color={colors.text} />
        </Pressable>
      </View>
      
      <View style={styles.content}>
        <Image source={song.image} style={styles.albumArt} />
        <Text style={styles.title}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable>
          <Ionicons name="shuffle" size={24} color={colors.neutral} />
        </Pressable>
        <Pressable>
          <Ionicons name="play-skip-back" size={32} color={colors.text} />
        </Pressable>
        <Pressable style={styles.playButton} onPress={handlePlayPause}>
          <Ionicons 
            name={songIsPlaying ? "pause-circle" : "play-circle"} 
            size={64} 
            color={colors.button} 
          />
        </Pressable>
        <Pressable>
          <Ionicons name="play-skip-forward" size={32} color={colors.text} />
        </Pressable>
        <Pressable>
          <Ionicons name="repeat" size={24} color={colors.neutral} />
        </Pressable>
      </View>
    </View>
  );
} 