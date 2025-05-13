import express from 'express';
import sharp from 'sharp';
import Jimp from 'jimp';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/stamp', async (req, res) => {
  const { text, imageBase64 } = req.body;
  if (!text || !imageBase64) return res.status(400).send('Missing fields');

  try {
    const buffer = Buffer.from(imageBase64, 'base64');

    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const textImage = new Jimp(800, 60, 0x00000000);
    textImage.print(font, 0, 0, text);
    const textBuffer = await textImage.getBufferAsync(Jimp.MIME_PNG);

    const outputBuffer = await sharp(buffer)
      .composite([{ input: textBuffer, top: 20, left: 20 }])
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(outputBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Image processing error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
