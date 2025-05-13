import express from 'express';
import sharp from 'sharp';
import Jimp from 'jimp';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Xử lý POST /stamp
app.post('/stamp', async (req, res) => {
  const { text, imageBase64, position = 'bottom-right', offsetX = 20, offsetY = 20 } = req.body;

  if (!text || !imageBase64) {
    return res.status(400).send('Missing fields');
  }

  try {
    // Chuyển ảnh base64 thành buffer
    const buffer = Buffer.from(imageBase64, 'base64');

    // Tạo ảnh text
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const textImage = new Jimp(800, 60, 0x00000000);
    textImage.print(font, 0, 0, text);
    const textBuffer = await textImage.getBufferAsync(Jimp.MIME_PNG);

    // Kích thước ảnh gốc + text
    const { width: imgW, height: imgH } = await sharp(buffer).metadata();
    const { width: wmW, height: wmH } = await sharp(textBuffer).metadata();

    // Tính vị trí watermark
    let top = 0, left = 0;
    switch (position) {
      case 'top-left':
        top = offsetY;
        left = offsetX;
        break;
      case 'top-right':
        top = offsetY;
        left = imgW - wmW - offsetX;
        break;
      case 'bottom-left':
        top = imgH - wmH - offsetY;
        left = offsetX;
        break;
      case 'bottom-right':
        top = imgH - wmH - offsetY;
        left = imgW - wmW - offsetX;
        break;
      case 'center':
        top = Math.round((imgH - wmH) / 2);
        left = Math.round((imgW - wmW) / 2);
        break;
      default:
        top = offsetY;
        left = offsetX;
        break;
    }

    // Chèn watermark
    const outputBuffer = await sharp(buffer)
      .composite([{ input: textBuffer, top, left }])
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(outputBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Image processing error');
  }
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Watermark server running at http://localhost:${PORT}`));
