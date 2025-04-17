'use client';

import { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import * as d3 from 'd3';
import { mongoColors } from '@/theme';

export default function EmbeddingTab({ chunks = [], embeddings = [] }) {
  const svgRef = useRef(null);

  // Set up D3 visualization when embeddings change
  useEffect(() => {
    if (!embeddings || embeddings.length === 0 || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions and margins
    const width = 800; // Increased size
    const height = 600; // Increased size
    const margin = { top: 40, right: 40, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG element with a dark background
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", mongoColors.background.dark)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add gradient definitions
    const defs = svg.append("defs");

    // Create radial gradient for points
    const gradient = defs.append("radialGradient")
      .attr("id", "point-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", mongoColors.green)
      .attr("stop-opacity", 1);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", mongoColors.evergreen)
      .attr("stop-opacity", 0.8);

    // Add a subtle grid pattern
    const gridSize = 50;
    const grid = defs.append("pattern")
      .attr("id", "grid")
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("patternUnits", "userSpaceOnUse");

    grid.append("path")
      .attr("d", `M ${gridSize} 0 L 0 0 0 ${gridSize}`)
      .attr("fill", "none")
      .attr("stroke", mongoColors.ui.divider)
      .attr("stroke-width", 0.5);

    // Add grid background
    svg.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "url(#grid)");

    // Find min and max values for scaling
    const xExtent = d3.extent(embeddings, d => d.x);
    const yExtent = d3.extent(embeddings, d => d.y);

    // Create scales with padding
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - 1, xExtent[1] + 1])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - 1, yExtent[1] + 1])
      .range([innerHeight, 0]);

    // Add axes with styled lines
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .style("color", mongoColors.text.secondary);

    const yAxis = svg.append("g")
      .call(d3.axisLeft(yScale))
      .style("color", mongoColors.text.secondary);

    // Style axis lines
    xAxis.select(".domain").style("stroke", mongoColors.ui.border);
    yAxis.select(".domain").style("stroke", mongoColors.ui.border);
    xAxis.selectAll(".tick line").style("stroke", mongoColors.ui.border);
    yAxis.selectAll(".tick line").style("stroke", mongoColors.ui.border);

    // Create a group for the points
    const pointsGroup = svg.append("g")
      .attr("class", "points");

    // Add shadow filter
    const filter = defs.append("filter")
      .attr("id", "shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 2)
      .attr("result", "blur");

    filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");

    filter.append("feFlood")
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.3)
      .attr("result", "offsetColor");

    filter.append("feComposite")
      .attr("in", "offsetColor")
      .attr("in2", "offsetBlur")
      .attr("operator", "in")
      .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "offsetBlur");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");

    // Add points with enhanced styling
    const points = pointsGroup.selectAll("circle")
      .data(embeddings)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 8)
      .style("fill", "url(#point-gradient)")
      .style("filter", "url(#shadow)")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        // Enlarge point
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 12)
          .style("fill", mongoColors.green);
        
        // Add temporary text label
        pointsGroup.append("text")
          .attr("class", "point-label")
          .attr("x", xScale(d.x) + 15)
          .attr("y", yScale(d.y) + 5)
          .style("fill", mongoColors.text.primary)
          .style("font-size", "12px")
          .style("font-family", "monospace")
          .text(d.text.substring(0, 8) + "...");
      })
      .on("mouseout", function(event, d) {
        // Restore point size
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .style("fill", "url(#point-gradient)");
        
        // Remove temporary text label
        pointsGroup.selectAll(".point-label").remove();
      });

    // Add tooltips with full preview
    points.append("title")
      .text(d => `${d.text.substring(0, 8)}... - ${d.text.substring(0, 100)}${d.text.length > 100 ? "..." : ""}`);

    // Add connecting lines between nearby points
    const delaunay = d3.Delaunay.from(embeddings, d => xScale(d.x), d => yScale(d.y));
    const voronoi = delaunay.voronoi([0, 0, innerWidth, innerHeight]);

    for (let i = 0; i < embeddings.length; i++) {
      const neighbors = Array.from(voronoi.neighbors(i));
      neighbors.forEach(j => {
        if (j > i) { // Only draw each line once
          const p1 = embeddings[i];
          const p2 = embeddings[j];
          const distance = Math.hypot(xScale(p2.x) - xScale(p1.x), yScale(p2.y) - yScale(p1.y));
          
          if (distance < 100) { // Only connect nearby points
            svg.append("line")
              .attr("x1", xScale(p1.x))
              .attr("y1", yScale(p1.y))
              .attr("x2", xScale(p2.x))
              .attr("y2", yScale(p2.y))
              .style("stroke", mongoColors.ui.divider)
              .style("stroke-width", 0.5)
              .style("opacity", 1 - distance/100);
          }
        }
      });
    }

    // Add labels for axes
    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .style("fill", mongoColors.text.primary)
      .text("Dimension 1");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -innerHeight / 2)
      .style("fill", mongoColors.text.primary)
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
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