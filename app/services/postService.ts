import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, getRelativeTime } from './types';
import { INITIAL_POSTS } from './initialData';

const STORAGE_KEY = 'bronify_social_posts';

// Get all posts
export const getPosts = async (): Promise<Post[]> => {
  try {
    const storedPosts = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts);
        
        // Validate that parsedPosts is an array
        if (!Array.isArray(parsedPosts)) {
          console.error('Stored posts is not an array, returning default posts');
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
          return INITIAL_POSTS;
        }
        
        return parsedPosts;
      } catch (parseError) {
        console.error('Error parsing stored posts:', parseError);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
        return INITIAL_POSTS;
      }
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
    return INITIAL_POSTS;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return INITIAL_POSTS;
  }
};

// Add a new post
export const addPost = async (content: string): Promise<Post> => {
  try {
    const posts = await getPosts();
    
    // Create new post
    const newPost: Post = {
      id: Date.now().toString(),
      content,
      username: 'Bronify User',
      handle: 'user',
      profileImage: 'default_pfp',
      createdAt: Date.now(), // Only set createdAt timestamp
      likes: 0,
      dislikes: 0,
      comments: 0,
      commentsList: [],
      isLiked: false,
      isDisliked: false,
      isComment: false,
      parentId: null,
    };
    
    // Add to posts array
    const updatedPosts = [newPost, ...posts];
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    
    return newPost;
  } catch (error) {
    console.error('Error adding post:', error);
    throw error;
  }
};

