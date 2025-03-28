// LeBron James' player ID
const LEBRON_ID = '2544';

// NBA Stats API base URL
const NBA_API_BASE_URL = 'https://stats.nba.com/stats';

// Headers to mimic a browser request
const NBA_API_HEADERS = {
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Host': 'stats.nba.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
  'Referer': 'https://www.nba.com/',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true'
};

// Cache configuration
interface StatsCache<T> {
  data: T | null;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

// Initialize caches with 24-hour TTL
const lastGameCache: StatsCache<GameStats> = {
  data: null,
  timestamp: 0,
  ttl: 86400000 // 24 hours in milliseconds
};

const seasonStatsCache: StatsCache<SeasonStats> = {
  data: null,
  timestamp: 0,
  ttl: 86400000 // 24 hours in milliseconds
};

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

/**
 * Fallback data for when the API request fails
 */
function getFallbackGameStats(): GameStats {
  return {
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    opponent: '',
    date: ''
  };
}

/**
 * Fallback data for when the API request fails
 */
function getFallbackSeasonStats(): SeasonStats {
  return {
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0
  };
}

/**
 * Check if a cache is valid
 */
function isCacheValid<T>(cache: StatsCache<T>): boolean {
  return (
    cache.data !== null && 
    cache.timestamp > 0 && 
    Date.now() - cache.timestamp < cache.ttl
  );
}

/**
 * Get LeBron's last game stats using direct API calls
 */
export async function getLebronLastGame(): Promise<GameStats> {
  try {
    // Check cache first
    if (isCacheValid(lastGameCache)) {
      console.log('Returning cached last game stats');
      return lastGameCache.data!;
    }
    
    console.log('Fetching LeBron\'s last game using NBA API');
    
    // Current season in NBA format (e.g., "2023-24")
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const season = currentDate.getMonth() < 9 
      ? `${currentYear-1}-${String(currentYear).slice(2)}` 
      : `${currentYear}-${String(currentYear+1).slice(2)}`;
    
    // Using league_player_box_scores_traditional endpoint
    const url = `${NBA_API_BASE_URL}/leaguegamelog?Counter=1000&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=${season}&SeasonType=Regular+Season&Sorter=DATE`;
    
    let gameLog;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: NBA_API_HEADERS
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      gameLog = await response.json();
    } catch (err: any) {
      console.error("Error fetching game log:", err);
      
      // Return cached data if available, otherwise fallback
      if (lastGameCache.data !== null) {
        console.log('Returning cached last game stats after fetch error');
        return lastGameCache.data;
      }
      return getFallbackGameStats();
    }
    
    if (!gameLog?.resultSets?.[0]?.rowSet) {
      console.log('No games found in API response, using fallback or cache');
      
      // Return cached data if available, otherwise fallback
      if (lastGameCache.data !== null) {
        return lastGameCache.data;
      }
      return getFallbackGameStats();
    }
    
    // Get the headers and rows
    const headers = gameLog.resultSets[0].headers;
    const rows = gameLog.resultSets[0].rowSet;
    
    // Find column indices first
    const columnIndices = {
      playerId: headers.indexOf('PLAYER_ID'),
      playerName: headers.indexOf('PLAYER_NAME'),
      teamAbbr: headers.indexOf('TEAM_ABBREVIATION'),
      matchup: headers.indexOf('MATCHUP'),
      gameDate: headers.indexOf('GAME_DATE'),
      pts: headers.indexOf('PTS'),
      reb: headers.indexOf('REB'),
      ast: headers.indexOf('AST'),
      stl: headers.indexOf('STL'),
      blk: headers.indexOf('BLK'),
      min: headers.indexOf('MIN')
    };
    
    // Find LeBron's games where he actually played (has stats > 0)
    const lebronGames = rows.filter((game: any[]) => {
      // First check if this is LeBron
      if (game[columnIndices.playerId]?.toString() !== LEBRON_ID) {
        return false;
      }
      
      // Now check if he actually played in this game
      // First by checking minutes played if available
      if (columnIndices.min >= 0 && game[columnIndices.min] !== '0:00' && game[columnIndices.min] !== '0') {
        return true;
      }
      
      // Also check if any key stats are greater than 0
      const hasStats = 
        (game[columnIndices.pts] > 0) || 
        (game[columnIndices.reb] > 0) || 
        (game[columnIndices.ast] > 0) || 
        (game[columnIndices.stl] > 0) || 
        (game[columnIndices.blk] > 0);
        
      return hasStats;
    });
    
    if (!lebronGames || lebronGames.length === 0) {
      console.log('No LeBron games found where he played, using fallback or cache');
      
      // Return cached data if available, otherwise fallback
      if (lastGameCache.data !== null) {
        return lastGameCache.data;
      }
      return getFallbackGameStats();
    }
    
    // Get the most recent game (should be first in the list given the sort order)
    const lastGame = lebronGames[0];
    
    // Extract opponent from matchup
    const matchup = lastGame[columnIndices.matchup] || '';
    let opponent = 'N/A';
    
    if (matchup) {
      if (matchup.includes(' vs. ')) {
        opponent = matchup.split(' vs. ')[1];
      } else if (matchup.includes(' @ ')) {
        opponent = matchup.split(' @ ')[1];
      }
    }
    
    // Format the response
    const gameStats = {
      points: lastGame[columnIndices.pts] || 0,
      rebounds: lastGame[columnIndices.reb] || 0,
      assists: lastGame[columnIndices.ast] || 0,
      steals: lastGame[columnIndices.stl] || 0,
      blocks: lastGame[columnIndices.blk] || 0,
      opponent: opponent,
      date: lastGame[columnIndices.gameDate] || 'N/A'
    };
    
    // Update cache
    lastGameCache.data = gameStats;
    lastGameCache.timestamp = Date.now();
    console.log('Last game stats cached for 24 hours');
    
    return gameStats;
  } catch (error: any) {
    console.error('Error in getLebronLastGame:', error);
    
    // Return cached data if available, otherwise fallback
    if (lastGameCache.data !== null) {
      console.log('Returning cached last game stats after error');
      return lastGameCache.data;
    }
    return getFallbackGameStats();
  }
}

