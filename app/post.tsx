import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Post } from '@/app/services/types';
import { useSocial } from '@/app/context/SocialContext';
import { useTheme } from '@/app/context/ThemeContext';

export default function PostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { postId } = params;
  const { colors } = useTheme();
  
  // Use the social context
  const { 
    posts, 
    loadPosts, 
    togglePostLike, 
    togglePostDislike,
    addComment,
    deletePost,
    isCurrentUserPost,
    getPost
  } = useSocial();
  
  // State for the current post and its replies
  const [mainPost, setMainPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reply modal state
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [parentPostId, setParentPostId] = useState<string | null>(null);
  
  // Ref for scrolling
  const scrollViewRef = useRef<ScrollView>(null);

  // Load the post and its replies
  useEffect(() => {
    if (!postId || typeof postId !== 'string') {
      Alert.alert('Error', 'Invalid post ID');
      router.back();
      return;
    }

    const loadPostData = async () => {
      try {
        setIsLoading(true);
        
        // Ensure posts are loaded
        if (posts.length === 0) {
          await loadPosts();
        }
        
        // Use the getPost function to find the post, which can find replies at any level
        const fetchedPost = await getPost(postId);
        if (!fetchedPost) {
          Alert.alert('Error', 'Post not found');
          router.back();
          return;
        }
        
        setMainPost(fetchedPost);
        
        // Get direct replies to this post
        const directReplies = fetchedPost.commentsList && Array.isArray(fetchedPost.commentsList) 
          ? fetchedPost.commentsList 
          : [];
        setReplies(directReplies);
      } catch (error) {
        console.error('Error loading post:', error);
        Alert.alert('Error', 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPostData();
  }, [postId, posts]);

  const handleBackPress = async () => {
    // Use native back navigation
    router.back();
  };

  const handleLike = async (post: Post) => {
    try {
      await togglePostLike(post.id);
      await loadPosts(); // Reload posts to get updated data
      
      // If this is the main post, update it directly using getPost
      if (mainPost && post.id === mainPost.id) {
        const updatedPost = await getPost(post.id);
        if (updatedPost) {
          setMainPost(updatedPost);
        }
      }
      
      // Update the replies list if a reply was liked
      if (replies.some(r => r.id === post.id)) {
        if (mainPost?.id) {
          const updatedMainPost = await getPost(mainPost.id);
          if (updatedMainPost) {
            // Ensure commentsList exists before setting replies
            if (updatedMainPost.commentsList && Array.isArray(updatedMainPost.commentsList)) {
              setReplies(updatedMainPost.commentsList);
            } else {
              setReplies([]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const handleDislike = async (post: Post) => {
    try {
      await togglePostDislike(post.id);
      await loadPosts(); // Reload posts to get updated data
      
      // If this is the main post, update it directly using getPost
      if (mainPost && post.id === mainPost.id) {
        const updatedPost = await getPost(post.id);
        if (updatedPost) {
          setMainPost(updatedPost);
        }
      }
      
      // Update the replies list if a reply was disliked
      if (replies.some(r => r.id === post.id)) {
        if (mainPost?.id) {
          const updatedMainPost = await getPost(mainPost.id);
          if (updatedMainPost) {
            // Ensure commentsList exists before setting replies
            if (updatedMainPost.commentsList && Array.isArray(updatedMainPost.commentsList)) {
              setReplies(updatedMainPost.commentsList);
            } else {
              setReplies([]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error disliking post:', error);
      Alert.alert('Error', 'Failed to dislike post');
    }
  };

  const handleDeletePost = (post: Post) => {
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
              await deletePost(post.id);
              
              // If we're deleting the main post, go back
              if (mainPost && post.id === mainPost.id) {
                router.back();
              } else {
                // We deleted a reply, update the replies list
                await loadPosts();
                
                // Use getPost to find the main post even if it's deeply nested
                if (mainPost?.id) {
                  const updatedMainPost = await getPost(mainPost.id);
                  if (updatedMainPost) {
                    // Ensure commentsList exists before setting replies
                    if (updatedMainPost.commentsList && Array.isArray(updatedMainPost.commentsList)) {
                      setReplies(updatedMainPost.commentsList);
                    } else {
                      setReplies([]);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  const handleReplyButtonPress = (post: Post) => {
    setParentPostId(post.id);
    setReplyModalVisible(true);
  };

  const handleSubmitReply = async () => {
    if (!parentPostId || !replyContent.trim()) {
      return;
    }

    try {
      setIsPosting(true);
      await addComment(parentPostId, replyContent);
      
      // Reload data to get updated posts
      await loadPosts();
      
      // Update the UI using getPost to find the post at any nesting level
      if (mainPost?.id) {
        const updatedMainPost = await getPost(mainPost.id);
        if (updatedMainPost) {
          setMainPost(updatedMainPost);
          // Ensure commentsList exists before setting replies
          if (updatedMainPost.commentsList && Array.isArray(updatedMainPost.commentsList)) {
            setReplies(updatedMainPost.commentsList);
          } else {
            setReplies([]);
          }
        }
      }
      
      // Reset state
      setReplyContent('');
      setReplyModalVisible(false);
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'Failed to post reply');
    } finally {
      setIsPosting(false);
    }
  };

  const handleViewReplies = (post: Post) => {
    // Use router.push for forward navigation to ensure proper animation
    router.push({
      pathname: '/reply',
      params: { 
        replyId: post.id,
        parentId: postId?.toString()
      }
    });
  };

  const getProfileImage = (imageName: string) => {
    if (imageName === 'default_pfp') {
      return require('@/assets/images/default_pfp.jpg');
    }
    return require('@/assets/images/default_pfp.jpg'); // Fallback to default
  };

  const countNestedReplies = (post: Post): number => {
    // Make sure commentsList exists and is an array
    if (!post.commentsList || !Array.isArray(post.commentsList)) {
      return 0;
    }
    
    return post.commentsList.length;
  };

  const renderPost = (post: Post, isReply = false) => {
    const nestedRepliesCount = countNestedReplies(post);
    
    return (
      <View style={[
        styles.postContainer,
        { borderBottomColor: colors.border },
        isReply ? styles.replyContainer : null
      ]}>
        <View style={styles.post}>
          <Image source={getProfileImage(post.profileImage)} style={styles.profileImage} />
          <View style={styles.postContent}>
            <View style={styles.postHeader}>
              <View style={styles.userInfo}>
                <Text style={[styles.username, { color: colors.text }]}>{post.username}</Text>
                <Text style={[styles.handle, { color: colors.neutral }]}>{post.handle}</Text>
                <Text style={[styles.timestamp, { color: colors.neutral }]}>· {post.timestamp}</Text>
              </View>
              {isCurrentUserPost(post.handle) && !isReply && (
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={() => handleDeletePost(post)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.negative} />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity onPress={() => isReply ? handleViewReplies(post) : null}>
              <Text style={[styles.postText, { color: colors.text }]}>{post.content}</Text>
            </TouchableOpacity>
            
            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleViewReplies(post)}
              >
                <Ionicons name="chatbubble-outline" size={20} color={colors.neutral} />
                <Text style={[styles.actionText, { color: colors.neutral }]}>
                  {nestedRepliesCount > 0 ? `${nestedRepliesCount} ${nestedRepliesCount === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.voteContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleLike(post)}
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
                  onPress={() => handleDislike(post)}
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
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.button} />
          <Text style={[styles.loadingText, { color: colors.neutral }]}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        {/* Main post */}
        {mainPost && renderPost(mainPost)}
        
        {/* Replies heading if there are replies */}
        {replies.length > 0 && (
          <View style={[styles.repliesHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.repliesHeaderText, { color: colors.text }]}>
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </Text>
          </View>
        )}
        
        {/* Replies list */}
        {replies.map(reply => (
          <React.Fragment key={reply.id}>
            {renderPost(reply, true)}
          </React.Fragment>
        ))}
      </ScrollView>
      
      {/* Reply button */}
      <TouchableOpacity 
        style={[styles.floatingActionButton, { backgroundColor: colors.button }]}
        onPress={() => handleReplyButtonPress(mainPost!)}
      >
        <Ionicons name="chatbubble-outline" size={24} color={colors.background} />
      </TouchableOpacity>
      
      {/* Reply modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={replyModalVisible}
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Reply input area */}
            <View style={[styles.replyInputContainer, { 
              borderTopColor: colors.border,
              backgroundColor: colors.background 
            }]}>
              <View style={styles.replyInputHeader}>
                <TouchableOpacity 
                  onPress={() => setReplyModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={[styles.modalCloseText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.postButton,
                    { backgroundColor: colors.button },
                    (isPosting || !replyContent.trim()) && styles.postButtonDisabled
                  ]}
                  onPress={handleSubmitReply}
                  disabled={isPosting || !replyContent.trim()}
                >
                  <Text style={[styles.postButtonText, { color: colors.background }]}>Reply</Text>
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
                  placeholder="Write your reply..."
                  placeholderTextColor={colors.neutral}
                  multiline
                  value={replyContent}
                  onChangeText={setReplyContent}
                  autoFocus
                  maxLength={280}
                />
              </View>
              
              {isPosting && (
                <View style={styles.postingIndicator}>
                  <ActivityIndicator size="small" color={colors.button} />
                  <Text style={[styles.postingText, { color: colors.text }]}>Posting reply...</Text>
                </View>
              )}
              
              <View style={styles.characterCountContainer}>
                <Text style={[
                  styles.characterCount,
                  { color: colors.text },
                  replyContent.length > 260 && { color: colors.negative },
                  replyContent.length >= 280 && { color: colors.negative }
                ]}>
                  {280 - replyContent.length}
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  postContainer: {
    borderBottomWidth: 1,
  },
  replyContainer: {
    marginLeft: 20, // Indentation for replies
  },
  post: {
    flexDirection: 'row',
    padding: 16,
  },
  profileImage: {
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
    fontSize: 20,
    fontWeight: '600',
    marginRight: 4,
  },
  handle: {
    fontSize: 14,
    marginRight: 4,
  },
  timestamp: {
    fontSize: 14,
  },
  moreButton: {
    padding: 4,
  },
  postText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 100,
  },
  voteText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  viewRepliesText: {
    fontSize: 14,
    marginRight: 4,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repliesHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  repliesHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  originalPostPreview: {
    padding: 16,
    borderBottomWidth: 1,
    maxHeight: '40%',
  },
  originalPostHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  originalPostUsername: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  originalPostContent: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  replyInputContainer: {
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    marginTop: 250,
  },
  replyInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  compositionArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 0,
  },
  postInput: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  postingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  postingText: {
    fontSize: 16,
    marginLeft: 8,
  },
  characterCountContainer: {
    padding: 16,
  },
  characterCount: {
    fontSize: 14,
  },
}); 