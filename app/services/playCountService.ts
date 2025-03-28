import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for play counts
const PLAY_COUNTS_STORAGE_KEY = 'bronify_play_counts';

// Interface for play count data
interface PlayCountData {
  [songId: number]: number;
}

// Get all play counts
export const getPlayCounts = async (): Promise<PlayCountData> => {
  try {
    const storedCounts = await AsyncStorage.getItem(PLAY_COUNTS_STORAGE_KEY);
    if (storedCounts) {
      return JSON.parse(storedCounts);
    }
    return {};
  } catch (error) {
    console.error('Error getting play counts:', error);
    return {};
  }
};

// Get play count for a specific song
export const getPlayCount = async (songId: number): Promise<number> => {
  try {
    const playCounts = await getPlayCounts();
    return playCounts[songId] || 0;
  } catch (error) {
    console.error(`Error getting play count for song ${songId}:`, error);
    return 0;
  }
};

// Increment play count for a song
export const incrementPlayCount = async (songId: number): Promise<void> => {
  try {
    const playCounts = await getPlayCounts();
    const currentCount = playCounts[songId] || 0;
    
    // Update play count
    playCounts[songId] = currentCount + 1;
    
    // Save updated counts
    await AsyncStorage.setItem(PLAY_COUNTS_STORAGE_KEY, JSON.stringify(playCounts));
    
    console.log(`Incremented play count for song ${songId}: ${currentCount} → ${playCounts[songId]}`);
  } catch (error) {
    console.error(`Error incrementing play count for song ${songId}:`, error);
  }
};

// Set play count for a song (useful for initialization)
export const setPlayCount = async (songId: number, count: number): Promise<void> => {
  try {
    const playCounts = await getPlayCounts();
    playCounts[songId] = count;
    await AsyncStorage.setItem(PLAY_COUNTS_STORAGE_KEY, JSON.stringify(playCounts));
  } catch (error) {
    console.error(`Error setting play count for song ${songId}:`, error);
  }
};

// Reset all play counts (mainly for testing)
export const resetAllPlayCounts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PLAY_COUNTS_STORAGE_KEY);
    console.log('Successfully reset all play counts');
  } catch (error) {
    console.error('Error resetting play counts:', error);
  }
};

// Call this function to reset play counts for testing
resetAllPlayCounts(); 