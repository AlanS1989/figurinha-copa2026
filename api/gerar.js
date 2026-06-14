import { put } from '@vercel/blob';
import sharp from 'sharp';

export const config = {
  api: { bodyParser: false }
};

async function parseForm(req) {
  const { IncomingForm } = await import('formidable');
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { fields, files } = await parseForm(req);
    const userData = JSON.parse(Array.isArray(fields.dados) ? fields.dados[0] : fields.dados);
    const fotoFile = Array.isArray(files.foto) ? files.foto[0] : files.foto;

    const fs = await import('fs');
    const fotoBuffer = fs.readFileSync(fotoFile.filepath);

    const fotoResized = await sharp(fotoBuffer)
      .resize(375, 525, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 90 })
      .toBuffer();

    const pedidoId = Date.now().toString();
    const blob = await put(`figurinhas/${pedidoId}.jpg`, fotoResized, {
      access: 'public',
      contentType: 'image/jpeg'
    });

    return res.status(200).json({ imageUrl: blob.url, pedidoId });
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
}