// Toggle like for any post
export const togglePostLike = async (postId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    
    const toggleLikeRecursively = (postsList: Post[]): [boolean, Post[]] => {
      return postsList.reduce(
        ([found, updatedPosts]: [boolean, Post[]], currentPost: Post): [boolean, Post[]] => {
          if (found) return [true, [...updatedPosts, currentPost]];
          
          if (currentPost.id === postId) {
            const isLiked = !currentPost.isLiked;
            const updatedPost = {
              ...currentPost,
              isLiked,
              likes: isLiked ? currentPost.likes + 1 : currentPost.likes - 1,
              isDisliked: isLiked ? false : currentPost.isDisliked,
              dislikes: isLiked && currentPost.isDisliked ? currentPost.dislikes - 1 : currentPost.dislikes
            };
            
            return [true, [...updatedPosts, updatedPost]];
          }
          
          if (currentPost.commentsList && currentPost.commentsList.length > 0) {
            const [foundInComments, updatedComments] = toggleLikeRecursively(currentPost.commentsList);
            
            if (foundInComments) {
              return [
                true, 
                [
                  ...updatedPosts, 
                  {
                    ...currentPost,
                    commentsList: updatedComments
                  }
                ]
              ];
            }
          }
          
          return [found, [...updatedPosts, currentPost]];
        },
        [false, []] as [boolean, Post[]]
      );
    };
    
    const [found, updatedPosts] = toggleLikeRecursively(posts);
    
    if (!found) {
      throw new Error('Post not found');
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Toggle dislike for any post
export const togglePostDislike = async (postId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    
    const toggleDislikeRecursively = (postsList: Post[]): [boolean, Post[]] => {
      return postsList.reduce(
        ([found, updatedPosts]: [boolean, Post[]], currentPost: Post): [boolean, Post[]] => {
          if (found) return [true, [...updatedPosts, currentPost]];
          
          if (currentPost.id === postId) {
            const isDisliked = !currentPost.isDisliked;
            const updatedPost = {
              ...currentPost,
              isDisliked,
              dislikes: isDisliked ? currentPost.dislikes + 1 : currentPost.dislikes - 1,
              isLiked: isDisliked ? false : currentPost.isLiked,
              likes: isDisliked && currentPost.isLiked ? currentPost.likes - 1 : currentPost.likes
            };
            
            return [true, [...updatedPosts, updatedPost]];
          }
          
          if (currentPost.commentsList && currentPost.commentsList.length > 0) {
            const [foundInComments, updatedComments] = toggleDislikeRecursively(currentPost.commentsList);
            
            if (foundInComments) {
              return [
                true, 
                [
                  ...updatedPosts, 
                  {
                    ...currentPost,
                    commentsList: updatedComments
                  }
                ]
              ];
            }
          }
          
          return [found, [...updatedPosts, currentPost]];
        },
        [false, []] as [boolean, Post[]]
      );
    };
    
    const [found, updatedPosts] = toggleDislikeRecursively(posts);
    
    if (!found) {
      throw new Error('Post not found');
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error toggling dislike:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    
    const isTopLevelPost = posts.some(p => p.id === postId);
    if (isTopLevelPost) {
      const updatedPosts = posts.filter(p => p.id !== postId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
      return updatedPosts;
    }
    
    const removeCommentRecursively = (postsList: Post[]): [boolean, Post[]] => {
      return postsList.reduce(
        ([found, updatedPosts]: [boolean, Post[]], currentPost: Post): [boolean, Post[]] => {
          if (found) return [true, [...updatedPosts, currentPost]];
          
          const commentIndex = currentPost.commentsList.findIndex(c => c.id === postId);
          if (commentIndex !== -1) {
            const updatedCommentsList = currentPost.commentsList.filter(c => c.id !== postId);
            const updatedPost = {
              ...currentPost,
              commentsList: updatedCommentsList,
              comments: currentPost.comments - 1
            };
            
            return [true, [...updatedPosts, updatedPost]];
          }
          
          if (currentPost.commentsList && currentPost.commentsList.length > 0) {
            const [foundInComments, updatedComments] = removeCommentRecursively(currentPost.commentsList);
            
            if (foundInComments) {
              return [
                true, 
                [
                  ...updatedPosts, 
                  {
                    ...currentPost,
                    commentsList: updatedComments
                  }
                ]
              ];
            }
          }
          
          return [found, [...updatedPosts, currentPost]];
        },
        [false, []] as [boolean, Post[]]
      );
    };
    
    const [found, updatedPosts] = removeCommentRecursively(posts);
    
    if (!found) {
      throw new Error('Post not found');
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Add a comment to a post or reply
export const addComment = async (parentId: string, content: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    
    // Create the new comment
    const newComment: Post = {
      id: Date.now().toString(),
      username: 'LeBron Fan',
      handle: '@lebronfan',
      profileImage: 'default_pfp',
      content,
      createdAt: Date.now(), // Only set createdAt timestamp
      likes: 0,
      dislikes: 0,
      comments: 0,
      commentsList: [],
      isLiked: false,
      isDisliked: false,
      isComment: true,
      parentId
    };
    
    // Function to add comment to a post recursively
    const addCommentToPost = (postsList: Post[]): [boolean, Post[]] => {
      return postsList.reduce(
        ([found, updatedPosts]: [boolean, Post[]], currentPost: Post): [boolean, Post[]] => {
          if (found) return [true, [...updatedPosts, currentPost]];
          
          if (currentPost.id === parentId) {
            // Found the parent post/comment, add the new comment to it
            const updatedPost = {
              ...currentPost,
              comments: currentPost.comments + 1,
              commentsList: [newComment, ...currentPost.commentsList]
            };
            
            return [true, [...updatedPosts, updatedPost]];
          }
          
          if (currentPost.commentsList && currentPost.commentsList.length > 0) {
            const [foundInComments, updatedComments] = addCommentToPost(currentPost.commentsList);
            
            if (foundInComments) {
              return [
                true, 
                [
                  ...updatedPosts, 
                  {
                    ...currentPost,
                    commentsList: updatedComments
                  }
                ]
              ];
            }
          }
          
          return [found, [...updatedPosts, currentPost]];
        },
        [false, []] as [boolean, Post[]]
      );
    };
    
    const [found, updatedPosts] = addCommentToPost(posts);
    
    if (!found) {
      throw new Error('Parent post not found');
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}; 