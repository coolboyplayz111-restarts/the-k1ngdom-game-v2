const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve assets with proper headers
app.get('/assets/*', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        // Set caching headers for better performance
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.sendFile(filePath);
    } else {
        res.status(404).send('Asset not found');
    }
});

// Download assets endpoint
app.get('/download-assets', (req, res) => {
    exec('./download-assets.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error downloading assets: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
        console.log(`Assets downloaded successfully`);
        res.json({ message: 'Assets downloaded successfully', stdout });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

// Start server
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Kingdom Furi RPG server running on port ${PORT}`);
    console.log(`Access the game at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
