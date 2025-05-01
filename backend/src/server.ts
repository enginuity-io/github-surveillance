import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (!process.env.GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN is not set in .env file');
  process.exit(1);
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Get organization repositories
app.get('/api/repos', async (req, res) => {
  try {
    const org = 'amvirdev';
    console.log(`Fetching repositories for organization: ${org}`);
    
    const { data: repos } = await octokit.repos.listForOrg({
      org,
      sort: 'updated',
      per_page: 100,
    });
    
    console.log(`Successfully fetched ${repos.length} repositories for ${org}`);
    res.json(repos);
  } catch (error: any) {
    console.error('Error fetching repositories:', error.message);
    if (error.status === 404) {
      res.status(404).json({ error: 'Organization not found' });
    } else if (error.status === 401) {
      res.status(401).json({ error: 'Invalid GitHub token or insufficient permissions' });
    } else {
      res.status(500).json({ error: 'Failed to fetch repositories', details: error.message });
    }
  }
});

// Get organization audit logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const org = 'amvirdev';
    console.log(`Fetching audit logs for organization: ${org}`);
    
    const response = await octokit.request('GET /orgs/{org}/audit-log', {
      org,
      per_page: 100,
    });
    
    console.log(`Successfully fetched audit logs for ${org}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error.message);
    if (error.status === 404) {
      res.status(404).json({ error: 'Organization not found' });
    } else if (error.status === 401) {
      res.status(401).json({ error: 'Invalid GitHub token or insufficient permissions' });
    } else {
      res.status(500).json({ error: 'Failed to fetch audit logs', details: error.message });
    }
  }
});

// Test GitHub token and organization access
app.get('/api/test-token', async (req, res) => {
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    const scopes = (await octokit.request('GET /user')).headers['x-oauth-scopes']?.split(', ') || [];
    
    // Test organization access if GITHUB_ORG is set
    let orgAccess = null;
    if (process.env.GITHUB_ORG) {
      try {
        await octokit.orgs.get({ org: process.env.GITHUB_ORG });
        orgAccess = {
          org: process.env.GITHUB_ORG,
          access: true
        };
      } catch (orgError: any) {
        orgAccess = {
          org: process.env.GITHUB_ORG,
          access: false,
          error: orgError.message
        };
      }
    }
    
    res.json({
      valid: true,
      user: user.login,
      scopes,
      orgAccess
    });
  } catch (error: any) {
    res.status(401).json({
      valid: false,
      error: 'Invalid GitHub token',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Testing GitHub token...');
  
  // Test token on startup
  octokit.users.getAuthenticated()
    .then(({ data }) => {
      console.log('GitHub token is valid');
      console.log(`Authenticated as: ${data.login}`);
      return octokit.request('GET /user');
    })
    .then((response) => {
      const scopes = response.headers['x-oauth-scopes']?.split(', ') || [];
      console.log('Token scopes:', scopes);
      if (!scopes.includes('repo')) {
        console.warn('Warning: Token missing \'repo\' scope');
      }
      if (!scopes.includes('admin:org')) {
        console.warn('Warning: Token missing \'admin:org\' scope');
      }
    })
    .catch((error) => {
      console.error('Error validating GitHub token:', error.message);
    });
});
