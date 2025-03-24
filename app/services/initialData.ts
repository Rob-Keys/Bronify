import { Post } from './types';
import { getRelativeTime } from './types';

// Demo posts for initial data
export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    username: 'John Doe',
    handle: '@johndoe',
    profileImage: 'default_pfp',
    content: 'Just released my new album! 🎵 Check it out on Bronify! #NewMusic #Bronify',
    timestamp: getRelativeTime(Date.now() - 7200000), // 2 hours ago
    createdAt: Date.now() - 7200000,
    likes: 1234,
    dislikes: 0,
    comments: 2,
    commentsList: [
      {
        id: '101',
        username: 'Jane Smith',
        handle: '@janesmith',
        profileImage: 'default_pfp',
        content: 'This is amazing! Can\'t wait to listen to it!',
        timestamp: getRelativeTime(Date.now() - 3600000), // 1 hour ago
        createdAt: Date.now() - 3600000,
        likes: 15,
        dislikes: 2,
        comments: 0,
        commentsList: [],
        isLiked: false,
        isDisliked: false,
        isComment: true,
        parentId: '1',
      },
      {
        id: '102',
        username: 'Mike Johnson',
        handle: '@mikej',
        profileImage: 'default_pfp',
        content: 'Congratulations on the release! 🎉',
        timestamp: getRelativeTime(Date.now() - 1800000), // 30 minutes ago
        createdAt: Date.now() - 1800000,
        likes: 7,
        dislikes: 0,
        comments: 0,
        commentsList: [],
        isLiked: false,
        isDisliked: false,
        isComment: true,
        parentId: '1',
      }
    ],
    isLiked: false,
    isDisliked: false,
    isComment: false,
    parentId: null,
  },
  {
    id: '2',
    username: 'Jane Smith',
    handle: '@janesmith',
    profileImage: 'default_pfp',
    content: 'This new playlist is 🔥! Perfect for my workout session. #WorkoutMusic #Bronify',
    timestamp: getRelativeTime(Date.now() - 14400000), // 4 hours ago
    createdAt: Date.now() - 14400000,
    likes: 856,
    dislikes: 0,
    comments: 1,
    commentsList: [
      {
        id: '201',
        username: 'LeBron Fan',
        handle: '@lebronfan',
        profileImage: 'default_pfp',
        content: 'Mind sharing the playlist? I need some new workout music!',
        timestamp: getRelativeTime(Date.now() - 7200000), // 2 hours ago
        createdAt: Date.now() - 7200000,
        likes: 23,
        dislikes: 1,
        comments: 0,
        commentsList: [],
        isLiked: false,
        isDisliked: false,
        isComment: true,
        parentId: '2',
      }
    ],
    isLiked: true,
    isDisliked: false,
    isComment: false,
    parentId: null,
  },
  {
    id: '3',
    username: 'Mike Johnson',
    handle: '@mikej',
    profileImage: 'default_pfp',
    content: 'Who else is excited for the new album release? 🎸 #NewMusic #Bronify',
    timestamp: getRelativeTime(Date.now() - 21600000), // 6 hours ago
    createdAt: Date.now() - 21600000,
    likes: 2341,
    dislikes: 0,
    comments: 0,
    commentsList: [],
    isLiked: false,
    isDisliked: false,
    isComment: false,
    parentId: null,
  },
]; 