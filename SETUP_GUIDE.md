# Step-by-Step Guide: Building GitHub Organization Surveillance

This guide details every step to create a full-stack application for monitoring GitHub organizations using React, TypeScript, and Node.js.

## Project Structure

```
githubsurveillance/
├── backend/
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   └── ...
    └── package.json
```

## 1. Initial Setup

Create the project structure:
```bash
mkdir -p githubsurveillance/{frontend,backend}
```

## 2. Backend Setup

### 2.1 Initialize Node.js Project
```bash
cd backend
npm init -y
```

### 2.2 Install Backend Dependencies
```bash
npm install express typescript @types/node @types/express dotenv @octokit/rest cors @types/cors
```

### 2.3 TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 2.4 Update package.json Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsc && node dist/server.js"
  }
}
```

### 2.5 Create .env File
```env
PORT=3001
GITHUB_TOKEN=your_github_token_here
```

### 2.6 Create Server (server.ts)
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Get organization repositories
app.get('/api/org/:org/repos', async (req, res) => {
  try {
    const { org } = req.params;
    const { data: repos } = await octokit.repos.listForOrg({
      org,
      sort: 'updated',
      per_page: 100,
    });
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get organization audit logs
app.get('/api/org/:org/audit-logs', async (req, res) => {
  try {
    const { org } = req.params;
    const response = await octokit.request('GET /orgs/{org}/audit-log', {
      org,
      per_page: 100,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

## 3. Frontend Setup

### 3.1 Create React Application
```bash
npx create-react-app frontend --template typescript
```

### 3.2 Install Frontend Dependencies
```bash
cd frontend
npm install @mui/material @emotion/react @emotion/styled axios @mui/icons-material
```

### 3.3 Update App.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { Container, TextField, Typography, Box, AppBar, Toolbar, Paper, Tab, Tabs } from '@mui/material';
import axios from 'axios';

interface Repository {
  name: string;
  html_url: string;
  description: string;
  updated_at: string;
}

interface AuditLog {
  action: string;
  actor: string;
  created_at: string;
}

function App() {
  const [org, setOrg] = useState('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (org) {
      fetchData();
    }
  }, [org]);

  const fetchData = async () => {
    try {
      const [reposResponse, logsResponse] = await Promise.all([
        axios.get(`http://localhost:3001/api/org/${org}/repos`),
        axios.get(`http://localhost:3001/api/org/${org}/audit-logs`)
      ]);
      setRepos(reposResponse.data);
      setAuditLogs(logsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">GitHub Organization Monitor</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Organization Name"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="Enter GitHub organization name"
          />
        </Box>

        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="Repositories" />
          <Tab label="Audit Logs" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ mt: 2 }}>
            {repos.map((repo) => (
              <Paper key={repo.name} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    {repo.name}
                  </a>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {repo.description}
                </Typography>
                <Typography variant="caption">
                  Last updated: {new Date(repo.updated_at).toLocaleDateString()}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ mt: 2 }}>
            {auditLogs.map((log, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6">{log.action}</Typography>
                <Typography variant="body2">Actor: {log.actor}</Typography>
                <Typography variant="caption">
                  Time: {new Date(log.created_at).toLocaleString()}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Container>
    </div>
  );
}

export default App;
```

## 4. GitHub Token Setup

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with the following permissions:
   - `repo` (for repository access)
   - `admin:org` (for organization audit logs)
3. Copy the token and add it to the backend's `.env` file:
   ```env
   GITHUB_TOKEN=your_token_here
   ```

## 5. Running the Application

### 5.1 Start Backend Server
```bash
cd backend
npm install
npm run dev
```

### 5.2 Start Frontend Server
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000 (or next available port)
- Backend: http://localhost:3001

## 6. Using the Application

1. Enter a GitHub organization name in the search field
2. View repositories in the "Repositories" tab
3. Switch to "Audit Logs" tab to view organization audit logs

## 7. Features

- Real-time organization search
- Repository listing with:
  - Repository name with link
  - Description
  - Last update time
- Audit log viewing with:
  - Action type
  - Actor name
  - Timestamp
- Material UI components for modern design
- Responsive layout
- TypeScript for type safety

## 8. Error Handling

The application includes basic error handling:
- Backend errors return appropriate HTTP status codes
- Frontend console logs errors during data fetching
- User-friendly empty states when no data is available

## 9. Security Considerations

- CORS enabled for local development
- GitHub token stored in `.env` file (not committed to version control)
- Secure external links with `noopener` and `noreferrer`
- Type checking with TypeScript
