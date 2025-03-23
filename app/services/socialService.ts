import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Comment {
  id: string;
  username: string;
  handle: string;
  content: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
  replies: Comment[];
}

export interface Post {
  id: string;
  username: string;
  handle: string;
  profileImage: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  commentsList: Comment[];
  reposts: number;
  isLiked: boolean;
  isReposted: boolean;
}

// Demo posts for initial data
const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    username: 'John Doe',
    handle: '@johndoe',
    profileImage: 'default_pfp',
    content: 'Just released my new album! 🎵 Check it out on Bronify! #NewMusic #Bronify',
    timestamp: '2h',
    likes: 1234,
    comments: 2,
    commentsList: [
      {
        id: '101',
        username: 'Jane Smith',
        handle: '@janesmith',
        content: 'This is amazing! Can\'t wait to listen to it!',
        timestamp: '1h',
        likes: 15,
        dislikes: 2,
        isLiked: false,
        isDisliked: false,
        replies: []
      },
      {
        id: '102',
        username: 'Mike Johnson',
        handle: '@mikej',
        content: 'Congratulations on the release! 🎉',
        timestamp: '30m',
        likes: 7,
        dislikes: 0,
        isLiked: false,
        isDisliked: false,
        replies: []
      }
    ],
    reposts: 45,
    isLiked: false,
    isReposted: false,
  },
  {
    id: '2',
    username: 'Jane Smith',
    handle: '@janesmith',
    profileImage: 'default_pfp',
    content: 'This new playlist is 🔥! Perfect for my workout session. #WorkoutMusic #Bronify',
    timestamp: '4h',
    likes: 856,
    comments: 1,
    commentsList: [
      {
        id: '201',
        username: 'LeBron Fan',
        handle: '@lebronfan',
        content: 'Mind sharing the playlist? I need some new workout music!',
        timestamp: '2h',
        likes: 23,
        dislikes: 1,
        isLiked: false,
        isDisliked: false,
        replies: []
      }
    ],
    reposts: 23,
    isLiked: true,
    isReposted: false,
  },
  {
    id: '3',
    username: 'Mike Johnson',
    handle: '@mikej',
    profileImage: 'default_pfp',
    content: 'Who else is excited for the new album release? 🎸 #NewMusic #Bronify',
    timestamp: '6h',
    likes: 2341,
    comments: 0,
    commentsList: [],
    reposts: 89,
    isLiked: false,
    isReposted: true,
  },
];

const STORAGE_KEY = 'bronify_social_posts';

// Get all posts
export const getPosts = async (): Promise<Post[]> => {
  try {
    const storedPosts = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedPosts) {
      return JSON.parse(storedPosts);
    }
    // Initialize with default posts if none exist
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
    return INITIAL_POSTS;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return INITIAL_POSTS;
  }
};

// Add a new post
export const addPost = async (content: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    
    const newPost: Post = {
      id: Date.now().toString(),
      username: 'LeBron Fan',
      handle: '@lebronfan',
      profileImage: 'default_pfp',
      content,
      timestamp: 'now',
      likes: 0,
      comments: 0,
      commentsList: [],
      reposts: 0,
      isLiked: false,
      isReposted: false
    };
    
    const updatedPosts = [newPost, ...posts];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error adding post:', error);
    throw error;
  }
};

// Toggle like on a post
export const toggleLike = async (postId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likes: isLiked ? post.likes + 1 : post.likes - 1,
          // If liking and the post was disliked, remove the dislike
          isReposted: isLiked ? false : post.isReposted,
          reposts: isLiked && post.isReposted ? post.reposts - 1 : post.reposts
        };
      }
      return post;
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Toggle repost on a post
export const toggleRepost = async (postId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const isReposted = !post.isReposted;
        return {
          ...post,
          isReposted,
          reposts: isReposted ? post.reposts + 1 : post.reposts - 1,
          // If disliking and the post was liked, remove the like
          isLiked: isReposted ? false : post.isLiked,
          likes: isReposted && post.isLiked ? post.likes - 1 : post.likes
        };
      }
      return post;
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error toggling repost:', error);
    throw error;
  }
};

// Add a comment to a post
export const addComment = async (postId: string, commentContent: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newComment: Comment = {
          id: Date.now().toString(),
          username: 'LeBron Fan',
          handle: '@lebronfan',
          content: commentContent,
          timestamp: 'now',
          likes: 0,
          dislikes: 0,
          isLiked: false,
          isDisliked: false,
          replies: []
        };
        
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [...post.commentsList, newComment]
        };
      }
      return post;
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Toggle like on a comment
export const toggleCommentLike = async (postId: string, commentId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const updatedComments = post.commentsList.map(comment => {
          if (comment.id === commentId) {
            const isLiked = !comment.isLiked;
            return {
              ...comment,
              isLiked,
              likes: isLiked ? comment.likes + 1 : comment.likes - 1,
              // If liking and the comment was disliked, remove the dislike
              isDisliked: isLiked ? false : comment.isDisliked,
              dislikes: isLiked && comment.isDisliked ? comment.dislikes - 1 : comment.dislikes
            };
          }
          return comment;
        });

        return {
          ...post,
          commentsList: updatedComments
        };
      }
      return post;
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error toggling comment like:', error);
    throw error;
  }
};

// Toggle dislike on a comment
export const toggleCommentDislike = async (postId: string, commentId: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const updatedComments = post.commentsList.map(comment => {
          if (comment.id === commentId) {
            const isDisliked = !comment.isDisliked;
            return {
              ...comment,
              isDisliked,
              dislikes: isDisliked ? comment.dislikes + 1 : comment.dislikes - 1,
              // If disliking and the comment was liked, remove the like
              isLiked: isDisliked ? false : comment.isLiked,
              likes: isDisliked && comment.isLiked ? comment.likes - 1 : comment.likes
            };
          }
          return comment;
        });

        return {
          ...post,
          commentsList: updatedComments
        };
      }
      return post;
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error toggling comment dislike:', error);
    throw error;
  }
};

// Reply to a comment
export const addCommentReply = async (postId: string, commentId: string, replyContent: string): Promise<Post[]> => {
  try {
    const posts = await getPosts();
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const updatedComments = post.commentsList.map(comment => {
          if (comment.id === commentId) {
            const newReply: Comment = {
              id: Date.now().toString(),
              username: 'LeBron Fan',
              handle: '@lebronfan',
              content: replyContent,
              timestamp: 'now',
              likes: 0,
              dislikes: 0,
              isLiked: false,
              isDisliked: false,
              replies: []
            };
            
            return {
              ...comment,
              replies: [...comment.replies, newReply]
            };
          }
          return comment;
        });

        return {
          ...post,
          commentsList: updatedComments
        };
      }
      return post;
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts;
  } catch (error) {
    console.error('Error adding comment reply:', error);
    throw error;
  }
};

// Get comments for a specific post
export const getComments = async (postId: string): Promise<Comment[]> => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      return [];
    }
    
    return post.commentsList;
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

// Get all comments made by a specific user
export const getUserComments = async (userHandle: string): Promise<{ comment: Comment, postId: string }[]> => {
  try {
    const posts = await getPosts();
    const userComments: { comment: Comment, postId: string }[] = [];
    
    posts.forEach(post => {
      const comments = post.commentsList.filter(comment => comment.handle === userHandle);
      comments.forEach(comment => {
        userComments.push({ 
          comment, 
          postId: post.id 
        });
      });
    });
    
    return userComments;
  } catch (error) {
    console.error('Error getting user comments:', error);
    return [];
  }
}; 