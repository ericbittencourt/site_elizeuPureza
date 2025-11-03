// Importações necessárias
const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://znzkefmfgqzsvawtwyqb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuemtlZm1mZ3F6c3Zhd3R3eXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzY5NDEsImV4cCI6MjA3Nzc1Mjk0MX0.vI7B6yNoOxVVGVSg2HNqrvdB7BS40y5fx60gHNAZTeE';

// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuração para processamento de formulários
const formOptions = {
  keepExtensions: true,
  maxFileSize: 100 * 1024 * 1024, // 100MB
};

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar se é uma requisição POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Processar o upload do arquivo
    const form = new formidable.IncomingForm(formOptions);
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Erro ao processar o formulário:', err);
        return res.status(500).json({ error: 'Erro ao processar o upload' });
      }

      const uploadedFile = files.file;
      
      if (!uploadedFile) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      try {
        // Ler o arquivo
        const fileContent = fs.readFileSync(uploadedFile.filepath);
        const fileExt = path.extname(uploadedFile.originalFilename).substring(1);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `portfolio/${fileName}`;

        // Upload para o Supabase Storage
        const { data, error } = await supabase
          .storage
          .from('media')
          .upload(filePath, fileContent, {
            contentType: uploadedFile.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Erro no upload para Supabase:', error);
          return res.status(500).json({ error: 'Falha ao fazer upload para o storage' });
        }

        // Obter URL pública
        const { data: publicURL } = supabase
          .storage
          .from('media')
          .getPublicUrl(filePath);

        return res.status(200).json({ 
          url: publicURL?.publicUrl || null,
          success: true 
        });
      } catch (uploadError) {
        console.error('Erro no upload:', uploadError);
        return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
      }
    });
  } catch (error) {
    console.error('Erro geral:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};