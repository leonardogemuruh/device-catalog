const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Répertoire de base
const baseDir = path.join(__dirname, 'vendors'); //  Chemin relatif pour la portabilité
const outputFile = path.join(__dirname, 'resultats.txt'); // Fichier de sortie pour les résultats

function checkForExamples(filePath) {
  try {
    console.log(`Lecture du fichier : ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = yaml.parse(fileContent);

    // Vérifier la présence de protocolId
    const protocolIds = Object.keys(data.examples || {});
    if (protocolIds.length > 0) {
      const results = protocolIds.map(protocolId => {
        const examples = data.examples[protocolId];
        const hasNonOs1Example = examples.some(example => typeof example === 'string' && !example.startsWith('os1'));
        return `\t ProtocolId :\n\t\t ${protocolId}\n\t\t   Contient des exemples : ${hasNonOs1Example ? 'oui' : 'non'}`;
      });
      return results;
    }
    return ['\t Aucun protocolId trouvé'];
  } catch (error) {
    console.error(`Erreur lors de la lecture ou de l'analyse du fichier : ${filePath}`, error);
    return ['\t Erreur lors de la lecture ou de l\'analyse'];
  }
}

function traverseDirectory(dir) {
  const results = {};
  console.log(`Parcours du répertoire : ${dir}`);
  const vendors = fs.readdirSync(dir);
  vendors.forEach(vendor => {
    const vendorPath = path.join(dir, vendor);
    if (fs.lstatSync(vendorPath).isDirectory()) {
      const modelsPath = path.join(vendorPath, 'models');
      console.log(`Parcours du vendeur : ${vendor}`);
      if (fs.existsSync(modelsPath) && fs.lstatSync(modelsPath).isDirectory()) {
        const models = fs.readdirSync(modelsPath);
        models.forEach(model => {
          const modelFile = path.join(modelsPath, model, 'model.yaml');
          if (fs.existsSync(modelFile)) {
            const examplesResults = checkForExamples(modelFile);
            if (!results[vendor]) {
              results[vendor] = [];
            }
            const modelResult = `${model}\n${examplesResults.join('\n')}`;
            results[vendor].push(modelResult);
          } else {
            console.log(`Le fichier modèle n'existe pas : ${modelFile}`);
          }
        });
      } else {
        console.log(`Le répertoire des modèles n'existe pas : ${modelsPath}`);
      }
    } else {
      console.log(`Le répertoire du vendeur n'est pas valide : ${vendorPath}`);
    }
  });

  // Écrire les résultats dans un fichier
  const formattedResults = Object.keys(results).map(vendor => {
    return `Vendor: ${vendor}\n Model:\n${results[vendor].join('\n')}`;
  }).join('\n\n');

  fs.writeFileSync(outputFile, formattedResults, 'utf8');
  console.log(`Les résultats ont été écrits dans le fichier : ${outputFile}`);
}

// Commencez à parcourir depuis le répertoire des vendors
traverseDirectory(baseDir);
