const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Carregar o JSON gerado anteriormente
const feedData = require('./newsData.json');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função para limpar o diretório de imagens
function clearDirectory(directory) {
  if (fs.existsSync(directory)) {
    fs.readdirSync(directory).forEach(file => {
      const filepath = path.join(directory, file);
      if (fs.lstatSync(filepath).isDirectory()) {
        clearDirectory(filepath);
      } else {
        fs.unlinkSync(filepath);
      }
    });
  }
}

// Função para baixar uma imagem a partir de uma URL usando node-fetch
async function downloadImage(url, filepath, retries = 3) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao baixar a imagem: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    await fs.promises.writeFile(filepath, buffer);
  } catch (error) {
    console.error(`Erro ao baixar a imagem: ${url}`, error);
    if (retries > 0) {
      console.log(`Tentando novamente (${retries} tentativas restantes)...`);
      await delay(2000); // Aguardar 2 segundos antes de tentar novamente
      return downloadImage(url, filepath, retries - 1);
    }
  }
}

async function downloadImagesAndReplaceLinks() {
  const imagesDir = path.join(__dirname, 'images');

  // Limpar o diretório de imagens antes de começar
  clearDirectory(imagesDir);

  // Certificar-se de que o diretório 'images' existe
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  for (const item of feedData) {
    if (item.img_url) {
      const url = item.img_url.split('?')[0]; // Remover parâmetros da URL
      const filename = path.basename(url);
      const filepath = path.join(imagesDir, filename);
      const relativePath = path.relative(__dirname, filepath);

      await downloadImage(url, filepath);
      item.img_url = relativePath; // Atualizar o link da imagem no JSON com o caminho relativo
    }
  }

  // Salvar o JSON atualizado
  fs.writeFileSync('newsData_updated.json', JSON.stringify(feedData, null, 2));
  console.log('Imagens baixadas e JSON atualizado salvo como newsData_updated.json');
}

downloadImagesAndReplaceLinks();
