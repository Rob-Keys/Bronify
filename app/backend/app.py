from flask import Flask, jsonify
from flask_cors import CORS
from nba_api.stats.endpoints import playergamelog, playercareerstats, commonplayerinfo
from datetime import datetime
import requests
from datetime import datetime, timedelta
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# LeBron James' player ID in NBA API
LEBRON_ID = '2544'

# Simple in-memory cache with TTL
cache = {
    'last_game': {'data': None, 'timestamp': 0, 'ttl': 86400},  # 1 day TTL
    'season_stats': {'data': None, 'timestamp': 0, 'ttl': 86400},  # 1 day TTL
    'news': {'data': None, 'timestamp': 0, 'ttl': 86400}  # 1 day TTL
}

def get_from_cache(key):
    """Get data from cache if valid"""
    if key in cache:
        entry = cache[key]
        if entry['data'] is not None and time.time() - entry['timestamp'] < entry['ttl']:
            print(f"Cache hit for {key}")
            return entry['data']
    print(f"Cache miss for {key}")
    return None

def set_in_cache(key, data):
    """Store data in cache with current timestamp"""
    if key in cache:
        cache[key]['data'] = data
        cache[key]['timestamp'] = time.time()
        print(f"Updated cache for {key}")

@app.route('/api/lebron/last-game', methods=['GET'])
def lebron_last_game():
    try:
        # Check cache first
        cached_data = get_from_cache('last_game')
        if cached_data:
            return jsonify(cached_data)
            
        # Cache miss, fetch from API
        # Get LeBron's most recent game
        current_season = datetime.now().year
        if datetime.now().month < 10:  # NBA season starts in October
            season = f"{current_season-1}-{str(current_season)[2:]}"
        else:
            season = f"{current_season}-{str(current_season+1)[2:]}"
        
        print(f"Fetching game log for season: {season}")    
        game_log = playergamelog.PlayerGameLog(player_id=LEBRON_ID, season=season)
        result_sets = game_log.get_dict()['resultSets']
        
        if not result_sets or len(result_sets) == 0 or 'rowSet' not in result_sets[0] or not result_sets[0]['rowSet']:
            print("No games found in current season, trying previous season")
            # Try the previous season if no games found
            prev_season = f"{current_season-1}-{str(current_season)[2:]}"
            game_log = playergamelog.PlayerGameLog(player_id=LEBRON_ID, season=prev_season)
            result_sets = game_log.get_dict()['resultSets']
            
        if not result_sets or len(result_sets) == 0 or 'rowSet' not in result_sets[0] or not result_sets[0]['rowSet']:
            print("No games found in previous season either")
            return jsonify({
                'error': 'No games found for LeBron in the current or previous season'
            }), 404
            
        # The first game in the list is the most recent
        games = result_sets[0]['rowSet']
        last_game = games[0]
        print(f"Found last game: {last_game}")
        
        # Get the headers to map the data correctly
        headers = result_sets[0]['headers']
        print(f"Headers: {headers}")
        game_dict = dict(zip(headers, last_game))
        
        # Format the date properly - use the date as is, no need to parse and reformat
        formatted_date = game_dict.get('GAME_DATE', 'N/A')
        print(f"Game date: {formatted_date}")
        
        # Extract the opponent from MATCHUP safely
        matchup = game_dict.get('MATCHUP', '')
        print(f"Matchup: {matchup}")
        
        # Handle different matchup formats
        opponent = 'N/A'
        if matchup:
            if ' vs. ' in matchup:
                opponent = matchup.split(' vs. ')[1]
            elif ' @ ' in matchup:
                opponent = matchup.split(' @ ')[1]
            else:
                parts = matchup.split()
                if len(parts) > 1:
                    opponent = parts[-1]
        
        # Prepare response data
        response_data = {
            'points': game_dict.get('PTS', 0),
            'rebounds': game_dict.get('REB', 0),
            'assists': game_dict.get('AST', 0),
            'steals': game_dict.get('STL', 0),
            'blocks': game_dict.get('BLK', 0),
            'opponent': opponent,
            'date': formatted_date
        }
        
        # Store in cache
        set_in_cache('last_game', response_data)
        
        # Return the response
        return jsonify(response_data)
    except Exception as e:
        import traceback
        print(f"Error in lebron_last_game: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/lebron/season-stats', methods=['GET'])
def lebron_season_stats():
    try:
        # Check cache first
        cached_data = get_from_cache('season_stats')
        if cached_data:
            return jsonify(cached_data)
            
        # Cache miss, fetch from API
        # Get current season in NBA format (e.g., "2024-25")
        current_season = datetime.now().year
        if datetime.now().month < 10:  # NBA season starts in October
            season = f"{current_season-1}-{str(current_season)[2:]}"
        else:
            season = f"{current_season}-{str(current_season+1)[2:]}"
        
        # Get LeBron's season averages
        career_stats = playercareerstats.PlayerCareerStats(player_id=LEBRON_ID, per_mode36='PerGame')
        seasons = career_stats.get_dict()['resultSets'][0]['rowSet']
        
        # Find the current season's stats
        current_season_stats = None
        for season_stats in seasons:
            season_year = career_stats.get_dict()['resultSets'][0]['headers'].index('SEASON_ID')
            if season_stats[season_year] == season:
                current_season_stats = season_stats
                break
        
        # If current season not found, get the most recent season
        if not current_season_stats and seasons:
            current_season_stats = seasons[-1]  # Last entry is most recent
            
        if not current_season_stats:
            return jsonify({
                'error': 'No season stats found for LeBron'
            }), 404
            
        # Get the headers to map the data correctly
        headers = career_stats.get_dict()['resultSets'][0]['headers']
        stats_dict = dict(zip(headers, current_season_stats))
        
        # Prepare response data
        response_data = {
            'points': stats_dict['PTS'],
            'rebounds': stats_dict['REB'],
            'assists': stats_dict['AST'],
            'steals': stats_dict['STL'],
            'blocks': stats_dict['BLK']
        }
        
        # Store in cache
        set_in_cache('season_stats', response_data)
        
        # Return the response
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add a new endpoint for LeBron news
@app.route('/api/lebron/news', methods=['GET'])
def lebron_news():
    try:
        # Check cache first
        cached_data = get_from_cache('news')
        if cached_data:
            return jsonify({"data": cached_data})
            
        # Cache miss, fetch from API
        # Use NewsAPI to fetch real news about LeBron James
        NEWS_API_KEY = "93c63814be6d481aaac1f5b1b52902d4"
        NEWS_API_URL = "https://newsapi.org/v2/everything"
        
        # Parameters for the NewsAPI request
        params = {
            "qInTitle": "LeBron",           # Search query
            "language": "en",              # English articles only
            "sortBy": "publishedAt",       # Sort by publication date
            "pageSize": 6,                # Number of articles to fetch
            "apiKey": NEWS_API_KEY
        }
        
        # Make the request to NewsAPI
        response = requests.get(NEWS_API_URL, params=params)
        
        if response.status_code != 200:
            print(f"NewsAPI error: {response.status_code}, {response.text}")
            raise Exception(f"NewsAPI request failed with status code {response.status_code}")
        
        # Parse the response
        news_data = response.json()
        
        # Format the data to match our frontend expectations
        formatted_news = []
        for i, article in enumerate(news_data.get('articles', [])):
            # Calculate relative timestamp
            published_at = article.get('publishedAt')
            if published_at:
                # Convert to datetime
                pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                now = datetime.now(pub_date.tzinfo)
                time_diff = now - pub_date
                
                # Format as relative time
                if time_diff.days > 6:
                    relative_time = f"{time_diff.days // 7}w ago"
                elif time_diff.days > 0:
                    relative_time = f"{time_diff.days}d ago"
                elif time_diff.seconds // 3600 > 0:
                    relative_time = f"{time_diff.seconds // 3600}h ago"
                else:
                    relative_time = f"{time_diff.seconds // 60}m ago"
            else:
                relative_time = "recent"
            
            formatted_news.append({
                "id": i + 1,
                "title": article.get('title', 'No Title'),
                "source": article.get('source', {}).get('name', 'Unknown Source'),
                "timestamp": relative_time,
                "date": published_at or "",
                "url": article.get('url', '')
            })
        
        # Store in cache
        set_in_cache('news', formatted_news)
        
        return jsonify({"data": formatted_news})
        
    except Exception as e:
        import traceback
        print(f"Error in lebron_news: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 