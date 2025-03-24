import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/app/services/types';
import { useSocial } from '@/app/context/SocialContext';
import { useTheme } from '@/app/context/ThemeContext';

export default function ReplyScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    posts, 
    isLoading, 
    loadPosts, 
    addComment,
    togglePostLike,
    togglePostDislike,
    deletePost,
    isCurrentUserPost,
    getPost
  } = useSocial();
  
  const [mainPost, setMainPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [parentPostId, setParentPostId] = useState<string | null>(null);

  useEffect(() => {
    loadPostData();
  }, [params.replyId]);

  const loadPostData = async () => {
    try {
      if (typeof params.replyId === 'string') {
        // Find the main post in our posts list
        const post = posts.find(p => p.id === params.replyId);
        if (post) {
          setMainPost(post);
          setReplies(post.commentsList || []);
        } else {
          // If not found in our list, try to fetch it
          const fetchedPost = await getPost(params.replyId);
          if (fetchedPost) {
            setMainPost(fetchedPost);
            setReplies(fetchedPost.commentsList || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post. Please try again.');
    }
  };

  const handleReplyButtonPress = (post: Post) => {
    setParentPostId(post.id);
    setReplyModalVisible(true);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !mainPost) return;

    try {
      setIsPosting(true);
      await addComment(mainPost.id, replyContent);
      setReplyContent('');
      setReplyModalVisible(false);
      // Reload the post data to get the new reply
      loadPostData();
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'Failed to post reply. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await togglePostLike(postId);
      loadPostData(); // Reload to get updated counts
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };

  const handleDislike = async (postId: string) => {
    try {
      await togglePostDislike(postId);
      loadPostData(); // Reload to get updated counts
    } catch (error) {
      console.error('Error disliking post:', error);
      Alert.alert('Error', 'Failed to dislike post. Please try again.');
    }
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
              loadPostData(); // Reload to update the list
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderPost = (post: Post, isFullScreen = false) => {
    const totalRepliesCount = post.commentsList?.length || 0;
    
    const PostContent = () => (
      <View style={[
        styles.post, 
        { borderBottomColor: colors.border }
      ]}>
        <Image source={require('@/assets/images/default_pfp.jpg')} style={styles.postProfileImage} />
        <View style={styles.postContent}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <Text style={[styles.username, { color: colors.text }]}>{post.username}</Text>
              <Text style={[styles.handle, { color: colors.neutral }]}>{post.handle}</Text>
              <Text style={[styles.timestamp, { color: colors.neutral }]}>· {post.timestamp}</Text>
            </View>
            {isCurrentUserPost(post.handle) && isFullScreen && (
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => handleDeletePost(post.id)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.negative} />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={[styles.postText, { color: colors.text }]}>{post.content}</Text>
          
          <View style={styles.postActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => isFullScreen ? setReplyModalVisible(true) : router.push({
                pathname: '/post',
                params: { 
                  postId: post.id
                }
              })}
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
                <Text style={[
                  styles.voteText,
                  { color: colors.neutral },
                  (post.likes - post.dislikes) > 0 && { color: colors.positive },
                  (post.likes - post.dislikes) < 0 && { color: colors.negative }
                ]}>
                  {post.likes - post.dislikes}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDislike(post.id)}
              >
                <Ionicons 
                  name="thumbs-down" 
                  size={20} 
                  color={post.isDisliked ? colors.negative : colors.neutral} 
                />
                <Text style={[
                  styles.voteText,
                  { color: colors.neutral },
                  (post.likes - post.dislikes) > 0 && { color: colors.positive },
                  (post.likes - post.dislikes) < 0 && { color: colors.negative }
                ]}>
                  {post.likes - post.dislikes}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );

    if (isFullScreen) {
      return <PostContent />;
    }

    return (
      <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/post',
          params: { 
            postId: post.id
          }
        })}
      >
        <PostContent />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reply</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.button} />
            <Text style={[styles.loadingText, { color: colors.neutral }]}>Loading post...</Text>
          </View>
        ) : mainPost ? (
          <>
            {renderPost(mainPost, true)}
            
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
                {renderPost(reply)}
              </React.Fragment>
            ))}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.neutral} />
            <Text style={[styles.emptyText, { color: colors.neutral }]}>Post not found</Text>
          </View>
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  post: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
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
    gap: 4,
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
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
  voteText: {
    fontSize: 14,
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
}); 