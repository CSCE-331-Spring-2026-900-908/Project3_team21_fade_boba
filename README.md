# Fade Boba POS System

Link: https://project3-team21-fade-boba-1.onrender.com/

## Local Setup & Testing

To run this project locally, you need two terminal windows: one for the backend and one for the frontend. 

### 1. Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Run `npm install` to install dependencies.
3. Ensure you have a `.env` file in the `backend` directory with the database connection details.
   ```
   DB_HOST="EXAMPLE HOST"
   DB_PORT="EXAMPLE DATABASE PORT"
   DB_NAME="EXAMPLE DATABASE NAME"
   DB_USER="EXAMPLE USERNAME"
   DB_PASSWORD="EXAMPLE PASSWORD"
   PORT=3001
   ```
   *Note: Ensure `.env` is never committed to GitHub.*
4. Start the backend server: `npm start`
   - It will run on `http://localhost:3001` and connect to the remote TAMU database.

### 2. Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Run `npm install` to install dependencies.
3. (Optional) The API URL is configured via `.env.development`. It points to the local backend `http://localhost:3001/api` automatically.
4. Start the frontend development server: `npm start`
   - The application will open in your browser at `http://localhost:3000`.

## Recent Changes for Local Testing
- Removed the `proxy` field in `frontend/package.json` that was causing the React Dev Server to crash (`options.allowedHosts[0] should be a non-empty string`).
- Modified `frontend/src/api/api.js` to use `REACT_APP_API_URL` environment variable for switching between local backend and production backend automatically.
