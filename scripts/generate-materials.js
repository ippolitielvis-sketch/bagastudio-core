const fs = require("fs");
const path = require("path");

const texturesDir = path.join(process.cwd(), "public", "textures");
const outputFile = path.join(process.cwd(), "core", "data", "materials.ts");

const files = fs.readdirSync(texturesDir);

const webpFiles = files.filter((file) => file.endsWith(".webp"));

const materials = webpFiles.map((file) => {
  const cleanName = file.replace(".webp", "");

  return {
    id: cleanName.toLowerCase(),
    name: cleanName.replace(/_/g, " "),
    category: "wood",
    type: "texture",
    textureUrl: `/textures/${file}`,
    roughness: 0.45,
    metalness: 0,
  };
});

materials.push({
  id: "specchio",
  name: "Specchio",
  category: "mirror",
  type: "mirror",
  color: "#ffffff",
  roughness: 0,
  metalness: 1,
});

const content =
  "export const MATERIAL_LIBRARY = " +
  JSON.stringify(materials, null, 2);

fs.writeFileSync(outputFile, content);

console.log("Materiali generati");