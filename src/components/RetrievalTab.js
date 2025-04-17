'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';

export default function RetrievalTab({ chunks, onSearch, searchResults, query }) {
  const [searchQuery, setSearchQuery] = useState(query || '');

  const handleQueryChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Vector Retrieval
      </Typography>
      
      <Typography variant="body1" paragraph>
        This demonstrates semantic search using MongoDB Atlas Vector Search.
        Enter a query to find the most relevant chunks based on semantic similarity.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                fullWidth
                label="Search Query"
                variant="outlined"
                value={searchQuery}
                onChange={handleQueryChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about MongoDB Vector Search..."
              />
              <Button 
                variant="contained" 
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <Typography variant="subtitle2" gutterBottom>
            Search Results
          </Typography>
          
          {searchResults && searchResults.length > 0 ? (
            <Box>
              {searchResults.map((result, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        Result #{index + 1}
                      </Typography>
                      <Chip 
                        label={`Score: ${result.score ? result.score.toFixed(3) : 'N/A'}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {result.text}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              {query ? 'No results found.' : 'Enter a query to search.'}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              MongoDB Vector Search
            </Typography>
            
            <Typography variant="body2" paragraph>
              This demo uses MongoDB&apos;s $vectorSearch aggregation stage to find semantically similar chunks.
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              How It Works:
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="1. Your query is converted to a vector embedding"
                  secondary="Using OpenAI's text-embedding model"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="2. MongoDB searches for similar vectors"
                  secondary="Using a KNN algorithm with cosine similarity"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="3. The most relevant chunks are returned"
                  secondary="Based on vector similarity scores"
                />
              </ListItem>
            </List>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              MongoDB Query:
            </Typography>
            
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.75rem'
              }}
            >
{`db.collection(&apos;embeddings&apos;).aggregate([
  {
    $vectorSearch: {
      index: "default",
      path: "embedding",
      queryVector: queryEmbedding,
      numCandidates: 100,
      limit: 5
    }
  },
  {
    $lookup: {
      from: "chunks",
      localField: "chunkId",
      foreignField: "id",
      as: "chunk"
    }
  },
  {
    $project: {
      score: { $meta: "vectorSearchScore" },
      text: "$chunk.text",
      id: "$chunk.id"
    }
  }
])`}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}