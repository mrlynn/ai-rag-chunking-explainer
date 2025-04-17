'use client';

import { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import * as d3 from 'd3';

export default function EmbeddingTab({ chunks = [], embeddings = [] }) {
  const svgRef = useRef(null);

  // Set up D3 visualization when embeddings change
  useEffect(() => {
    if (!embeddings || embeddings.length === 0 || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions and margins
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Find min and max values for scaling
    const xExtent = d3.extent(embeddings, d => d.x);
    const yExtent = d3.extent(embeddings, d => d.y);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - 1, xExtent[1] + 1])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - 1, yExtent[1] + 1])
      .range([innerHeight, 0]);

    // Create color scale based on chunk index
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    // Add points
    svg.selectAll("circle")
      .data(embeddings)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 6)
      .style("fill", (d, i) => colorScale(i))
      .style("opacity", 0.7)
      .append("title")
      .text(d => d.text.substring(0, 100) + (d.text.length > 100 ? "..." : ""));

    // Add labels for axes
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom)
      .text("Dimension 1");

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -innerHeight / 2)
      .text("Dimension 2");

  }, [embeddings]);

  return (
    <Box sx={{ 
      height: 'calc(100vh - 100px)',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 3,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h4" gutterBottom>
          Vector Embeddings
        </Typography>
        
        <Typography variant="body1">
          Each chunk is converted into a high-dimensional vector using OpenAI&apos;s embedding model.
          The visualization below uses dimensionality reduction (UMAP) to show how chunks are organized in 2D space.
          Chunks with similar content appear closer together.
        </Typography>
      </Box>

      <Box sx={{ 
        flexGrow: 1,
        overflow: 'auto',
        p: 3
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>
                Vector Space Visualization
              </Typography>
              
              {embeddings && embeddings.length > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                  <svg ref={svgRef}></svg>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ mt: 4, textAlign: 'center' }}>
                  No embeddings available. Process text in the Chunking tab first.
                </Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                About Vector Embeddings
              </Typography>
              
              <Typography variant="body2" paragraph>
                Vector embeddings convert text into numbers that capture semantic meaning.
                Similar text results in similar vectors, enabling semantic search capabilities.
              </Typography>
              
              <Typography variant="body2" paragraph>
                In this demo, each chunk is embedded using OpenAI&apos;s text-embedding-3-small model, 
                which creates a 1536-dimensional vector for each text chunk.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Embedding Stats
              </Typography>
              
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2">
                  Number of Chunks: {chunks?.length || 0}
                </Typography>
                <Typography component="li" variant="body2">
                  Number of Vectors: {embeddings?.length || 0}
                </Typography>
                <Typography component="li" variant="body2">
                  Embedding Model: text-embedding-3-small
                </Typography>
                <Typography component="li" variant="body2">
                  Dimensions: 1536 (reduced to 2D for visualization)
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}