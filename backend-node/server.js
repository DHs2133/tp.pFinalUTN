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

// Ruta para subir la imagen
app.post('/uploads/single', upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }
  
  console.log(req.file)
  saveImage(req.file)

  const urlFoto = `${req.file.originalname}`;
  res.send({ urlFoto });
  ///res.send("termina");
});

function saveImage(file){
  
  const newPath = `./uploads/single/${file.originalname}`;
  fs.renameSync(file.path, newPath);
  return newPath

}


// Arrancar el servidor
app.listen(3000, ()=>{

    console.log('Servidor escuchando en el puerto 3000')
})