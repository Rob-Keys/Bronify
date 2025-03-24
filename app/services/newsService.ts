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
    console.log(`Fetching news from: ${API_BASE_URL}/lebron/news`);
    
    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Call the Flask backend endpoint for LeBron news with timeout
    const response = await fetch(`${API_BASE_URL}/lebron/news`, {
      signal: controller.signal
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
    console.log('Successfully fetched news data');
    
    return data.data || [];
  } catch (error) {
    // Provide more detailed error information
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error(`Network request failed. API_BASE_URL: ${API_BASE_URL}. Check your connection and backend server.`);
    } else if (error.name === 'AbortError') {
      console.error('Request timed out after 10 seconds');
    } else {
      console.error('Error fetching LeBron news:', error);
    }
    
    // Return empty array in case of error
    return [];
  }
}

export default {
  getLebronNews
}; 