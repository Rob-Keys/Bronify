import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Post } from '@/app/services/types';
import { 
  getPosts, 
  addPost, 
  togglePostLike, 
  togglePostDislike, 
  deletePost,
  addComment
} from '@/app/services/postService';
import { 
  getPostComments, 
  getDirectComments, 
  getPost 
} from '@/app/services/commentService';
import { getUserPosts } from '@/app/services/userService';

interface SocialContextType {
  posts: Post[];
  loadPosts: () => Promise<void>;
  createPost: (content: string) => Promise<void>;
  togglePostLike: (postId: string) => Promise<void>;
  togglePostDislike: (postId: string) => Promise<void>;
  getPostComments: (postId: string) => Promise<Post[]>;
  getPost: (postId: string) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<void>;
  isCurrentUserPost: (post: Post) => boolean;
  addComment: (parentId: string, content: string) => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createPost = async (content: string) => {
    try {
      await addPost(content);
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const handleAddComment = async (parentId: string, content: string) => {
    try {
      await addComment(parentId, content);
      await loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleVote = async (postId: string, isUpvote: boolean) => {
    try {
      if (isUpvote) {
        await togglePostLike(postId);
      } else {
        await togglePostDislike(postId);
      }
      await loadPosts();
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote on post');
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post');
    }
  };

  const getComments = async (postId: string): Promise<Post[]> => {
    try {
      return await getPostComments(postId);
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  };

  const getSpecificPost = async (postId: string): Promise<Post | null> => {
    try {
      return await getPost(postId);
    } catch (error) {
      console.error('Error getting post:', error);
      return null;
    }
  };

  const isCurrentUserPost = (post: Post): boolean => {
    return post.handle === '@lebronfan';
  };

  return (
    <SocialContext.Provider
      value={{
        posts,
        loadPosts,
        createPost,
        togglePostLike: (postId) => handleVote(postId, true),
        togglePostDislike: (postId) => handleVote(postId, false),
        getPostComments: getComments,
        getPost: getSpecificPost,
        deletePost: handleDelete,
        isCurrentUserPost,
        addComment: handleAddComment,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}

export default SocialProvider; 