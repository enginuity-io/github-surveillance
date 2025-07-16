import React, { useState, useEffect } from 'react';
import { Container, TextField, Typography, Box, AppBar, Toolbar, Paper, Tab, Tabs } from '@mui/material';

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

// Mock data for repositories
const mockRepos: Repository[] = [
  {
    name: 'github-surveillance',
    html_url: 'https://github.com/enginuity-io/github-surveillance',
    description: 'GitHub Organization Surveillance with Helm Charts and Docker configuration',
    updated_at: new Date().toISOString()
  },
  {
    name: 'kubernetes-examples',
    html_url: 'https://github.com/enginuity-io/kubernetes-examples',
    description: 'Example Kubernetes configurations and deployments',
    updated_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    name: 'cloud-infrastructure',
    html_url: 'https://github.com/enginuity-io/cloud-infrastructure',
    description: 'Cloud infrastructure as code templates',
    updated_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
];

// Mock data for audit logs
const mockAuditLogs: AuditLog[] = [
  {
    action: 'repo.create',
    actor: 'amvirdev',
    created_at: new Date().toISOString()
  },
  {
    action: 'repo.push',
    actor: 'amvirdev',
    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    action: 'team.add_member',
    actor: 'admin-user',
    created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

function App() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data instead of API calls
      setRepos(mockRepos);
      setAuditLogs(mockAuditLogs);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      setRepos([]);
      setAuditLogs([]);
    } finally {
      setLoading(false);
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
        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}
        {loading && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
            <Typography>Loading...</Typography>
          </Paper>
        )}

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
