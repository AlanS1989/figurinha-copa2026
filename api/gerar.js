export const config = {
  api: { bodyParser: false }
};

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

async function parseForm(req) {
  const { IncomingForm } = await import('formidable');
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true, maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err); else resolve({ fields, files });
    });
  });
}

async function uploadFoto(buffer, pedidoId) {
  const crypto = await import('crypto');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = 'fotos_clientes';
  const public_id = `foto_${pedidoId}`;
  const str = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(str).digest('hex');
  const form = new FormData();
  form.append('file', new Blob([buffer]));
  form.append('public_id', public_id);
  form.append('folder', folder);
  form.append('timestamp', timestamp);
  form.append('api_key', API_KEY);
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: form
  });
  return res.json();
}

function encText(str) {
  return str
    .replace(/,/g, '%2C')
    .replace(/\//g, '%2F')
    .replace(/\|/g, '%7C')
    .replace(/ /g, '_');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { fields, files } = await parseForm(req);
    const userData = JSON.parse(Array.isArray(fields.dados) ? fields.dados[0] : fields.dados);
    const fotoFile = Array.isArray(files.foto) ? files.foto[0] : files.foto;
    const fs = await import('fs');
    const fotoBuffer = fs.readFileSync(fotoFile.filepath);
    const pedidoId = Date.now().toString();

    const fotoUpload = await uploadFoto(fotoBuffer, pedidoId);
    if (!fotoUpload.public_id) throw new Error('Erro upload: ' + JSON.stringify(fotoUpload));

    const dia = String(userData.dia).padStart(2,'0');
    const mes = String(userData.mes).padStart(2,'0');
    const nascDate = `${dia}-${mes}-${userData.ano}`;

    const fotoId = fotoUpload.public_id.replace(/ /g, '_');
    const templateId = 'v1781443612/template_brasil_uedun4';

    const nome   = encText(userData.nome.toUpperCase());
    const linha2 = encText(`${nascDate} / ${userData.altura}m / ${userData.peso}kg`);
    const clube  = encText(userData.clube.toUpperCase());

    const base     = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
    const overlay1 = `l_${fotoId},w_480,h_530,c_fill,g_face,x_-55,y_-290`;
    const text1    = `l_text:Arial_Bold_48:${nome},co_white,g_south,y_185`;
    const text2    = `l_text:Arial_36:${linha2},co_white,g_south,y_135`;
    const text3    = `l_text:Arial_Bold_34:${clube},co_rgb:FFD700,g_south,y_85`;

    const figurinhaUrl = `${base}/${overlay1}/fl_layer_apply/${text1}/fl_layer_apply/${text2}/fl_layer_apply/${text3}/fl_layer_apply/w_1080,h_1456/${templateId}`;

    return res.status(200).json({ imageUrl: figurinhaUrl, pedidoId });

  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
}
