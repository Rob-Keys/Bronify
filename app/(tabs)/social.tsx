import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Post, Comment } from '@/app/services/socialService';
import CommentModal from '@/app/components/CommentModal';
import { useSocial } from '@/app/context/SocialContext';
import { useLocalSearchParams } from 'expo-router';

export default function SocialScreen() {
  const colorScheme = useColorScheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams();
  
  // Use the social context
  const { 
    posts, 
    isLoading, 
    loadPosts, 
    createPost, 
    likePost, 
    repostPost, 
    addPostComment, 
    getPostComments, 
    likeComment, 
    dislikeComment, 
    replyToComment 
  } = useSocial();
  
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Comments view modal state
  const [viewCommentsModalVisible, setViewCommentsModalVisible] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);

  const commentsScrollViewRef = useRef<FlatList>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Add this state to keep track of where we're adding a comment from
  const [isAddingCommentFromCommentsView, setIsAddingCommentFromCommentsView] = useState(false);

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
          // Open the comments view for this post with the comment to scroll to
          handleViewComments(postId, commentId);
        }
      }
    };

    checkForCommentRequests();
  }, [params.viewComments, params.commentId, posts]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      return;
    }

    try {
      setIsPosting(true);
      await createPost(newPostContent);
      setNewPostContent('');
      // Scroll to top to see the new post
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
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
    // Set the post ID first
    setSelectedPostId(postId);
    // Reset the flag since we're not in comments view
    setIsAddingCommentFromCommentsView(false);
    // Show modal immediately
    setCommentModalVisible(true);
  };

  const handleCommentSubmit = async (comment: string) => {
    if (!selectedPostId) return;
    
    try {
      await addPostComment(selectedPostId, comment);
      
      // Always update the comments list if we're in the comments view
      if (viewCommentsModalVisible) {
        // Update the comments list
        const updatedComments = await getPostComments(selectedPostId);
        if (updatedComments) {
          setSelectedPostComments(updatedComments);
        }
        
        // Get the updated post to refresh its comment count
        // This is important for the post shown at the top of the comments view
        // (loadPosts would be more efficient, but we're avoiding a full reload)
        await loadPosts();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
      throw error; // Rethrow for the CommentModal component to handle
    }
  };

  const handleViewComments = async (postId: string, scrollToCommentId?: string) => {
    try {
      setIsLoadingComments(true);
      setSelectedPostId(postId);
      const comments = await getPostComments(postId);
      
      // Make sure comments is not undefined
      if (comments) {
        setSelectedPostComments(comments);
        
        // If we have a comment to scroll to, find it and remember its position
        if (scrollToCommentId) {
          setHighlightedCommentId(scrollToCommentId);
        } else {
          setHighlightedCommentId(null);
        }
      } else {
        setSelectedPostComments([]);
        setHighlightedCommentId(null);
      }
      
      // Delay modal visibility to ensure state is updated
      setTimeout(() => {
        setViewCommentsModalVisible(true);
        setIsLoadingComments(false);
      }, 100);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
      setSelectedPostComments([]);
      setIsLoadingComments(false);
      setHighlightedCommentId(null);
    }
  };

  // Add an effect to scroll to the highlighted comment
  useEffect(() => {
    if (viewCommentsModalVisible && highlightedCommentId && commentsScrollViewRef.current) {
      // Find the index of the comment to scroll to
      const commentIndex = selectedPostComments.findIndex(
        comment => comment.id === highlightedCommentId
      );
      
      if (commentIndex !== -1) {
        // Wait for the list to render
        setTimeout(() => {
          commentsScrollViewRef.current?.scrollToIndex({
            index: commentIndex,
            animated: true,
            viewPosition: 0.5, // Center the item
          });
        }, 500);
      }
    }
  }, [viewCommentsModalVisible, highlightedCommentId, selectedPostComments]);

  const handleCommentLike = async (commentId: string) => {
    if (!selectedPostId) return;
    
    try {
      await likeComment(selectedPostId, commentId);
      
      // Update the currently displayed comments if we're viewing them
      if (viewCommentsModalVisible && selectedPostId) {
        const updatedComments = await getPostComments(selectedPostId);
        if (updatedComments) {
          setSelectedPostComments(updatedComments);
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Failed to like comment. Please try again.');
    }
  };

  const handleCommentDislike = async (commentId: string) => {
    if (!selectedPostId) return;
    
    try {
      await dislikeComment(selectedPostId, commentId);
      
      // Update the currently displayed comments if we're viewing them
      if (viewCommentsModalVisible && selectedPostId) {
        const updatedComments = await getPostComments(selectedPostId);
        if (updatedComments) {
          setSelectedPostComments(updatedComments);
        }
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
      Alert.alert('Error', 'Failed to dislike comment. Please try again.');
    }
  };

  const handleReplySubmit = async (replyContent: string) => {
    if (!selectedPostId || !replyToCommentId) return;
    
    try {
      await replyToComment(selectedPostId, replyToCommentId, replyContent);
      
      // Always update the comments list when viewing them
      if (viewCommentsModalVisible && selectedPostId) {
        const updatedComments = await getPostComments(selectedPostId);
        if (updatedComments) {
          setSelectedPostComments(updatedComments);
        }
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Failed to add reply. Please try again.');
      throw error; // Rethrow for the CommentModal component to handle
    }
  };

  const handleReplyPress = (commentId: string) => {
    setReplyToCommentId(commentId);
    setReplyModalVisible(true);
  };

  const getProfileImage = (imageName: string) => {
    if (imageName === 'default_pfp') {
      return require('@/assets/images/default_pfp.jpg');
    }
    return require('@/assets/images/default_pfp.jpg'); // Fallback to default
  };

  const renderPost = (post: Post, isInCommentsModal = false) => (
    <View key={post.id} style={styles.post}>
      <Image source={getProfileImage(post.profileImage)} style={styles.postProfileImage} />
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
        
        {!isInCommentsModal && post.comments > 0 && (
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

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <View style={[
      styles.commentItem,
      highlightedCommentId === item.id && styles.highlightedComment
    ]}>
      <View style={styles.commentHeader}>
        <Image 
          source={require('@/assets/images/default_pfp.jpg')} 
          style={styles.commentProfileImage} 
        />
        <View>
          <View style={styles.commentUserInfo}>
            <Text style={styles.commentUsername}>{item.username}</Text>
            <Text style={styles.commentHandle}>{item.handle}</Text>
            <Text style={styles.commentTimestamp}>· {item.timestamp}</Text>
          </View>
          <Text style={styles.commentContent}>{item.content}</Text>
          
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={() => handleReplyPress(item.id)}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#B3B3B3" />
              <Text style={styles.commentActionText}>Reply</Text>
            </TouchableOpacity>
            
            <View style={styles.commentVoteContainer}>
              <TouchableOpacity 
                style={styles.commentActionButton}
                onPress={() => handleCommentLike(item.id)}
              >
                <Ionicons 
                  name="thumbs-up" 
                  size={16} 
                  color={item.isLiked ? "#1DB954" : "#B3B3B3"} 
                />
              </TouchableOpacity>
              <Text style={[
                styles.commentVoteText,
                (item.likes - item.dislikes) > 0 && styles.positiveVote,
                (item.likes - item.dislikes) < 0 && styles.negativeVote
              ]}>{item.likes - item.dislikes}</Text>
              <TouchableOpacity 
                style={styles.commentActionButton}
                onPress={() => handleCommentDislike(item.id)}
              >
                <Ionicons 
                  name="thumbs-down" 
                  size={16} 
                  color={item.isDisliked ? "#FF4444" : "#B3B3B3"} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {item.replies && item.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {item.replies.map(reply => (
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
      </View>
    </View>
  );

  const getPostById = (postId: string | null) => {
    if (!postId) return null;
    return posts.find(post => post.id === postId) || null;
  };
  
  const selectedPost = getPostById(selectedPostId);

  // Update the handler for adding comments from comments view
  const handleAddCommentFromCommentsView = () => {
    console.log('Adding comment from comments view');
    // Ensure the post ID is set
    if (!selectedPostId) {
      console.error('No selected post ID');
      return;
    }
    
    // Set the flag that we're adding from comments view
    setIsAddingCommentFromCommentsView(true);
    // Show the comment modal
    setCommentModalVisible(true);
  };

  // Update the main handler to reset the flag
  const handleCloseCommentModal = () => {
    setCommentModalVisible(false);
    setIsAddingCommentFromCommentsView(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Feed</Text>
        <TouchableOpacity 
          style={[styles.newPostButton, isPosting && styles.disabledButton]} 
          onPress={handleCreatePost}
          disabled={isPosting || !newPostContent.trim()}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
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
            value={newPostContent}
            onChangeText={setNewPostContent}
          />
        </View>

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
          posts.map((post) => renderPost(post, false))
        )}
      </ScrollView>

      {/* View Comments Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={viewCommentsModalVisible}
        onRequestClose={() => {
          setViewCommentsModalVisible(false);
          setHighlightedCommentId(null);
        }}
      >
        <SafeAreaView style={styles.commentsModalContainer} edges={['top', 'left', 'right']}>
          <View style={styles.commentsModalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setViewCommentsModalVisible(false);
                setHighlightedCommentId(null);
              }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.commentsModalTitle}>Comments</Text>
            <View style={styles.commentsModalPlaceholder} />
          </View>
          
          {isLoadingComments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1DB954" />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : (
            <>
              <View style={styles.originalPostContainer}>
                {selectedPostId && renderPost(posts.find(p => p.id === selectedPostId)!, true)}
              </View>
              
              <FlatList
                ref={commentsScrollViewRef}
                data={selectedPostComments}
                renderItem={renderCommentItem}
                keyExtractor={(item) => item.id}
                onScrollToIndexFailed={info => {
                  console.log('Failed to scroll to index', info);
                  // Fallback for failed scrolling
                  setTimeout(() => {
                    if (commentsScrollViewRef.current && selectedPostComments.length > 0) {
                      commentsScrollViewRef.current.scrollToOffset({ offset: 0, animated: true });
                    }
                  }, 100);
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-outline" size={48} color="#B3B3B3" />
                    <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
                  </View>
                }
              />
              
              <View style={styles.commentModalFooter}>
                <TouchableOpacity 
                  style={styles.addCommentButton}
                  onPress={handleAddCommentFromCommentsView}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                  <Text style={styles.addCommentButtonText}>Add a comment</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Reply Modal */}
      <CommentModal
        visible={replyModalVisible}
        onClose={() => setReplyModalVisible(false)}
        onSubmit={handleReplySubmit}
        postId={selectedPostId || ''}
        isTransparent={viewCommentsModalVisible}
        title="Reply to Comment"
      />

      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        onClose={handleCloseCommentModal}
        onSubmit={handleCommentSubmit}
        postId={selectedPostId || ''}
        isTransparent={isAddingCommentFromCommentsView}
        title="Add Comment"
      />
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
    backgroundColor: '#1DB954',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#1DB95480',
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
    paddingTop: 8,
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
  commentsModalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  commentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  commentsModalPlaceholder: {
    width: 40,
  },
  originalPostContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  commentsSectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  commentProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingLeft: 16,
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
  commentContent: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '90%',
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentActionText: {
    color: '#B3B3B3',
    fontSize: 14,
    marginLeft: 4,
  },
  commentVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentVoteText: {
    color: '#B3B3B3',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 6,
    minWidth: 20,
    textAlign: 'center',
  },
  repliesContainer: {
    marginLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#282828',
    paddingLeft: 10,
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
  commentModalFooter: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DB954',
    padding: 12,
    margin: 16,
    borderRadius: 25,
  },
  addCommentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    marginBottom: 4,
  },
  highlightedComment: {
    backgroundColor: '#282828',
  },
}); 