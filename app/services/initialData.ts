import { Post } from './types';
import { getRelativeTime } from './types';

// Helper function to create timestamps at different intervals in the past
const getTimestamp = (daysAgo: number, hoursAgo = 0, minutesAgo = 0): number => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.getTime();
};

// Demo posts for initial data
export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    username: 'LeBron Fan',
    handle: 'lebronfan',
    content: 'LeBron just had another triple-double! 👑 The GOAT keeps proving why he deserves more MVPs. What do you all think?',
    createdAt: getTimestamp(0, 0, 30), // 30 minutes ago
    likes: 42,
    dislikes: 5,
    isLiked: false,
    isDisliked: false,
    comments: 3,
    commentsList: [
      {
        id: '1-1',
        username: 'LakerNation',
        handle: 'lakernation',
        content: 'He\'s carrying the team! Should have won MVP last season too.',
        createdAt: getTimestamp(0, 0, 20), // 20 minutes ago
        likes: 18,
        dislikes: 2,
        isLiked: false,
        isDisliked: false,
        comments: 1,
        commentsList: [
          {
            id: '1-1-1',
            username: 'BasketballGuru',
            handle: 'bballguru',
            content: 'His efficiency numbers were incredible too. Age is just a number for the King!',
            createdAt: getTimestamp(0, 0, 10), // 10 minutes ago
            likes: 7,
            dislikes: 0,
            isLiked: false,
            isDisliked: false,
            comments: 0,
            commentsList: [],
            isComment: true,
            parentId: '1-1',
            profileImage: 'https://randomuser.me/api/portraits/men/22.jpg'
          }
        ],
        isComment: true,
        parentId: '1',
        profileImage: 'https://randomuser.me/api/portraits/women/12.jpg'
      },
      {
        id: '1-2',
        username: 'StatAnalyst',
        handle: 'statsgeek',
        content: 'His PER this season is off the charts. Historical numbers for a player his age.',
        createdAt: getTimestamp(0, 0, 15), // 15 minutes ago
        likes: 11,
        dislikes: 1,
        isLiked: false,
        isDisliked: false,
        comments: 0,
        commentsList: [],
        isComment: true,
        parentId: '1',
        profileImage: 'https://randomuser.me/api/portraits/men/32.jpg'
      }
    ],
    isComment: false,
    parentId: null,
    profileImage: 'https://randomuser.me/api/portraits/men/11.jpg'
  },
  {
    id: '2',
    username: 'Hoops Expert',
    handle: 'hoopsexpert',
    content: 'Looking at LeBron\'s game last night: 30 points, 12 assists, 8 rebounds on 65% shooting. Still can\'t believe he\'s doing this in year 21!',
    createdAt: getTimestamp(1, 2, 0), // 1 day and 2 hours ago
    likes: 87,
    dislikes: 3,
    isLiked: false,
    isDisliked: false,
    comments: 2,
    commentsList: [
      {
        id: '2-1',
        username: 'SportsFan23',
        handle: 'sportsfan23',
        content: 'The man is not human! Can\'t wait to see what he does in the playoffs.',
        createdAt: getTimestamp(1, 1, 0), // 1 day and 1 hour ago
        likes: 22,
        dislikes: 0,
        isLiked: false,
        isDisliked: false,
        comments: 0,
        commentsList: [],
        isComment: true,
        parentId: '2',
        profileImage: 'https://randomuser.me/api/portraits/women/23.jpg'
      }
    ],
    isComment: false,
    parentId: null,
    profileImage: 'https://randomuser.me/api/portraits/men/42.jpg'
  },
  {
    id: '3',
    username: 'NBA Insider',
    handle: 'nbainsider',
    content: 'Sources tell me LeBron is putting in extra work with Bronny in private workouts. Father-son duo in the NBA looking more likely!',
    createdAt: getTimestamp(3, 0, 0), // 3 days ago
    likes: 134,
    dislikes: 12,
    isLiked: false,
    isDisliked: false,
    comments: 0,
    commentsList: [],
    isComment: false,
    parentId: null,
    profileImage: 'https://randomuser.me/api/portraits/women/42.jpg'
  },
  {
    id: '4',
    username: 'Lakers Legend',
    handle: 'lakerslegend',
    content: 'Just watched LeBron\'s documentary again. His journey from Akron to becoming one of the greatest ever is truly inspirational.',
    createdAt: getTimestamp(5, 12, 0), // 5 days and 12 hours ago
    likes: 67,
    dislikes: 8,
    isLiked: false,
    isDisliked: false,
    comments: 0,
    commentsList: [],
    isComment: false,
    parentId: null,
    profileImage: 'https://randomuser.me/api/portraits/men/52.jpg'
  },
  {
    id: '5',
    username: 'Basketball Historian',
    handle: 'bballhistorian',
    content: 'When we talk about all-time rankings, LeBron\'s longevity has to be a major factor. No player has maintained this level of excellence for this long.',
    createdAt: getTimestamp(7, 0, 0), // 7 days ago
    likes: 92,
    dislikes: 15,
    isLiked: false,
    isDisliked: false,
    comments: 0,
    commentsList: [],
    isComment: false,
    parentId: null,
    profileImage: 'https://randomuser.me/api/portraits/men/62.jpg'
  }
]; 