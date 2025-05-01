# GitHub Organization Surveillance

A full-stack application to monitor GitHub organizations, their repositories, and audit logs.

## Features

- View all repositories in a GitHub organization
- Monitor organization audit logs
- Modern Material UI interface
- Real-time updates when searching for organizations

## Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   PORT=3001
   GITHUB_TOKEN=your_github_token_here
   ```
   Replace `your_github_token_here` with a valid GitHub personal access token with the following permissions:
   - `repo` (for repository access)
   - `admin:org` (for organization audit logs)

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000

## Technologies Used

- Frontend:
  - React with TypeScript
  - Material UI
  - Axios for API calls

- Backend:
  - Node.js with TypeScript
  - Express
  - Octokit (GitHub API client)
