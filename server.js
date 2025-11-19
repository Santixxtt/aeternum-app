/* eslint-env node */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Servir los archivos estáticos del build
app.use(express.static(path.join(__dirname, "dist")));

// Ruta wildcard válida en Express 5
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log("Frontend running on port " + port);
});
