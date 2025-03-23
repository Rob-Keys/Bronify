# Bronify
An app for the King

## Prerequisites
- Node.js and npm
- Python 3.7+ (for the backend)
- Android Studio (for Android development)

## Project Structure
- `/app` - React Native frontend
- `/backend` - Python Flask backend for NBA stats

## Backend Setup
First, set up the Python backend which provides real-time NBA stats:

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python app.py
```

The backend server will run on http://localhost:5000

## Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start the Expo development server
npx expo start --clear
```

## Starting the Android Emulator
```bash
emulator -avd Medium_Phone_API_36
```

## Running the app
```bash
npx expo start --clear
```

Develop on Android Studio

## Production Notes
For production deployment:
1. Deploy the Flask backend to a cloud service (Heroku, AWS, etc.)
2. Update the API_BASE_URL in `app/services/nbaStats.ts` with your deployed backend URL
3. Build the React Native app for production
