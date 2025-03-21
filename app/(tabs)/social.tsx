import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

interface Post {
  id: string;
  username: string;
  handle: string;
  profileImage: any;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  reposts: number;
  isLiked: boolean;
  isReposted: boolean;
}

const posts: Post[] = [
  {
    id: '1',
    username: 'John Doe',
    handle: '@johndoe',
    profileImage: require('@/assets/images/default_pfp.jpg'),
    content: 'Just released my new album! 🎵 Check it out on Bronify! #NewMusic #Bronify',
    timestamp: '2h',
    likes: 1234,
    comments: 89,
    reposts: 45,
    isLiked: false,
    isReposted: false,
  },
  {
    id: '2',
    username: 'Jane Smith',
    handle: '@janesmith',
    profileImage: require('@/assets/images/default_pfp.jpg'),
    content: 'This new playlist is 🔥! Perfect for my workout session. #WorkoutMusic #Bronify',
    timestamp: '4h',
    likes: 856,
    comments: 34,
    reposts: 23,
    isLiked: true,
    isReposted: false,
  },
  {
    id: '3',
    username: 'Mike Johnson',
    handle: '@mikej',
    profileImage: require('@/assets/images/default_pfp.jpg'),
    content: 'Who else is excited for the new album release? 🎸 #NewMusic #Bronify',
    timestamp: '6h',
    likes: 2341,
    comments: 156,
    reposts: 89,
    isLiked: false,
    isReposted: true,
  },
];

export default function SocialScreen() {
  const colorScheme = useColorScheme();

  const handleLike = (postId: string) => {
    // Implement like functionality
  };

  const handleRepost = (postId: string) => {
    // Implement repost functionality
  };

  const handleComment = (postId: string) => {
    // Implement comment functionality
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Feed</Text>
        <TouchableOpacity style={styles.newPostButton}>
          <Ionicons name="create-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.newPostContainer}>
          <Image
            source={require('@/assets/images/default_pfp.jpg')}
            style={styles.profileImage}
          />
          <TextInput
            style={styles.newPostInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#B3B3B3"
            multiline
          />
        </View>

        {posts.map((post) => (
          <View key={post.id} style={styles.post}>
            <Image source={post.profileImage} style={styles.postProfileImage} />
            <View style={styles.postContent}>
              <View style={styles.postHeader}>
                <Text style={styles.username}>{post.username}</Text>
                <Text style={styles.handle}>{post.handle}</Text>
                <Text style={styles.timestamp}>· {post.timestamp}</Text>
              </View>
              <Text style={styles.postText}>{post.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleComment(post.id)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#B3B3B3" />
                  <Text style={styles.actionText}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleRepost(post.id)}
                >
                  <Ionicons 
                    name={post.isReposted ? "repeat" : "repeat-outline"} 
                    size={20} 
                    color={post.isReposted ? "#1DB954" : "#B3B3B3"} 
                  />
                  <Text style={[
                    styles.actionText,
                    post.isReposted && styles.actionTextActive
                  ]}>{post.reposts}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleLike(post.id)}
                >
                  <Ionicons 
                    name={post.isLiked ? "heart" : "heart-outline"} 
                    size={20} 
                    color={post.isLiked ? "#FF4444" : "#B3B3B3"} 
                  />
                  <Text style={[
                    styles.actionText,
                    post.isLiked && styles.actionTextActive
                  ]}>{post.likes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  newPostButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  newPostContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  newPostInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  post: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  postProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postContent: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  handle: {
    color: '#B3B3B3',
    fontSize: 14,
    marginRight: 4,
  },
  timestamp: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  postText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 300,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#B3B3B3',
    fontSize: 14,
    marginLeft: 4,
  },
  actionTextActive: {
    color: '#1DB954',
  },
}); 