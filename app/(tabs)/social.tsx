import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Post } from '@/app/services/socialService';
import { useSocial } from '@/app/context/SocialContext';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Define sort options
type SortOption = 'recent' | 'liked';

export default function SocialScreen() {
  const colorScheme = useColorScheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Use the social context
  const { 
    posts, 
    isLoading, 
    loadPosts, 
    createPost, 
    likePost, 
    repostPost
  } = useSocial();
  
  // Post modal state
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // Get sorted posts based on current sort option
  const getSortedPosts = () => {
    if (sortBy === 'recent') {
      // Return posts as is (they are already sorted by most recent)
      return [...posts];
    } else {
      // Sort by most liked (highest net votes: likes - reposts)
      return [...posts].sort((a, b) => (b.likes - b.reposts) - (a.likes - a.reposts));
    }
  };

  // Toggle sort menu visibility
  const handleToggleSortMenu = () => {
    setSortMenuVisible(!sortMenuVisible);
  };

  // Change sort option
  const handleChangeSort = (option: SortOption) => {
    setSortBy(option);
    setSortMenuVisible(false);
    // Scroll to top when sort changes
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Check for navigation params requesting to view comments
  useEffect(() => {
    const checkForCommentRequests = async () => {
      if (params.viewComments && typeof params.viewComments === 'string') {
        const postId = params.viewComments;
        const commentId = params.commentId as string | undefined;
        
        // Wait a bit for the posts to load if needed
        if (posts.length === 0) {
          await loadPosts();
        }
        
        // Find the post in our list
        const postExists = posts.some(p => p.id === postId);
        
        if (postExists) {
          // Navigate to the post screen
          navigateToPost(postId, commentId);
        }
      }
    };

    checkForCommentRequests();
  }, [params.viewComments, params.commentId, posts]);

  const handleCreatePost = async (content: string) => {
    if (!content.trim()) {
      return;
    }

    try {
      setIsPosting(true);
      await createPost(content);
      // Scroll to top to see the new post
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
      throw error;
    } finally {
      setIsPosting(false);
    }
  };

  const handleOpenPostModal = () => {
    setPostModalVisible(true);
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };

  const handleRepost = async (postId: string) => {
    try {
      await repostPost(postId);
    } catch (error) {
      console.error('Error reposting:', error);
      Alert.alert('Error', 'Failed to dislike post. Please try again.');
    }
  };

  const handleCommentPress = (postId: string) => {
    // Navigate to the post screen to add a comment
    navigateToPost(postId);
  };

  const navigateToPost = (postId: string, commentId?: string) => {
    // Navigate to the post screen with the post ID
    const params: { [key: string]: string } = { postId };
    
    // Add commentId if provided
    if (commentId) {
      params.commentId = commentId;
    }
    
    router.push({
      pathname: '/post',
      params
    });
  };

  const handleViewComments = (postId: string) => {
    // Navigate to the post screen to view comments
    navigateToPost(postId);
  };

  const getProfileImage = (imageName: string) => {
    if (imageName === 'default_pfp') {
      return require('@/assets/images/default_pfp.jpg');
    }
    return require('@/assets/images/default_pfp.jpg'); // Fallback to default
  };

  const renderPost = (post: Post) => (
    <View key={post.id} style={styles.post}>
      <Image source={getProfileImage(post.profileImage)} style={styles.postProfileImage} />
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.handle}>{post.handle}</Text>
          <Text style={styles.timestamp}>· {post.timestamp}</Text>
        </View>
        <TouchableOpacity onPress={() => navigateToPost(post.id)}>
          <Text style={styles.postText}>{post.content}</Text>
        </TouchableOpacity>
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleCommentPress(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#B3B3B3" />
            <Text style={styles.actionText}>{post.comments}</Text>
          </TouchableOpacity>
          <View style={styles.voteContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLike(post.id)}
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
              onPress={() => handleRepost(post.id)}
            >
              <Ionicons 
                name="thumbs-down" 
                size={20} 
                color={post.isReposted ? "#FF4444" : "#B3B3B3"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {post.comments > 0 && (
          <TouchableOpacity 
            style={styles.viewCommentsButton}
            onPress={() => handleViewComments(post.id)}
          >
            <Text style={styles.viewCommentsText}>
              View {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Feed</Text>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={handleToggleSortMenu}
          >
            <Text style={styles.sortButtonText}>
              {sortBy === 'recent' ? 'Most Recent' : 'Most Liked'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#B3B3B3" />
          </TouchableOpacity>
          
          {sortMenuVisible && (
            <View style={styles.sortMenu}>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'recent' && styles.selectedSortOption
                ]}
                onPress={() => handleChangeSort('recent')}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === 'recent' && styles.selectedSortOptionText
                ]}>
                  Most Recent
                </Text>
                {sortBy === 'recent' && (
                  <Ionicons name="checkmark" size={16} color="#1DB954" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'liked' && styles.selectedSortOption
                ]}
                onPress={() => handleChangeSort('liked')}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === 'liked' && styles.selectedSortOptionText
                ]}>
                  Most Liked
                </Text>
                {sortBy === 'liked' && (
                  <Ionicons name="checkmark" size={16} color="#1DB954" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.newPostContainer} onPress={handleOpenPostModal}>
          <Image
            source={require('@/assets/images/default_pfp.jpg')}
            style={styles.profileImage}
          />
          <View style={styles.newPostInputContainer}>
            <Text style={styles.newPostPlaceholder}>What's on your mind?</Text>
          </View>
        </TouchableOpacity>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color="#B3B3B3" />
            <Text style={styles.emptyText}>No posts yet. Be the first to post!</Text>
          </View>
        ) : (
          getSortedPosts().map((post) => renderPost(post))
        )}
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
  sortContainer: {
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  sortButtonText: {
    color: 'white',
    fontSize: 14,
    marginRight: 4,
  },
  sortMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#282828',
    width: 150,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedSortOption: {
    backgroundColor: '#1DB95420',
  },
  sortOptionText: {
    color: 'white',
    fontSize: 14,
  },
  selectedSortOptionText: {
    color: '#1DB954',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  newPostContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  newPostInputContainer: {
    flex: 1,
    minHeight: 40,
    backgroundColor: '#282828',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  newPostPlaceholder: {
    color: '#B3B3B3',
    fontSize: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#B3B3B3',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#B3B3B3',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  viewCommentsButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  viewCommentsText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
}); 