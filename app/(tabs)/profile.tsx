import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Post, Comment, getUserComments } from '@/app/services/socialService';
import { useSocial } from '@/app/context/SocialContext';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: string;
}

const playlists = [
  { id: 1, name: 'Playlist 1', image: require('@/assets/images/default_playlist.png') },
  { id: 2, name: 'Playlist 2', image: require('@/assets/images/default_playlist.png') },
  { id: 3, name: 'Playlist 3', image: require('@/assets/images/default_playlist.png') },
  { id: 4, name: 'Playlist 4', image: require('@/assets/images/default_playlist.png') },
];

const songs = [
  { id: 1, title: 'Song 1', artist: 'Artist 1', image: require('@/assets/images/default_song.jpg') },
  { id: 2, title: 'Song 2', artist: 'Artist 2', image: require('@/assets/images/default_song.jpg') },
  { id: 3, title: 'Song 3', artist: 'Artist 3', image: require('@/assets/images/default_song.jpg') },
  { id: 4, title: 'Song 4', artist: 'Artist 4', image: require('@/assets/images/default_song.jpg') },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { posts, likePost, repostPost, likeComment, dislikeComment, getPostComments } = useSocial();
  
  const [activeTab, setActiveTab] = useState('library');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userComments, setUserComments] = useState<{comment: Comment, postId: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserContent();
  }, [posts]); // Update when global posts change

  const loadUserContent = async () => {
    try {
      setIsLoading(true);
      
      // Filter posts created by the current user (using @lebronfan as user handle)
      const currentUserPosts = posts.filter(post => post.handle === '@lebronfan');
      
      // Get comments made by the current user
      const comments = await getUserComments('@lebronfan');
      
      setUserPosts(currentUserPosts);
      setUserComments(comments);
    } catch (error) {
      console.error('Error loading user content:', error);
      Alert.alert('Error', 'Failed to load your content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (postId: string, isUpvote: boolean) => {
    try {
      if (isUpvote) {
        await likePost(postId);
      } else {
        await repostPost(postId);
      }

      // User posts will be updated automatically via the effect hook
    } catch (error) {
      console.error('Error voting on post:', error);
      Alert.alert('Error', 'Failed to vote on post. Please try again.');
    }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    try {
      await likeComment(postId, commentId);
      
      // Reload user data to see updated comments
      loadUserContent();
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Failed to like comment. Please try again.');
    }
  };

  const handleCommentDislike = async (postId: string, commentId: string) => {
    try {
      await dislikeComment(postId, commentId);
      
      // Reload user data to see updated comments
      loadUserContent();
    } catch (error) {
      console.error('Error disliking comment:', error);
      Alert.alert('Error', 'Failed to dislike comment. Please try again.');
    }
  };

  const handleSongPress = (song: Song) => {
    router.push({
      pathname: '/song',
      params: { song: JSON.stringify(song) }
    });
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleViewPostWithComments = async (postId: string, commentId: string) => {
    try {
      // Find the post in the global state
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        Alert.alert('Error', 'This post could not be found.');
        return;
      }
      
      // Navigate to the social tab and open comments for this post
      router.push({
        pathname: '/(tabs)/social',
        params: { 
          viewComments: postId,
          commentId: commentId
        }
      });
    } catch (error) {
      console.error('Error navigating to post:', error);
      Alert.alert('Error', 'Could not view the original post.');
    }
  };

  const renderPost = (post: Post) => (
    <View key={post.id} style={styles.post}>
      <Image 
        source={require('@/assets/images/default_pfp.jpg')} 
        style={styles.postProfileImage} 
      />
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.handle}>{post.handle}</Text>
          <Text style={styles.timestamp}>· {post.timestamp}</Text>
        </View>
        <Text style={styles.postText}>{post.content}</Text>
        <View style={styles.postActions}>
          <View style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#B3B3B3" />
            <Text style={styles.actionText}>{post.comments}</Text>
          </View>
          <View style={styles.voteContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleVote(post.id, true)}
            >
              <Ionicons 
                name="thumbs-up" 
                size={20} 
                color={post.isLiked ? "#1DB954" : "#B3B3B3"} 
              />
            </TouchableOpacity>
            <Text style={[
              styles.voteText,
              (post.likes - post.reposts) > 0 && styles.positiveVote,
              (post.likes - post.reposts) < 0 && styles.negativeVote
            ]}>{post.likes - post.reposts}</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleVote(post.id, false)}
            >
              <Ionicons 
                name="thumbs-down" 
                size={20} 
                color={post.isReposted ? "#FF4444" : "#B3B3B3"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderComment = (commentData: {comment: Comment, postId: string}) => (
    <TouchableOpacity 
      key={commentData.comment.id} 
      style={styles.commentItem}
      onPress={() => handleViewPostWithComments(commentData.postId, commentData.comment.id)}
    >
      <Image 
        source={require('@/assets/images/default_pfp.jpg')} 
        style={styles.commentProfileImage} 
      />
      <View style={styles.commentContent}>
        <View style={styles.postHeader}>
          <Text style={styles.username}>{commentData.comment.username}</Text>
          <Text style={styles.handle}>{commentData.comment.handle}</Text>
          <Text style={styles.timestamp}>· {commentData.comment.timestamp}</Text>
        </View>
        <Text style={styles.commentText}>{commentData.comment.content}</Text>
        
        <View style={styles.commentActions}>
          <View style={styles.commentVoteContainer}>
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering the parent's onPress
                handleCommentLike(commentData.postId, commentData.comment.id);
              }}
            >
              <Ionicons 
                name="thumbs-up" 
                size={16} 
                color={commentData.comment.isLiked ? "#1DB954" : "#B3B3B3"} 
              />
            </TouchableOpacity>
            <Text style={[
              styles.commentVoteText,
              (commentData.comment.likes - commentData.comment.dislikes) > 0 && styles.positiveVote,
              (commentData.comment.likes - commentData.comment.dislikes) < 0 && styles.negativeVote
            ]}>{commentData.comment.likes - commentData.comment.dislikes}</Text>
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering the parent's onPress
                handleCommentDislike(commentData.postId, commentData.comment.id);
              }}
            >
              <Ionicons 
                name="thumbs-down" 
                size={16} 
                color={commentData.comment.isDisliked ? "#FF4444" : "#B3B3B3"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {commentData.comment.replies && commentData.comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {commentData.comment.replies.map(reply => (
              <View key={reply.id} style={styles.replyItem}>
                <Image 
                  source={require('@/assets/images/default_pfp.jpg')} 
                  style={styles.replyProfileImage} 
                />
                <View>
                  <View style={styles.commentUserInfo}>
                    <Text style={styles.commentUsername}>{reply.username}</Text>
                    <Text style={styles.commentHandle}>{reply.handle}</Text>
                    <Text style={styles.commentTimestamp}>· {reply.timestamp}</Text>
                  </View>
                  <Text style={styles.commentContent}>{reply.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderLibraryContent = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Library</Text>
      <View style={styles.librarySection}>
        <Text style={styles.subsectionTitle}>Playlists</Text>
        {playlists.map((playlist) => (
          <TouchableOpacity key={playlist.id} style={styles.playlistItem}>
            <Image source={playlist.image} style={styles.playlistImage} />
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName}>{playlist.name}</Text>
              <Text style={styles.playlistSongs}>{playlist.songs} songs</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#B3B3B3" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.librarySection}>
        <Text style={styles.subsectionTitle}>Saved Songs</Text>
        {songs.map((song) => (
          <Pressable
            key={song.id}
            style={styles.songItem}
            onPress={() => handleSongPress(song)}
          >
            <Image source={song.image} style={styles.songImage} />
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
            </View>
            <Ionicons name="play-circle" size={24} color="#1DB954" />
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderPostsContent = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Posts</Text>
      {userPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={48} color="#B3B3B3" />
          <Text style={styles.emptyText}>You haven't posted anything yet</Text>
        </View>
      ) : (
        <View style={styles.postsContainer}>
          {userPosts.map(post => renderPost(post))}
        </View>
      )}

      <Text style={[styles.sectionTitle, {marginTop: 40}]}>Your Comments</Text>
      {userComments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={48} color="#B3B3B3" />
          <Text style={styles.emptyText}>You haven't commented on any posts yet</Text>
        </View>
      ) : (
        <View style={styles.postsContainer}>
          {userComments.map(commentData => renderComment(commentData))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image
            source={require('@/assets/images/default_pfp.jpg')}
            style={styles.profileImage}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>User Name</Text>
            <Text style={styles.profileEmail}>user@example.com</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'library' && styles.activeTab]} 
          onPress={() => setActiveTab('library')}
        >
          <Text style={[styles.tabText, activeTab === 'library' && styles.activeTabText]}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]} 
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabDivider} />

      <ScrollView style={styles.content}>
        {activeTab === 'library' && renderLibraryContent()}
        {activeTab === 'posts' && renderPostsContent()}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileText: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#B3B3B3',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  librarySection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#282828',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  playlistSongs: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 4,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#282828',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  songImage: {
    width: 56,
    height: 56,
    backgroundColor: '#282828',
    borderRadius: 4,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  songArtist: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 8,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1DB954',
  },
  tabText: {
    color: '#B3B3B3',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  tabDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#282828',
  },
  post: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    width: '100%',
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
    alignItems: 'center',
    width: '100%',
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
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 100,
  },
  voteText: {
    color: '#B3B3B3',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  positiveVote: {
    color: '#1DB954',
  },
  negativeVote: {
    color: '#FF4444',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: '#B3B3B3',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  postsContainer: {
    width: '100%',
  },
  commentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    flexDirection: 'row',
  },
  commentProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  commentVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentVoteText: {
    color: '#B3B3B3',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 6,
    minWidth: 20,
    textAlign: 'center',
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  repliesContainer: {
    marginLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#282828',
    paddingLeft: 10,
    marginTop: 8,
  },
  replyItem: {
    flexDirection: 'row',
    marginTop: 8,
    paddingBottom: 8,
  },
  replyProfileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  commentHandle: {
    color: '#B3B3B3',
    fontSize: 14,
    marginRight: 4,
  },
  commentTimestamp: {
    color: '#B3B3B3',
    fontSize: 14,
  },
}); 