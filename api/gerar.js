// api/gerar.js - Usa Gemini para gerar a figurinha

import { put } from '@vercel/blob';
import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';

export const config = {
  api: { bodyParser: false }
};

async function parseForm(req) {
  const { IncomingForm } = await import('formidable');
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true, maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// Gera a figurinha como imagem composta usando Canvas
async function gerarFigurinhaCanvas(fotoBuffer, userData) {
  const nascDate = `${String(userData.dia).padStart(2,'0')}-${String(userData.mes).padStart(2,'0')}-${userData.ano}`;
  
  const W = 375, H = 525;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Fundo verde escuro
  ctx.fillStyle = '#1a7a4a';
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Fundo verde médio (card interno)
  ctx.fillStyle = '#22a05a';
  ctx.fillRect(10, 10, W-20, H-20);

  // Número grande 2026 no fundo
  ctx.font = 'bold 160px Arial';
  ctx.fillStyle = 'rgba(0,100,50,0.35)';
  ctx.textAlign = 'center';
  ctx.fillText('26', W/2, H*0.55);

  // Borda interna
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.roundRect(8, 8, W-16, H-16, 16);
  ctx.stroke();

  // Foto do craque (recortada em elipse no topo)
  try {
    const foto = await loadImage(fotoBuffer);
    const fotoSize = 200;
    const fotoX = (W - fotoSize) / 2;
    const fotoY = 60;
    
    // Sombra
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 15;
    
    // Círculo da foto
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W/2, fotoY + fotoSize/2, fotoSize/2, fotoSize/2, 0, 0, Math.PI*2);
    ctx.clip();
    ctx.drawImage(foto, fotoX, fotoY, fotoSize, fotoSize);
    ctx.restore();
    ctx.shadowBlur = 0;

    // Borda dourada na foto
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(W/2, fotoY + fotoSize/2, fotoSize/2 + 2, fotoSize/2 + 2, 0, 0, Math.PI*2);
    ctx.stroke();
  } catch(e) {
    console.error('Erro ao carregar foto:', e);
  }

  // Camisa do Brasil (retângulo amarelo abaixo da foto)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.roundRect(60, 270, W-120, 130, 10);
  ctx.fill();
  
  // Detalhe verde na camisa
  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(60, 295, W-120, 4);
  ctx.fillRect(60, 375, W-120, 4);

  // Texto CBF
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#003087';
  ctx.textAlign = 'center';
  ctx.fillText('CBF', W/2, 340);
  ctx.font = '11px Arial';
  ctx.fillText('BRASIL', W/2, 358);

  // Bandeira do Brasil (lateral direita)
  ctx.fillStyle = '#009c3b';
  ctx.fillRect(W-55, 160, 38, 26);
  ctx.fillStyle = '#FFDF00';
  ctx.beginPath();
  ctx.moveTo(W-36, 163);
  ctx.lineTo(W-17, 173);
  ctx.lineTo(W-36, 183);
  ctx.lineTo(W-55+4, 173);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#002776';
  ctx.beginPath();
  ctx.arc(W-36, 173, 7, 0, Math.PI*2);
  ctx.fill();

  // Ícone copa (lateral direita topo)
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.fillText('🏆', W-36, 145);
  ctx.font = '10px Arial';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('COPA', W-36, 158);

  // Barra inferior azul escura
  ctx.fillStyle = '#1B3FA0';
  ctx.beginPath();
  ctx.roundRect(0, H-110, W, 110, [0, 0, 20, 20]);
  ctx.fill();

  // Nome
  ctx.font = 'bold 26px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  const nomeDisplay = userData.nome.length > 14 ? userData.nome.substring(0,14)+'.' : userData.nome;
  ctx.fillText(nomeDisplay, W/2, H-78);

  // Data | Altura | Peso
  ctx.font = '13px Arial';
  ctx.fillStyle = '#AAC4FF';
  ctx.fillText(`${nascDate}  |  ${userData.altura} m  |  ${userData.peso} kg`, W/2, H-56);

  // Clube
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(userData.clube.substring(0,20), W/2, H-34);

  // Logo watermark pequena
  ctx.font = 'bold 9px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('FIGURINHA COPA 2026', W/2, H-14);

  return canvas.toBuffer('image/jpeg', { quality: 0.92 });
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

    // Redimensionar foto do cliente para 400x400
    const fotoResized = await sharp(fotoBuffer)
      .resize(400, 400, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Gerar figurinha com Canvas
    const figurinhaBuffer = await gerarFigurinhaCanvas(fotoResized, userData);

    // Upload para Vercel Blob
    const pedidoId = Date.now().toString();
    const blobName = `figurinhas/${pedidoId}-${userData.nome.replace(/\s+/g,'-').toLowerCase()}.jpg`;
    const blob = await put(blobName, figurinhaBuffer, {
      access: 'public',
      contentType: 'image/jpeg'
    });

    return res.status(200).json({
      imageUrl: blob.url,
      pedidoId
    });

  } catch (error) {
    console.error('Erro ao gerar figurinha:', error);
    return res.status(500).json({ error: 'Erro ao gerar figurinha', details: error.message });
  }
}
