import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Pressable, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Post, getRelativeTime } from '@/app/services/types';
import { getPostComments } from '@/app/services/commentService';
import { useSocial } from '@/app/context/SocialContext';
import { useTheme } from '@/app/context/ThemeContext';
import { useMusic } from '@/app/context/MusicContext';
import { LinearGradient } from 'expo-linear-gradient';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
  duration?: number;
  isLiked?: boolean;
  progress?: number;
  isPlaying?: boolean;
}

const playlists = [
  { id: 1, name: 'Playlist 1', image: require('@/assets/images/default_playlist.png'), songs: 12 },
  { id: 2, name: 'Playlist 2', image: require('@/assets/images/default_playlist.png'), songs: 8 },
  { id: 3, name: 'Playlist 3', image: require('@/assets/images/default_playlist.png'), songs: 15 },
  { id: 4, name: 'Playlist 4', image: require('@/assets/images/default_playlist.png'), songs: 10 },
];

const songs = [
  { id: '1', title: 'Song 1', artist: 'Artist 1', image: require('@/assets/images/default_song.jpg') },
  { id: '2', title: 'Song 2', artist: 'Artist 2', image: require('@/assets/images/default_song.jpg') },
  { id: '3', title: 'Song 3', artist: 'Artist 3', image: require('@/assets/images/default_song.jpg') },
  { id: '4', title: 'Song 4', artist: 'Artist 4', image: require('@/assets/images/default_song.jpg') },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    posts,
    togglePostLike,
    togglePostDislike 
  } = useSocial();
  const {
    playlists,
    likedSongs,
    removeFromPlaylist,
    toggleLike,
    deletePlaylist,
    updatePlaylistName,
    addToQueue
  } = useMusic();
  
  const [activeTab, setActiveTab] = useState('library');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State to force refreshes for timestamp updates
  const [refreshTimestamp, setRefreshTimestamp] = useState(0);

  // Update timestamps when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // This will force a re-render of all posts with fresh timestamps
      setRefreshTimestamp(Date.now());
      
      // Set up an interval to refresh timestamps every minute while screen is focused
      const intervalId = setInterval(() => {
        setRefreshTimestamp(Date.now());
      }, 60000); // Update every minute
      
      return () => clearInterval(intervalId);
    }, [])
  );

  useEffect(() => {
    loadUserContent();
  }, [posts]); // Update when global posts change

  const loadUserContent = async () => {
    try {
      setIsLoading(true);
      
      // Filter posts created by the current user (using @lebronfan as user handle)
      const currentUserPosts = posts.filter(post => post.handle === '@lebronfan');
      
      setUserPosts(currentUserPosts);
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
        await togglePostLike(postId);
      } else {
        await togglePostDislike(postId);
      }
    } catch (error) {
      console.error('Error voting on post:', error);
      Alert.alert('Error', 'Failed to vote on post. Please try again.');
    }
  };

  const handlePlaylistPress = (playlistId: number) => {
    router.push({
      pathname: '/playlist',
      params: { playlistId: playlistId.toString() }
    });
  };

  const handleSongPress = (song: Song) => {
    router.push({
      pathname: '/song',
      params: { song: JSON.stringify(song) }
    });
  };

  const handleRemoveFromPlaylist = (playlistId: number, songId: number) => {
    Alert.alert(
      'Remove Song',
      'Are you sure you want to remove this song from the playlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromPlaylist(playlistId, songId);
            Alert.alert('Success', 'Song removed from playlist');
          }
        }
      ]
    );
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const likePost = async (postId: string) => {
    await togglePostLike(postId);
  };

  const handleUnlikeSong = (song: Song) => {
    Alert.alert(
      'Remove from Liked Songs',
      'Are you sure you want to remove this song from your liked songs?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            toggleLike(song);
            Alert.alert('Success', 'Song removed from liked songs');
          }
        }
      ]
    );
  };

  const handleEditPlaylistName = (playlistId: number, currentName: string) => {
    Alert.prompt(
      'Edit Playlist Name',
      'Enter a new name for your playlist',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Save',
          onPress: (newName) => {
            if (newName && newName.trim()) {
              updatePlaylistName(playlistId, newName.trim());
              Alert.alert('Success', 'Playlist name updated');
            }
          }
        }
      ],
      'plain-text',
      currentName
    );
  };

  const handleDeletePlaylist = (playlistId: number, playlistName: string) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlistName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlaylist(playlistId);
            Alert.alert('Success', 'Playlist deleted');
          }
        }
      ]
    );
  };

  const renderPost = (post: Post) => (
    <View key={`${post.id}-${refreshTimestamp}`} style={[styles.post, { borderBottomColor: colors.border }]}>
      <Image 
        source={require('@/assets/images/default_pfp.jpg')} 
        style={styles.postProfileImage} 
      />
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={[styles.username, { color: colors.text }]}>{post.username}</Text>
          <Text style={[styles.handle, { color: colors.neutral }]}>{post.handle}</Text>
          <Text style={[styles.postTimestamp, { color: colors.neutral }]}>· {getRelativeTime(post.createdAt)}</Text>
        </View>
        <Text style={[styles.postText, { color: colors.text }]}>{post.content}</Text>
        <View style={styles.postActions}>
          <View style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.neutral} />
            <Text style={[styles.actionText, { color: colors.neutral }]}>
              {post.comments}
              {post.comments > post.commentsList.length && ` (${post.commentsList.length} + ${post.comments - post.commentsList.length})`}
            </Text>
          </View>
          <View style={styles.voteContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleVote(post.id, true)}
            >
              <Ionicons 
                name="thumbs-up" 
                size={20} 
                color={post.isLiked ? colors.positive : colors.neutral} 
              />
            </TouchableOpacity>
            <Text style={[
              styles.voteText,
              { color: colors.neutral },
              (post.likes - post.dislikes) > 0 && { color: colors.positive },
              (post.likes - post.dislikes) < 0 && { color: colors.negative }
            ]}>{post.likes - post.dislikes}</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleVote(post.id, false)}
            >
              <Ionicons 
                name="thumbs-down" 
                size={20} 
                color={post.isDisliked ? colors.negative : colors.neutral} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderLibraryContent = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Library</Text>
      
      <View style={styles.librarySection}>
        <Text style={[styles.subsectionTitle, { color: colors.text }]}>Playlists</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playlistsContainer}>
          {playlists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list" size={48} color={colors.neutral} />
              <Text style={[styles.emptyText, { color: colors.neutral }]}>No playlists yet</Text>
            </View>
          ) : (
            playlists.map(playlist => (
              <View key={playlist.id} style={styles.playlistCardContainer}>
                <TouchableOpacity
                  style={styles.playlistCard}
                  onPress={() => handlePlaylistPress(playlist.id)}
                >
                  <View style={styles.playlistImageContainer}>
                    <Image
                      source={playlist.songs && playlist.songs.length > 0 ? 
                        playlist.songs[0].image : 
                        require('@/assets/images/default_playlist.png')}
                      style={styles.playlistImage}
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                      style={styles.playlistImageOverlay}
                    />
                  </View>
                  <View style={styles.playlistInfo}>
                    <Text style={[styles.playlistName, { color: colors.text }]} numberOfLines={1}>{playlist.name}</Text>
                    <Text style={[styles.playlistSongCount, { color: colors.neutral }]}>
                      {playlist.songs.length} songs
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
      
      <View style={styles.librarySection}>
        <Text style={[styles.subsectionTitle, { color: colors.text }]}>Liked Songs</Text>
        {likedSongs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart" size={48} color={colors.neutral} />
            <Text style={[styles.emptyText, { color: colors.neutral }]}>No liked songs yet</Text>
          </View>
        ) : (
          likedSongs.map(song => (
            <TouchableOpacity
              key={song.id}
              style={[styles.songItem, { borderBottomColor: colors.border }]}
              onPress={() => handleSongPress(song)}
            >
              <Image
                source={song.image}
                style={styles.songImage}
              />
              <View style={styles.songInfo}>
                <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
                <Text style={[styles.songArtist, { color: colors.neutral }]}>{song.artist}</Text>
              </View>
              <View style={styles.songActions}>
                <TouchableOpacity
                  style={styles.songAction}
                  onPress={() => {
                    addToQueue(song);
                    Alert.alert('Added to Queue', `${song.title} has been added to your queue.`);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.neutral} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.songAction}
                  onPress={() => handleUnlikeSong(song)}
                >
                  <Ionicons name="heart" size={24} color="#FF4B4B" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderPostsContent = () => {
    // Function to recursively find all comments by the user
    const findUserComments = (posts: Post[]): Post[] => {
      let userComments: Post[] = [];
      
      posts.forEach(post => {
        // Check if this post is a comment by the user
        if (post.isComment && post.handle === '@lebronfan') {
          userComments.push(post);
        }
        
        // Recursively check comments in this post's commentsList
        if (post.commentsList && post.commentsList.length > 0) {
          userComments = userComments.concat(findUserComments(post.commentsList));
        }
      });
      
      return userComments;
    };

    // Get all comments made by the user
    const userComments = findUserComments(posts);

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Posts</Text>
        {userPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.neutral} />
            <Text style={[styles.emptyText, { color: colors.neutral }]}>You haven't posted anything yet.</Text>
          </View>
        ) : (
          userPosts.map(post => (
            <TouchableOpacity 
              key={`${post.id}-${refreshTimestamp}`}
              onPress={() => router.push({
                pathname: '/post',
                params: { postId: post.id }
              })}
            >
              {renderPost(post)}
            </TouchableOpacity>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Your Replies</Text>
        {userComments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.neutral} />
            <Text style={[styles.emptyText, { color: colors.neutral }]}>You haven't replied to anything yet.</Text>
          </View>
        ) : (
          userComments.map(comment => (
            <TouchableOpacity 
              key={`${comment.id}-${refreshTimestamp}`}
              onPress={() => router.push({
                pathname: '/post',
                params: { postId: comment.parentId }
              })}
            >
              <View style={[styles.post, { borderBottomColor: colors.border }]}>
                <Image 
                  source={require('@/assets/images/default_pfp.jpg')} 
                  style={styles.postProfileImage} 
                />
                <View style={styles.postContent}>
                  <View style={styles.postHeader}>
                    <Text style={[styles.username, { color: colors.text }]}>{comment.username}</Text>
                    <Text style={[styles.handle, { color: colors.neutral }]}>{comment.handle}</Text>
                    <Text style={[styles.postTimestamp, { color: colors.neutral }]}>· {getRelativeTime(comment.createdAt)}</Text>
                  </View>
                  <Text style={[styles.postText, { color: colors.text }]}>{comment.content}</Text>
                  <View style={styles.postActions}>
                    <View style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={20} color={colors.neutral} />
                      <Text style={[styles.actionText, { color: colors.neutral }]}>
                        {comment.comments}
                        {comment.comments > comment.commentsList.length && ` (${comment.commentsList.length} + ${comment.comments - comment.commentsList.length})`}
                      </Text>
                    </View>
                    <View style={styles.voteContainer}>
                      <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={() => handleVote(comment.id, true)}
                      >
                        <Ionicons 
                          name="thumbs-up" 
                          size={20} 
                          color={comment.isLiked ? colors.positive : colors.neutral} 
                        />
                      </TouchableOpacity>
                      <Text style={[
                        styles.voteText,
                        { color: colors.neutral },
                        (comment.likes - comment.dislikes) > 0 && { color: colors.positive },
                        (comment.likes - comment.dislikes) < 0 && { color: colors.negative }
                      ]}>{comment.likes - comment.dislikes}</Text>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleVote(comment.id, false)}
                      >
                        <Ionicons 
                          name="thumbs-down" 
                          size={20} 
                          color={comment.isDisliked ? colors.negative : colors.neutral} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image
            source={require('@/assets/images/default_pfp.jpg')}
            style={styles.profileImage}
          />
          <View style={styles.profileText}>
            <Text style={[styles.username, { color: colors.text }]}>LeBron Fan</Text>
            <Text style={[styles.handle, { color: colors.neutral }]}>@lebronfan</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'library' && { borderBottomColor: colors.button }
          ]}
          onPress={() => setActiveTab('library')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'library' ? colors.button : colors.neutral }
          ]}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'posts' && { borderBottomColor: colors.button }
          ]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'posts' ? colors.button : colors.neutral }
          ]}>Posts</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'library' ? renderLibraryContent() : renderPostsContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  username: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  handle: {
    color: '#B3B3B3',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingTop: 8,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    color: '#B3B3B3',
    fontSize: 14,
    fontWeight: '500',
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
  playlistCardContainer: {
    marginRight: 16,
    marginLeft: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistCard: {
    width: 160,
    backgroundColor: '#282828',
    borderRadius: 10,
    overflow: 'hidden',
  },
  playlistImageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  playlistImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10,
  },
  playlistImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  playlistInfo: {
    padding: 12,
  },
  playlistName: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playlistSongCount: {
    fontSize: 13,
    color: '#B3B3B3',
  },
  playlistsContainer: {
    paddingLeft: 12,
    paddingRight: 4,
    paddingBottom: 8,
    paddingTop: 8,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songAction: {
    padding: 8,
    marginLeft: 4,
  },
  unlikeButton: {
    padding: 8,
  },
  post: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
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
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
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
  postTimestamp: {
    fontSize: 14,
    marginLeft: 4,
  },
  playlistActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  playlistActionButton: {
    padding: 4,
    marginLeft: 8,
  },
}); 