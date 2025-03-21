import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const categories = [
  { id: 1, name: 'Pop', color: '#FF5733', image: require('@/assets/images/default_song.jpg') },
  { id: 2, name: 'Hip-Hop', color: '#33FF57', image: require('@/assets/images/default_song.jpg') },
  { id: 3, name: 'Rock', color: '#3357FF', image: require('@/assets/images/default_song.jpg') },
  { id: 4, name: 'Electronic', color: '#FF33F6', image: require('@/assets/images/default_song.jpg') },
  { id: 5, name: 'R&B', color: '#33FFF6', image: require('@/assets/images/default_song.jpg') },
  { id: 6, name: 'Jazz', color: '#F6FF33', image: require('@/assets/images/default_song.jpg') },
];

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#B3B3B3" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="What do you want to listen to?"
          placeholderTextColor="#B3B3B3"
        />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Your top genres</Text>
        <View style={styles.genresGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.genreCard, { backgroundColor: category.color }]}
            >
              <Text style={styles.genreTitle}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  genreCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    padding: 16,
    justifyContent: 'flex-end',
  },
  genreTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 