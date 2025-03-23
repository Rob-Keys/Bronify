import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Post, Comment } from '@/app/services/socialService';
import CommentModal from '@/app/components/CommentModal';
import { useSocial } from '@/app/context/SocialContext';

export default function PostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { postId } = params;
  
  // Use the social context
  const { 
    posts, 
    loadPosts, 
    likePost, 
    repostPost, 
    addPostComment, 
    getPostComments, 
    likeComment, 
    dislikeComment, 
    replyToComment 
  } = useSocial();
  
  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  // Reply functionality
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);

  const commentsScrollViewRef = useRef<FlatList>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Load the post data
  useEffect(() => {
    if (!postId || typeof postId !== 'string') {
      Alert.alert('Error', 'Invalid post ID');
      router.back();
      return;
    }

    const loadPostData = async () => {
      // Load posts if they aren't already loaded
      if (posts.length === 0) {
        await loadPosts();
      }
      
      // Find the post in the context
      const post = posts.find(p => p.id === postId);
      if (!post) {
        Alert.alert('Error', 'Post not found');
        router.back();
        return;
      }
      
      setSelectedPost(post);
      
      // Load comments
      try {
        setIsLoadingComments(true);
        const postComments = await getPostComments(postId);
        
        if (postComments) {
          setComments(postComments);
          
          // Check if we should highlight a specific comment
          const commentId = params.commentId as string | undefined;
          if (commentId) {
            setHighlightedCommentId(commentId);
          }
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        Alert.alert('Error', 'Failed to load comments');
      } finally {
        setIsLoadingComments(false);
      }
    };
    
    loadPostData();
  }, [postId, params.commentId]);
  
  // Scroll to highlighted comment if needed
  useEffect(() => {
    if (highlightedCommentId && commentsScrollViewRef.current) {
      // Find the index of the comment to scroll to
      const commentIndex = comments.findIndex(
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
  }, [highlightedCommentId, comments]);

  const handleBackPress = () => {
    router.back();
  };

  const handleLike = async () => {
    if (!selectedPost) return;
    
    try {
      await likePost(selectedPost.id);
      // Update the post in our local state
      const updatedPosts = await loadPosts();
      const updatedPost = updatedPosts.find(p => p.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };

  const handleRepost = async () => {
    if (!selectedPost) return;
    
    try {
      await repostPost(selectedPost.id);
      // Update the post in our local state
      const updatedPosts = await loadPosts();
      const updatedPost = updatedPosts.find(p => p.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    } catch (error) {
      console.error('Error reposting:', error);
      Alert.alert('Error', 'Failed to dislike post. Please try again.');
    }
  };

  const handleAddComment = () => {
    setCommentModalVisible(true);
  };

  const handleCommentSubmit = async (comment: string) => {
    if (!selectedPost) return;
    
    try {
      await addPostComment(selectedPost.id, comment);
      
      // Update the post and comments
      const updatedPosts = await loadPosts();
      const updatedPost = updatedPosts.find(p => p.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
      
      // Refresh comments
      const updatedComments = await getPostComments(selectedPost.id);
      if (updatedComments) {
        setComments(updatedComments);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
      throw error;
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!selectedPost) return;
    
    try {
      await likeComment(selectedPost.id, commentId);
      
      // Refresh comments
      const updatedComments = await getPostComments(selectedPost.id);
      if (updatedComments) {
        setComments(updatedComments);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Failed to like comment. Please try again.');
    }
  };

  const handleCommentDislike = async (commentId: string) => {
    if (!selectedPost) return;
    
    try {
      await dislikeComment(selectedPost.id, commentId);
      
      // Refresh comments
      const updatedComments = await getPostComments(selectedPost.id);
      if (updatedComments) {
        setComments(updatedComments);
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
      Alert.alert('Error', 'Failed to dislike comment. Please try again.');
    }
  };

  const handleReplyPress = (commentId: string) => {
    setReplyToCommentId(commentId);
    setReplyModalVisible(true);
  };

  const handleReplySubmit = async (replyContent: string) => {
    if (!selectedPost || !replyToCommentId) return;
    
    try {
      await replyToComment(selectedPost.id, replyToCommentId, replyContent);
      
      // Refresh comments
      const updatedComments = await getPostComments(selectedPost.id);
      if (updatedComments) {
        setComments(updatedComments);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Failed to add reply. Please try again.');
      throw error;
    }
  };

  const getProfileImage = (imageName: string) => {
    if (imageName === 'default_pfp') {
      return require('@/assets/images/default_pfp.jpg');
    }
    return require('@/assets/images/default_pfp.jpg'); // Fallback to default
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      {!selectedPost ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      ) : (
        <>
          <View style={styles.postContainer}>
            <View style={styles.post}>
              <Image 
                source={getProfileImage(selectedPost.profileImage)} 
                style={styles.postProfileImage} 
              />
              <View style={styles.postContent}>
                <View style={styles.postHeader}>
                  <Text style={styles.username}>{selectedPost.username}</Text>
                  <Text style={styles.handle}>{selectedPost.handle}</Text>
                  <Text style={styles.timestamp}>· {selectedPost.timestamp}</Text>
                </View>
                <Text style={styles.postText}>{selectedPost.content}</Text>
                <View style={styles.postActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleAddComment}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color="#B3B3B3" />
                    <Text style={styles.actionText}>{selectedPost.comments}</Text>
                  </TouchableOpacity>
                  <View style={styles.voteContainer}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={handleLike}
                    >
                      <Ionicons 
                        name="thumbs-up" 
                        size={20} 
                        color={selectedPost.isLiked ? "#1DB954" : "#B3B3B3"} 
                      />
                    </TouchableOpacity>
                    <Text style={[
                      styles.voteText,
                      (selectedPost.likes - selectedPost.reposts) > 0 && styles.positiveVote,
                      (selectedPost.likes - selectedPost.reposts) < 0 && styles.negativeVote
                    ]}>{selectedPost.likes - selectedPost.reposts}</Text>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={handleRepost}
                    >
                      <Ionicons 
                        name="thumbs-down" 
                        size={20} 
                        color={selectedPost.isReposted ? "#FF4444" : "#B3B3B3"} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.commentsSection}>
            <Text style={styles.commentsSectionTitle}>
              {comments.length > 0 
                ? `Comments (${comments.length})` 
                : 'No comments yet'}
            </Text>
          </View>
          
          {isLoadingComments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1DB954" />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : (
            <FlatList
              ref={commentsScrollViewRef}
              data={comments}
              renderItem={renderCommentItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              onScrollToIndexFailed={info => {
                console.log('Failed to scroll to index', info);
                // Fallback for failed scrolling
                setTimeout(() => {
                  if (commentsScrollViewRef.current && comments.length > 0) {
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
          )}
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.addCommentButton}
              onPress={handleAddComment}
            >
              <Ionicons name="chatbubble-outline" size={20} color="white" />
              <Text style={styles.addCommentButtonText}>Add a comment</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        onSubmit={handleCommentSubmit}
        postId={selectedPost?.id || ''}
        title="Add Comment"
      />
      
      {/* Reply Modal */}
      <CommentModal
        visible={replyModalVisible}
        onClose={() => setReplyModalVisible(false)}
        onSubmit={handleReplySubmit}
        postId={selectedPost?.id || ''}
        title="Reply to Comment"
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
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
    color: 'white',
  },
  headerPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#B3B3B3',
    marginTop: 10,
  },
  postContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  post: {
    flexDirection: 'row',
    padding: 16,
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
  commentsList: {
    flexGrow: 1,
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  highlightedComment: {
    backgroundColor: '#282828',
  },
  commentHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  commentProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#B3B3B3',
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#282828',
    padding: 16,
    paddingBottom: 24,
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DB954',
    padding: 12,
    borderRadius: 25,
  },
  addCommentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 