import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SongControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
  onRestart: () => void;
}

const SongControls: React.FC<SongControlsProps> = ({
  isPlaying,
  onPlayPause,
  onSkip,
  onRestart,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onRestart} style={styles.button}>
        <Text style={styles.text}>Restart</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPlayPause} style={styles.button}>
        <Text style={styles.text}>{isPlaying ? 'Pause' : 'Play'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSkip} style={styles.button}>
        <Text style={styles.text}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SongControls;
