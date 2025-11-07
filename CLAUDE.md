# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

jq-workbench is a real-time jq query editor for the browser. It provides an interactive web interface for testing and experimenting with jq queries on JSON data. The project uses an emscripten port of jq provided by jq-web.

## Architecture

### Frontend Structure

The application is a single-page web application with a clean separation of concerns:

- **[index.html](index.html)** - Main HTML structure containing the UI layout with three main panels: JSON input, jq query input, and output display. Also includes a collapsible jq cheatsheet.
- **[styles.css](styles.css)** - All styling with a dark theme optimized for readability. Uses CSS Grid and Flexbox for responsive layout.
- **[app.js](app.js)** - Client-side JavaScript that handles:
  - Initialization of the jq WebAssembly module
  - Real-time query execution with debouncing (300ms delay)
  - Error handling and result formatting
  - Cheatsheet toggle functionality

### WebAssembly Integration

The application uses jq compiled to WebAssembly:
- **jq.js** - JavaScript wrapper for the WebAssembly module
- **jq.wasm** - The compiled jq binary

The jq module is loaded asynchronously and provides a `.json()` method for executing queries.

### Deployment

The application is served via nginx in a Docker container:
- **[Dockerfile](Dockerfile)** - Multi-stage build using nginx:alpine as base
- **[nginx.conf](nginx.conf)** - Custom nginx configuration with:
  - Correct MIME type for WASM files (`application/wasm`)
  - CORS headers for WebAssembly
  - Gzip compression for all static assets including WASM
  - Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
  - Caching headers for static assets

## Development Commands

### Local Development

To run locally with Docker:
```bash
docker build -t jq-workbench .
docker run -p 8080:80 jq-workbench
```

Or using docker-compose:
```bash
docker-compose up
```

The application will be available at `http://localhost:8080`

### Building

The project has no build step - it serves static files directly. Changes to HTML, CSS, or JS require rebuilding the Docker image.

To rebuild after changes:
```bash
docker-compose up --build
```

### Deployment

The project uses GitHub Actions for automated Docker image publishing:
- Builds on push to main branch
- Creates multi-platform images (linux/amd64, linux/arm64)
- Publishes to Docker Hub as `xanderstrike/jq-workbench`
- Tags include branch name, version, and `latest` for main branch
- Generates SBOM (Software Bill of Materials) using Anchore

## Key Implementation Details

### Real-time Query Execution

The application uses a debounced execution pattern to provide real-time feedback:
- Input events trigger `executeWithDelay()`
- Execution is debounced by 300ms to avoid excessive processing
- Queries are executed against the parsed JSON using the jq WASM module
- Results are formatted and displayed with syntax highlighting via CSS classes

### Error Handling

The application handles two types of errors:
1. **JSON Parse Errors** - Invalid JSON input shows parsing error message
2. **jq Query Errors** - Invalid jq syntax or runtime errors from the jq module

Both error types display in red text via the `.error` CSS class.

### nginx WASM Configuration

Critical nginx configuration for WebAssembly:
- WASM files must have `Content-Type: application/wasm` header
- CORS headers (`Access-Control-Allow-Origin: *`) are required for some browsers
- Gzip compression significantly reduces WASM file transfer size (~2.8MB file)

## File Modifications

When modifying files that are copied to the Docker image, remember to update the COPY command in [Dockerfile](Dockerfile:5) to include the new files.

## Static Assets

All static files are copied to `/usr/share/nginx/html/` in the container:
- index.html
- styles.css
- app.js
- jq.js
- jq.wasm
