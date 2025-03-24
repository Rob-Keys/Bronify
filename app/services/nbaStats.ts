// The base URL for the Python Flask backend
// Use localhost with the special 10.0.2.2 IP for Android emulator
// or use your computer's IP if testing on a physical device
export const API_BASE_URL = 'http://10.0.2.2:5000/api'; // For Android emulator
// export const API_BASE_URL = 'http://localhost:5000/api'; // For iOS simulator
// export const API_BASE_URL = 'http://10.0.0.38:5000/api'; // Direct IP (might not work on all devices)

// In production, replace with your actual deployed API URL
// const API_BASE_URL = 'https://your-deployed-api.com/api';

interface GameStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  opponent: string;
  date: string;
}

interface SeasonStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}

export async function getLebronLastGame(): Promise<GameStats> {
  try {
    console.log(`Fetching last game from: ${API_BASE_URL}/lebron/last-game`);
    
    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Call the Flask backend endpoint for LeBron's last game
    const response = await fetch(`${API_BASE_URL}/lebron/last-game`, {
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
    console.log('Successfully fetched last game data');
    
    // Return the game stats
    return {
      points: data.points || 0,
      rebounds: data.rebounds || 0,
      assists: data.assists || 0,
      steals: data.steals || 0,
      blocks: data.blocks || 0,
      opponent: data.opponent || 'N/A',
      date: data.date || 'N/A'
    };
  } catch (error) {
    // Provide more detailed error information
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error(`Network request failed. API_BASE_URL: ${API_BASE_URL}. Check your connection and backend server.`);
    } else if (error.name === 'AbortError') {
      console.error('Request timed out after 10 seconds');
    } else {
      console.error('Error fetching LeBron\'s last game stats:', error);
    }
    
    // Return default values in case of error
    return {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      opponent: 'N/A',
      date: 'N/A'
    };
  }
}

export async function getLebronSeasonStats(): Promise<SeasonStats> {
  try {
    console.log(`Fetching season stats from: ${API_BASE_URL}/lebron/season-stats`);

    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Call the Flask backend endpoint for LeBron's season stats
    const response = await fetch(`${API_BASE_URL}/lebron/season-stats`, {
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
    console.log('Successfully fetched season stats data');

    // Return the season stats
    return {
      points: data.points || 0,
      rebounds: data.rebounds || 0,
      assists: data.assists || 0,
      steals: data.steals || 0,
      blocks: data.blocks || 0
    };
  } catch (error) {
    // Provide more detailed error information
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error(`Network request failed. API_BASE_URL: ${API_BASE_URL}. Check your connection and backend server.`);
    } else if (error.name === 'AbortError') {
      console.error('Request timed out after 10 seconds');
    } else {
      console.error('Error fetching LeBron\'s season stats:', error);
    }
    
    // Return default values in case of error
    return {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0
    };
  }
}

// Add a default export to fix the routing warning
export default {
  getLebronLastGame,
  getLebronSeasonStats
}; 