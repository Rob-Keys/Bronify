export interface Post {
  id: string;
  content: string;
  username: string;
  handle: string;
  timestamp: string;
  createdAt: number; // Unix timestamp in milliseconds
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
  comments: number;
  commentsList: Post[];
  isComment: boolean;
  parentId: string | null;
  profileImage?: string;
}

// Helper function to calculate relative time
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return 'now';
  }
  
  // Convert to minutes
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  // Convert to hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  
  // Convert to days
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }
  
  // Convert to weeks
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w`;
  }
  
  // Convert to months
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo`;
  }
  
  // Convert to years
  const years = Math.floor(days / 365);
  return `${years}y`;
}; 