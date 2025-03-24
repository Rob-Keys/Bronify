import { Post } from './types';
import { getPosts } from './postService';

// Get all user posts (both regular posts and comments)
export const getUserPosts = async (userHandle: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    const userPosts: Post[] = [];
    
    // Function to collect posts/comments by user recursively
    const collectUserItems = (items: Post[]) => {
      items.forEach(item => {
        if (item.handle === userHandle) {
          userPosts.push(item);
        }
        
        // Check for user's comments
        if (item.commentsList && item.commentsList.length > 0) {
          collectUserItems(item.commentsList);
        }
      });
    };
    
    // Collect from all top level posts
    collectUserItems(posts);
    
    return userPosts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
}; 