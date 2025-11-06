const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('node:fs');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Multer para guardar archivos en la carpeta "uploads"
const upload = multer({ dest: 'uploads/single' });

// Ruta para subir imágen
app.post('/uploads/single', upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }

  console.log(req.file);
  const newFileName = saveImage(req.file);

  const urlFoto = `${newFileName}`; // Usar el nombre único generado
  res.send({ urlFoto });
});

function saveImage(file) {
  const ext = path.extname(file.originalname); // Con esto se obtiene la extensión
  const name = path.basename(file.originalname, ext); // Nombre sin extensión. Saca lo que encuentre igual a "ext"
  const uniqueName = `${name}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;

  const newPath = path.join(__dirname, 'uploads', 'single', uniqueName);

  fs.renameSync(file.path, newPath);
  return uniqueName;
}

// Ruta para modificar imágen
app.put('/uploads/single/:oldFilename', upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }

  const oldFilename = req.params.oldFilename;
  if (oldFilename && oldFilename !== 'undefined') {
    const oldFilePath = path.join(__dirname, 'uploads', 'single', oldFilename);

    if (fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
        console.log(`Imagen anterior ${oldFilename} eliminada`);
      } catch (err) {
        console.error('Error al eliminar la imagen anterior:', err);
      }
    }
  }

  const newFileName = saveImage(req.file);
  const urlFoto = `${newFileName}`;
  res.send({ urlFoto });
});


// Ruta para obtener imágen
app.get('/uploads/single/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'single', filename);

  // Verificar si el archivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al enviar la imagen' });
      }
    });
  });
});

// Ruta para eliminar imágen
app.delete('/uploads/single/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'single', filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).json({ error: 'Imagen no encontrada' });

    fs.unlink(filePath, (err) => {  // ← ASÍNCRONO
      if (err) {
        console.error('Error al eliminar:', err);
        return res.status(500).json({ error: 'Error al eliminar' });
      }
      res.status(200).json({ message: 'Imagen eliminada correctamente' });
    });
  });
});


// Arrancar el servidor
app.listen(3000, ()=>{

  console.log('Servidor escuchando en el puerto 3000')
})