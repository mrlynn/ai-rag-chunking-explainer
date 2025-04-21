'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Card,
  CardContent
} from '@mui/material';

export default function ChunkingTab({
  text,
  setText,
  chunkMethod,
  setChunkMethod,
  chunks
}) {
  const handleMethodChange = (event) => {
    setChunkMethod(event.target.value);
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Document Chunking
      </Typography>

      <Typography variant="body1" paragraph>
        Chunking is the process of breaking down large documents into smaller pieces for more effective retrieval.
        Different chunking strategies produce different results for RAG applications.
      </Typography>

      <Grid container spacing={3} alignItems="stretch">
        {/* First Column: Exactly half width */}
        <Grid item xs={12} md={6} sx={{ flexBasis: '48%' }}>
          <Box sx={{ width: '100%' }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="chunk-method-label">Chunking Method</InputLabel>
              <Select
                labelId="chunk-method-label"
                id="chunk-method-select"
                value={chunkMethod}
                label="Chunking Method"
                onChange={handleMethodChange}
              >
                <MenuItem value="none">No Chunking</MenuItem>
                <MenuItem value="fixed">Fixed Size</MenuItem>
                <MenuItem value="delimiter">Delimiter-based</MenuItem>
                <MenuItem value="recursive">Recursive</MenuItem>
                <MenuItem value="semantic">Semantic</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom>
              {chunkMethod === 'none' ? 'Document Text' : 'Text to Chunk'}
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={16}
              value={text}
              onChange={handleTextChange}
              variant="outlined"
              placeholder="Enter document text here..."
            />
          </Box>
        </Grid>

        {/* Second Column: The other half */}
        <Grid item xs={12} md={6} sx={{ flexBasis: '48%' }}>
        <Typography variant="subtitle2" gutterBottom>
            {chunkMethod === 'none' ? 'Document (No Chunking)' : 'Chunked Text'}
          </Typography>

          <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
            {chunks.map((chunk, index) => (
              <Card key={chunk.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chunk #{index + 1}
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {chunk.text}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>
      </Grid>

    </Box>
  );
}