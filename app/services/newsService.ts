// Import the API base URL from the nbaStats service to keep it consistent
import { API_BASE_URL } from './nbaStats';

export interface NewsItem {
  id: number;
  title: string;
  source: string;
  timestamp: string;
  date: string;
  url: string;
}

/**
 * Fetches the latest news articles about LeBron James
 */
export async function getLebronNews(): Promise<NewsItem[]> {
  try {
    console.log(`Fetching LeBron news from: ${API_BASE_URL}/lebron/news`);
    
    // Call the Flask backend endpoint for LeBron news
    const response = await fetch(`${API_BASE_URL}/lebron/news`);
    
    console.log(`News API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error response body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    console.log('Successfully fetched news data:', data);
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching LeBron news:', error);
    // Return empty array in case of error
    return [];
  }
}

export default {
  getLebronNews
}; 