const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

const PORT = 4321;
const app = express();
const MAX_TEXT_LEN = 80;

app.get('/search-box', async (req, res) => {
  let text = decodeURIComponent(req.query.text) || 'Hello, World!';

  if (text.length > MAX_TEXT_LEN) {
    text = text.slice(0, MAX_TEXT_LEN) + '...';
  }

  try {
    const baseHeight = 50; // Base height for the search box
    const padding = 20; // Padding around the text
    const iconWidth = 50; // Width of the search icon area
    const fontSize = 20; // Base font size

    // Create a temporary canvas to measure text width
    const canvasTemp = createCanvas(800, baseHeight);
    const ctxTemp = canvasTemp.getContext('2d');
    ctxTemp.font = `${fontSize}px -apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;

    const textWidth = ctxTemp.measureText(text).width;
    const width = textWidth + padding * 2 + iconWidth;

    const canvas = createCanvas(width, baseHeight);
    const ctx = canvas.getContext('2d');

    // Draw the search box background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, baseHeight);

    // Draw the search box border
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, baseHeight);

    // Draw the search icon background
    ctx.fillStyle = '#3B5998'; // Blue color
    ctx.fillRect(width - iconWidth, 0, iconWidth, baseHeight);

    // Load and draw the search icon
    const searchIconPath = path.join(__dirname, 'images/search-icon.svg');
    const iconData = fs.readFileSync(searchIconPath, 'utf-8');
    const img = await loadImage(`data:image/svg+xml;base64,${Buffer.from(iconData).toString('base64')}`);
    const iconSize = 20;
    const iconX = width - iconWidth / 2 - iconSize / 2;
    const iconY = baseHeight / 2 - iconSize / 2;
    ctx.drawImage(img, iconX, iconY, iconSize, iconSize);

    // Set text properties
    ctx.font = `${fontSize}px -apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Position the text in the center-left
    const x = padding;
    const y = baseHeight / 2;

    // Draw the text
    ctx.fillText(text, x, y);

    // Send the image as response
    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (err) {
    res.status(500).send('Error generating image');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

