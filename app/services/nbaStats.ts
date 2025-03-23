// The base URL for the Python Flask backend
export const API_BASE_URL = 'http://10.0.0.38:5000/api';
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
    console.log(`Fetching LeBron's last game stats from: ${API_BASE_URL}/lebron/last-game`);
    
    // Call the Flask backend endpoint for LeBron's last game
    const response = await fetch(`${API_BASE_URL}/lebron/last-game`);
    
    console.log(`Last game API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error response body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    console.log('Successfully fetched last game data:', data);
    
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
    console.error('Error fetching LeBron\'s last game stats:', error);
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
    console.log(`Fetching LeBron's season stats from: ${API_BASE_URL}/lebron/season-stats`);
    
    // Call the Flask backend endpoint for LeBron's season stats
    const response = await fetch(`${API_BASE_URL}/lebron/season-stats`);
    
    console.log(`Season stats API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error response body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    console.log('Successfully fetched season stats data:', data);
    
    // Return the season stats
    return {
      points: data.points || 0,
      rebounds: data.rebounds || 0,
      assists: data.assists || 0,
      steals: data.steals || 0,
      blocks: data.blocks || 0
    };
  } catch (error) {
    console.error('Error fetching LeBron\'s season stats:', error);
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