/**
 * Get LeBron's season stats with fallback data
 */
export async function getLebronSeasonStats(): Promise<SeasonStats> {
  try {
    // Check cache first
    if (isCacheValid(seasonStatsCache)) {
      console.log('Returning cached season stats');
      return seasonStatsCache.data!;
    }
    
    console.log('Fetching LeBron\'s season stats using NBA API');
    
    // Current season in NBA format (e.g., "2023-24")
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const season = currentDate.getMonth() < 9 
      ? `${currentYear-1}-${String(currentYear).slice(2)}` 
      : `${currentYear}-${String(currentYear+1).slice(2)}`;
    
    // Using league_player_general_stats endpoint
    const url = `${NBA_API_BASE_URL}/leaguedashplayerstats?College=&Conference=&Country=&DateFrom=&DateTo=&Division=&DraftPick=&DraftYear=&GameScope=&GameSegment=&Height=&LastNGames=0&LeagueID=00&Location=&MeasureType=Base&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=${season}&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange=&StarterBench=&TeamID=&VsConference=&VsDivision=&Weight=`;
    
    let seasonStats;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: NBA_API_HEADERS
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      seasonStats = await response.json();
    } catch (err: any) {
      console.error("Error fetching season stats:", err);
      
      // Return cached data if available, otherwise fallback
      if (seasonStatsCache.data !== null) {
        console.log('Returning cached season stats after fetch error');
        return seasonStatsCache.data;
      }
      return getFallbackSeasonStats();
    }
    
    if (!seasonStats?.resultSets?.[0]?.rowSet) {
      console.log('No season stats found in API response, using fallback or cache');
      
      // Return cached data if available, otherwise fallback
      if (seasonStatsCache.data !== null) {
        return seasonStatsCache.data;
      }
      return getFallbackSeasonStats();
    }
    
    // Get the headers and rows
    const headers = seasonStats.resultSets[0].headers;
    const rows = seasonStats.resultSets[0].rowSet;
    
    // Find LeBron's stats
    const lebronStats = rows.find((player: any[]) => {
      const playerIdIndex = headers.indexOf('PLAYER_ID');
      return player[playerIdIndex]?.toString() === LEBRON_ID;
    });
    
    if (!lebronStats) {
      console.log('No LeBron stats found, using fallback or cache');
      
      // Return cached data if available, otherwise fallback
      if (seasonStatsCache.data !== null) {
        return seasonStatsCache.data;
      }
      return getFallbackSeasonStats();
    }
    
    // Map column names to indices
    const columnIndices = {
      pts: headers.indexOf('PTS'),
      reb: headers.indexOf('REB'),
      ast: headers.indexOf('AST'),
      stl: headers.indexOf('STL'),
      blk: headers.indexOf('BLK')
    };
    
    // Format the response
    const stats = {
      points: lebronStats[columnIndices.pts] || 0,
      rebounds: lebronStats[columnIndices.reb] || 0,
      assists: lebronStats[columnIndices.ast] || 0,
      steals: lebronStats[columnIndices.stl] || 0,
      blocks: lebronStats[columnIndices.blk] || 0
    };
    
    // Update cache
    seasonStatsCache.data = stats;
    seasonStatsCache.timestamp = Date.now();
    console.log('Season stats cached for 24 hours');
    
    return stats;
  } catch (error: any) {
    console.error('Error in getLebronSeasonStats:', error);
    
    // Return cached data if available, otherwise fallback
    if (seasonStatsCache.data !== null) {
      console.log('Returning cached season stats after error');
      return seasonStatsCache.data;
    }
    return getFallbackSeasonStats();
  }
}

/**
 * Force refresh of all stats caches
 */
export function refreshStatsCache(): void {
  console.log('Clearing stats caches');
  lastGameCache.data = null;
  lastGameCache.timestamp = 0;
  seasonStatsCache.data = null;
  seasonStatsCache.timestamp = 0;
}

// Add a default export to fix the routing warning
const NbaStats = {
  getLebronLastGame,
  getLebronSeasonStats,
  refreshStatsCache
};

export default NbaStats; 