const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

const PORT = 4321;
const app = express();
const MAX_TEXT_LEN = 80;

app.get('/search-box', async (req, res) => {
  let text = req.query.text || 'Hello, World!';
  const width = req.query.width ? parseInt(req.query.width) : null;
  const baseImagePath = path.join(__dirname, 'images/search-box.png');

  if (text.length > MAX_TEXT_LEN) {
    text = text.slice(0, MAX_TEXT_LEN) + '...';
  }

  try {
    const img = await loadImage(baseImagePath);

    // Calculate the new dimensions while maintaining the aspect ratio
    const aspectRatio = img.width / img.height;
    let newWidth = img.width;
    let newHeight = img.height;

    if (width) {
      newWidth = width;
      newHeight = Math.round(width / aspectRatio);
    }

    const canvas = createCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');

    // Draw the base image with the new dimensions
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Calculate the scaling factor for the font size
    const scalingFactor = newWidth / img.width;
    const fontSize = 36 * scalingFactor;

    // Set text properties with scaled font size
    ctx.font = `${fontSize}px -apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;
    ctx.fontWeight = 'lighter';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Position the text in the center
    const x = 100 * scalingFactor; // Adjust the x position based on the scaling factor
    const y = newHeight / 2;

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

