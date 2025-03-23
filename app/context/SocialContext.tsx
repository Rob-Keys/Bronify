import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { 
  Post, 
  Comment, 
  getPosts, 
  toggleLike, 
  toggleRepost, 
  addComment, 
  addPost, 
  getComments,
  toggleCommentLike, 
  toggleCommentDislike, 
  addCommentReply 
} from '@/app/services/socialService';

interface SocialContextType {
  // State
  posts: Post[];
  isLoading: boolean;
  
  // Actions
  loadPosts: () => Promise<void>;
  createPost: (content: string) => Promise<Post[]>;
  likePost: (postId: string) => Promise<void>;
  repostPost: (postId: string) => Promise<void>;
  addPostComment: (postId: string, comment: string) => Promise<void>;
  getPostComments: (postId: string) => Promise<Comment[]>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  dislikeComment: (postId: string, commentId: string) => Promise<void>;
  replyToComment: (postId: string, commentId: string, content: string) => Promise<void>;
}

const SocialContext = createContext<SocialContextType | null>(null);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const postsData = await getPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (content: string) => {
    if (!content.trim()) {
      throw new Error('Post content cannot be empty');
    }

    try {
      const updatedPosts = await addPost(content);
      setPosts(updatedPosts);
      return updatedPosts;
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
      throw error;
    }
  };

  const likePost = async (postId: string) => {
    try {
      const updatedPosts = await toggleLike(postId);
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
      throw error;
    }
  };

  const repostPost = async (postId: string) => {
    try {
      const updatedPosts = await toggleRepost(postId);
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error reposting:', error);
      Alert.alert('Error', 'Failed to dislike post. Please try again.');
      throw error;
    }
  };

  const addPostComment = async (postId: string, comment: string) => {
    try {
      const updatedPosts = await addComment(postId, comment);
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
      throw error;
    }
  };

  const getPostComments = async (postId: string) => {
    try {
      return await getComments(postId);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
      throw error;
    }
  };

  const likeComment = async (postId: string, commentId: string) => {
    try {
      const updatedPosts = await toggleCommentLike(postId, commentId);
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Failed to like comment. Please try again.');
      throw error;
    }
  };

  const dislikeComment = async (postId: string, commentId: string) => {
    try {
      const updatedPosts = await toggleCommentDislike(postId, commentId);
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error disliking comment:', error);
      Alert.alert('Error', 'Failed to dislike comment. Please try again.');
      throw error;
    }
  };

  const replyToComment = async (postId: string, commentId: string, content: string) => {
    try {
      const updatedPosts = await addCommentReply(postId, commentId, content);
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Failed to add reply. Please try again.');
      throw error;
    }
  };

  return (
    <SocialContext.Provider
      value={{
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
        replyToComment,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}

export default SocialProvider; 