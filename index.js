const express = require('express');
const slugify = require('slugify');
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs-extra');

const PORT = 4321;
const app = express();
const MAX_TEXT_LEN = 80;

// Create directories if they don't exist
const createDirectories = () => {
  const dirs = ['assets/images', 'assets/gifs', 'uploads'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${basename}-${timestamp}${ext}`);
  },
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use('/assets/images', express.static('assets/images'));
app.use('/assets/gifs', express.static('assets/gifs'));

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

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const originalExt = path.extname(req.file.originalname).toLowerCase();
  const fileType = originalExt === '.gif' ? 'gifs' : 'images';
  const targetDir = `assets/${fileType}`;
  let newFilename = req.body.filename
    ? `${slugify(req.body.filename, { lower: true })}${originalExt}`
    : req.file.filename;

  const targetPath = path.join(targetDir, newFilename);

  // Move file from uploads to target directory
  fs.move(req.file.path, targetPath, err => {
    if (err) {
      return res.status(500).send(err.message);
    }

    const fileUrl = `http://localhost:${PORT}/${targetPath.replace(/\\/g, '/')}`;
    const markdown = `![${newFilename}](${fileUrl})`;

    res.send(`
      <p>File uploaded successfully!</p>
      <label for="markdown">Markdown</label>
      <p>
        <textarea cols="300" rows="3" id="markdown">${markdown}</textarea>
      </p>
      <a href="/">Upload another file</a>
    `);
  });
});

// Endpoint to list all images and gifs with markdown
app.get('/list', (req, res) => {
  const imagesDir = path.join(__dirname, 'assets/images');
  const gifsDir = path.join(__dirname, 'assets/gifs');

  const generateTable = (files, dir) => {
    return files.map(file => {
      const fileUrl = `http://localhost:${PORT}/assets/${dir}/${file}`;
      const markdown = `![${file}](${fileUrl})`;
      return `
        <tr>
          <td>${file}</td>
          <td><img src="${fileUrl}" width="100" /></td>
          <td><code>${markdown}</code></td>
        </tr>
      `;
    }).join('');
  };

  fs.readdir(imagesDir, (err, images) => {
    if (err) {
      return res.status(500).send('Error reading images directory.');
    }

    fs.readdir(gifsDir, (err, gifs) => {
      if (err) {
        return res.status(500).send('Error reading gifs directory.');
      }

      const imagesTable = generateTable(images, 'images');
      const gifsTable = generateTable(gifs, 'gifs');

      res.send(`
        <html>
          <head>
            <title>List of Images and GIFs</title>
            <style>
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid black;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
            </style>
          </head>
          <body>
            <h1>List of Images and GIFs</h1>
            <h2>Images</h2>
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Preview</th>
                  <th>Markdown</th>
                </tr>
              </thead>
              <tbody>
                ${imagesTable}
              </tbody>
            </table>
            <h2>GIFs</h2>
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Preview</th>
                  <th>Markdown</th>
                </tr>
              </thead>
              <tbody>
                ${gifsTable}
              </tbody>
            </table>
          </body>
        </html>
      `);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

