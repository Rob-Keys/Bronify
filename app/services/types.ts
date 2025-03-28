export interface Post {
  id: string;
  content: string;
  username: string;
  handle: string;
  timestamp?: string; // Make timestamp optional as we'll calculate it dynamically
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
  
  // Sanity check - if time difference is negative or too large, something's wrong
  if (diff < 0 || diff > 1000 * 60 * 60 * 24 * 365 * 10) {
    console.warn(`Suspicious time difference: ${diff}ms`);
    return '1h ago';
  }
  
  if (seconds < 30) {
    return 'just now';
  }
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  
  // Convert to minutes
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  // Convert to hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  // Convert to days
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  
  // Convert to weeks
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }
  
  // Convert to months
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  
  // Convert to years
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}; 