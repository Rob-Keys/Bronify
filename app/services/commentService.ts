import { Post } from './types';
import { getPosts } from './postService';

// Get all comments for a post (flat list)
export const getPostComments = async (postId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Get all comments recursively
    const getAllCommentsDeep = (comments: Post[]): Post[] => {
      let allComments: Post[] = [];
      
      for (const comment of comments) {
        allComments.push(comment);
        if (comment.commentsList && comment.commentsList.length > 0) {
          allComments = allComments.concat(getAllCommentsDeep(comment.commentsList));
        }
      }
      
      return allComments;
    };
    
    return getAllCommentsDeep(post.commentsList);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Get direct child comments for a post/comment
export const getDirectComments = async (parentId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    
    // If parent is a top-level post
    const post = posts.find(p => p.id === parentId);
    if (post) {
      return post.commentsList;
    }
    
    // If parent is a comment, search for it recursively
    const findParentAndGetComments = (commentsList: Post[]): Post[] | null => {
      for (const comment of commentsList) {
        if (comment.id === parentId) {
          return comment.commentsList;
        }
        
        if (comment.commentsList.length > 0) {
          const result = findParentAndGetComments(comment.commentsList);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };
    
    // Search in all posts
    for (const post of posts) {
      const result = findParentAndGetComments(post.commentsList);
      if (result) {
        return result;
      }
    }
    
    throw new Error('Parent not found');
  } catch (error) {
    console.error('Error fetching direct comments:', error);
    return [];
  }
};

// Get the specific post/comment by ID
export const getPost = async (postId: string): Promise<Post | null> => {
  try {
    const posts = await getPosts();
    
    // First check if it's a top-level post
    const post = posts.find(p => p.id === postId);
    if (post) {
      return post;
    }
    
    // If not, search in all comments recursively
    const findComment = (commentsList: Post[]): Post | null => {
      for (const comment of commentsList) {
        if (comment.id === postId) {
          return comment;
        }
        
        if (comment.commentsList && comment.commentsList.length > 0) {
          const result = findComment(comment.commentsList);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };
    
    // Search in all posts' comments
    for (const post of posts) {
      if (post.commentsList && post.commentsList.length > 0) {
        const result = findComment(post.commentsList);
        if (result) {
          return result;
        }
      }
    }
    
    throw new Error('Post not found');
  } catch (error) {
    console.error('Error retrieving post/comment:', error);
    throw error;
  }
}; 