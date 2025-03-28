import { GNEWS_API_KEY } from '../../env.ts';

// GNews API configuration
const GNEWS_API_URL = 'https://gnews.io/api/v4/search';

console.log('GNEWS_API_KEY', GNEWS_API_KEY);

// Cache configuration
interface NewsCache {
  data: NewsItem[] | null;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

// Initialize cache
const newsCache: NewsCache = {
  data: null,
  timestamp: 0,
  ttl: 86400000 // 24 hours in milliseconds
};

export interface NewsItem {
  id: number;
  title: string;
  source: string;
  timestamp: string;
  date: string;
  url: string;
}

/**
 * Formats a date as a relative time string (e.g. "2h ago", "3d ago")
 */
function getRelativeTimeString(pubDate: Date): string {
  try {
    const now = new Date();
    
    // Ensure both dates are valid
    if (isNaN(pubDate.getTime()) || isNaN(now.getTime())) {
      console.warn('Invalid date detected in getRelativeTimeString');
      return '1h ago'; // Default fallback
    }
    
    const diffMs = now.getTime() - pubDate.getTime();
    
    // Sanity check - if time difference is negative or too large, something's wrong
    if (diffMs < 0 || diffMs > 1000 * 60 * 60 * 24 * 365) {
      console.warn(`Suspicious time difference: ${diffMs}ms`);
      return '1h ago'; // Default fallback
    }
    
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    
    if (diffWeek > 0) {
      return `${diffWeek}w ago`;
    } else if (diffDay > 0) {
      return `${diffDay}d ago`;
    } else if (diffHour > 0) {
      return `${diffHour}h ago`;
    } else if (diffMin > 0) {
      return `${diffMin}m ago`;
    } else if (diffSec > 10) {
      // Only show "just now" if it's really recent (more than 10 seconds is shown as "30s ago" etc)
      return `${diffSec}s ago`;
    } else {
      return `just now`;
    }
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return '1h ago'; // Safe fallback
  }
}

/**
 * Check if the cache is valid
 */
function isCacheValid(): boolean {
  return (
    newsCache.data !== null && 
    newsCache.timestamp > 0 && 
    Date.now() - newsCache.timestamp < newsCache.ttl
  );
}

/**
 * Fetches the latest news articles about LeBron James using GNews API
 */
export async function getLebronNews(): Promise<NewsItem[]> {
  try {
    // Check cache first
    if (isCacheValid()) {
      console.log('Returning cached LeBron news data');
      return newsCache.data!;
    }
    
    console.log('Fetching LeBron news from GNews API');
    
    // Parameters for the GNews API request
    const params = new URLSearchParams({
      q: 'LeBron James',     // Search query
      lang: 'en',            // English articles only
      country: 'us',         // US news sources
      max: '6',              // Number of articles to fetch
      apikey: GNEWS_API_KEY
    });
    
    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Make the request to GNews API
    const response = await fetch(`${GNEWS_API_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error response body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    console.log('Successfully fetched news data from GNews');
    
    // Format the data to match our frontend expectations
    const formattedNews: NewsItem[] = data.articles?.map((article: any, index: number) => {
      // Parse the published date
      let publishedDate = new Date();
      let relativeTime = '1h ago'; // Default value
      
      if (article.publishedAt) {
        try {
          // The date string format from GNews API should be ISO 8601 format
          publishedDate = new Date(article.publishedAt);
          console.log(`Parsed date: ${publishedDate} from ${article.publishedAt}`);
          
          // Ensure the date is valid
          if (!isNaN(publishedDate.getTime())) {
            relativeTime = getRelativeTimeString(publishedDate);
          } else {
            console.warn(`Invalid date parsed from: ${article.publishedAt}`);
          }
        } catch (err) {
          console.error(`Error parsing date ${article.publishedAt}:`, err);
        }
      }
      
      return {
        id: index + 1,
        title: article.title || 'No Title',
        source: article.source?.name || 'Unknown Source',
        timestamp: relativeTime,
        date: article.publishedAt || '',
        url: article.url || ''
      };
    }) || [];
    
    // Update cache
    newsCache.data = formattedNews;
    newsCache.timestamp = Date.now();
    console.log('News data cached for 24 hours');
    
    return formattedNews;
  } catch (error: unknown) {
    // Provide more detailed error information
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error('Network request failed. Check your internet connection.');
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request timed out after 30 seconds');
    } else {
      console.error('Error fetching LeBron news:', error);
    }
    
    // If we have cached data and encountered an error, return the cached data
    if (newsCache.data !== null) {
      console.log('Returning cached data after fetch error');
      return newsCache.data;
    }
    
    // Return empty array in case of error with no cache
    return [];
  }
}

/**
 * Force refresh the news cache
 */
export function refreshNewsCache(): void {
  console.log('Clearing news cache');
  newsCache.data = null;
  newsCache.timestamp = 0;
}

export default {
  getLebronNews,
  refreshNewsCache
}; 