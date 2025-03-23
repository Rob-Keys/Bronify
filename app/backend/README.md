# Bronify Backend

This is the backend server for the Bronify app, providing real-time NBA stats for LeBron James using the official NBA API.

## Setup

1. Install Python 3.7+ if you don't have it
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the server:
   ```
   python app.py
   ```

The server will start on http://localhost:5000 with the following endpoints:
- `/api/lebron/last-game` - Get LeBron's most recent game stats
- `/api/lebron/season-stats` - Get LeBron's current season average stats

## Production Deployment

For production, consider deploying to a service like:
- Heroku
- AWS Lambda
- Google Cloud Run
- DigitalOcean App Platform

You can use Gunicorn as the WSGI server:
```
gunicorn app:app
``` 