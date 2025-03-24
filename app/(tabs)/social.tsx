import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/app/services/types';
import { useSocial } from '@/app/context/SocialContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';

// Define sort options
type SortOption = 'recent' | 'liked';

export default function SocialScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  // Use the social context
  const { 
    posts, 
    isLoading, 
    loadPosts, 
    createPost, 
    togglePostLike,
    togglePostDislike,
    deletePost,
    isCurrentUserPost
  } = useSocial();
  
  // Post modal state
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // Get sorted posts based on current sort option
  const getSortedPosts = () => {
    if (sortBy === 'recent') {
      // Return posts as is (they are already sorted by most recent)
      return [...posts];
    } else {
      // Sort by most liked (highest net votes: likes - dislikes)
      return [...posts].sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
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
      await togglePostLike(postId);
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };

  const handleDislike = async (postId: string) => {
    try {
      await togglePostDislike(postId);
    } catch (error) {
      console.error('Error disliking post:', error);
      Alert.alert('Error', 'Failed to dislike post. Please try again.');
    }
  };

  const handleCommentPress = (postId: string) => {
    // Navigate to the post screen to add a comment
    navigateToPost(postId);
  };

  const navigateToPost = (postId: string, commentId?: string) => {
    // Use router.push for consistent forward animation
    router.push({
      pathname: '/post',
      params: { 
        postId,
        ...(commentId ? { commentId } : {})
      }
    });
  };

  const getProfileImage = (imageName: string) => {
    if (imageName === 'default_pfp') {
      return require('@/assets/images/default_pfp.jpg');
    }
    return require('@/assets/images/default_pfp.jpg'); // Fallback to default
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost(postId);
              Alert.alert("Success", "Post deleted successfully");
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getTotalRepliesCount = (post: Post): number => {
    // Check if commentsList exists and is an array
    if (!post.commentsList || !Array.isArray(post.commentsList)) {
      return 0;
    }
    
    // Count all comments recursively
    const countCommentsRecursively = (comments: Post[]): number => {
      return comments.reduce((total, comment) => {
        // Count this comment
        let count = 1;
        
        // Count nested comments if they exist
        if (comment.commentsList && comment.commentsList.length > 0) {
          count += countCommentsRecursively(comment.commentsList);
        }
        
        return total + count;
      }, 0);
    };
    
    return countCommentsRecursively(post.commentsList);
  };

  const renderPost = (post: Post) => {
    const totalRepliesCount = getTotalRepliesCount(post);
    
    return (
      <View 
        style={[
          styles.post, 
          { borderBottomColor: colors.border }
        ]}
      >
        <Image source={getProfileImage(post.profileImage)} style={styles.postProfileImage} />
        <View style={styles.postContent}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <Text style={[styles.username, { color: colors.text }]}>{post.username}</Text>
              <Text style={[styles.handle, { color: colors.neutral }]}>{post.handle}</Text>
              <Text style={[styles.timestamp, { color: colors.neutral }]}>· {post.timestamp}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => navigateToPost(post.id)}>
            <Text style={[styles.postText, { color: colors.text }]}>{post.content}</Text>
          </TouchableOpacity>
          
          <View style={styles.postActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCommentPress(post.id)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.neutral} />
              <Text style={[styles.actionText, { color: colors.neutral }]}>
                {totalRepliesCount > 0 ? `${totalRepliesCount} ${totalRepliesCount === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.voteContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleLike(post.id)}
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
              ]}>
                {post.likes - post.dislikes}
              </Text>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDislike(post.id)}
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
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>The Finals</Text>
        <TouchableOpacity style={styles.sortButton} onPress={handleToggleSortMenu}>
          <Ionicons name="filter" size={20} color={colors.text} />
          <Text style={[styles.sortButtonText, { color: colors.text }]}>
            {sortBy === 'recent' ? 'Most Recent' : 'Most Liked'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.text} />
        </TouchableOpacity>
        {sortMenuVisible && (
          <View style={[styles.sortMenu, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.text
          }]}>
            <TouchableOpacity 
              style={[
                styles.sortOption,
                sortBy === 'recent' && { backgroundColor: `${colors.button}20` }
              ]}
              onPress={() => handleChangeSort('recent')}
            >
              <Text 
                style={[
                  styles.sortOptionText, 
                  { color: colors.text },
                  sortBy === 'recent' && { color: colors.button }
                ]}
              >
                Most Recent
              </Text>
              {sortBy === 'recent' && (
                <Ionicons name="checkmark" size={18} color={colors.button} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.sortOption,
                sortBy === 'liked' && { backgroundColor: `${colors.button}20` }
              ]}
              onPress={() => handleChangeSort('liked')}
            >
              <Text 
                style={[
                  styles.sortOptionText, 
                  { color: colors.text },
                  sortBy === 'liked' && { color: colors.button }
                ]}
              >
                Most Liked
              </Text>
              {sortBy === 'liked' && (
                <Ionicons name="checkmark" size={18} color={colors.button} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.newPostContainer, { borderBottomColor: colors.border }]}
          onPress={handleOpenPostModal}
        >
          <Image 
            source={require('@/assets/images/default_pfp.jpg')} 
            style={styles.profileImage}
          />
          <View style={[styles.newPostInputContainer, { 
            backgroundColor: colors.card,
            borderColor: colors.border, 
            borderWidth: 1
          }]}>
            <Text style={[styles.newPostPlaceholder, { color: colors.neutral }]}>What's happening?</Text>
          </View>
        </TouchableOpacity>

        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isLoading || posts.length === 0 ? { flex: 1 } : undefined}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.button} />
              <Text style={[styles.loadingText, { color: colors.neutral }]}>Loading posts...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={50} color={colors.neutral} />
              <Text style={[styles.emptyText, { color: colors.neutral }]}>
                No posts yet. Be the first to share your thoughts!
              </Text>
            </View>
          ) : (
            getSortedPosts().map(post => (
              <React.Fragment key={post.id}>
                {renderPost(post)}
              </React.Fragment>
            ))
          )}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.floatingActionButton, { 
            backgroundColor: colors.button,
            shadowColor: colors.text
          }]}
          onPress={handleOpenPostModal}
        >
          <Ionicons name="create" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* New Post Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={postModalVisible}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity 
                onPress={() => {
                  setPostModalVisible(false);
                  setNewPostContent('');
                }}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.postButton,
                  { backgroundColor: colors.button },
                  (isPosting || !newPostContent.trim()) && styles.postButtonDisabled
                ]}
                onPress={async () => {
                  await handleCreatePost(newPostContent);
                  setPostModalVisible(false);
                  setNewPostContent('');
                }}
                disabled={isPosting || !newPostContent.trim()}
              >
                <Text style={[styles.postButtonText, { color: colors.background }]}>Post</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.compositionArea}>
              <Image
                source={require('@/assets/images/default_pfp.jpg')}
                style={styles.profileImage}
              />
              <TextInput
                style={[styles.postInput, { 
                  color: colors.text, 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8
                }]}
                placeholder="What's happening?"
                placeholderTextColor={colors.neutral}
                multiline
                value={newPostContent}
                onChangeText={setNewPostContent}
                autoFocus
                maxLength={280}
              />
            </View>
            
            {isPosting && (
              <View style={styles.postingIndicator}>
                <ActivityIndicator size="small" color={colors.button} />
                <Text style={[styles.postingText, { color: colors.text }]}>Posting...</Text>
              </View>
            )}
            
            <View style={styles.characterCountContainer}>
              <Text style={[
                styles.characterCount,
                { color: colors.text },
                newPostContent.length > 260 && { color: colors.negative },
                newPostContent.length >= 280 && { color: colors.negative }
              ]}>
                {280 - newPostContent.length}
              </Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortMenu: {
    position: 'absolute',
    top: 55,
    right: 0,
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
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  username: {
    color: 'white',
    fontSize: 20,
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
  moreButton: {
    padding: 4,
  },
  postText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
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
  floatingActionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
  },
  postButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  compositionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  postInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    padding: 12,
  },
  postingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  postingText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  characterCountContainer: {
    padding: 16,
  },
  characterCount: {
    color: 'white',
    fontSize: 14,
  },
  characterCountWarning: {
    color: '#FF4444',
  },
  characterCountLimit: {
    color: '#1DB954',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 100,
    gap: 4,
  },
  voteText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  positiveVote: {
    color: '#1DB954',
  },
  negativeVote: {
    color: '#FF4444',
  },
}); 