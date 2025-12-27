import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../public/data/dictionary');
const outputFile = path.join(__dirname, '../public/data/dictionary.json');

const filteredDictionary = {};

console.log('Starting word filtration...');

try {
    const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.json'));

    files.forEach(file => {
        const filePath = path.join(inputDir, file);
        console.log(`Processing ${file}...`);

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            for (const [key, entry] of Object.entries(data)) {
                const word = (entry.word || key).toLowerCase();

                // Filter for 4, 5, or 6 letter words AND only letters (no spaces, periods, etc.)
                if (word.length >= 4 && word.length <= 6 && /^[a-z]+$/.test(word)) {
                    // Remove 'id' field from each meaning
                    const meanings = (entry.meanings || []).map(m => {
                        const { id, ...rest } = m;
                        return rest;
                    });

                    filteredDictionary[word] = {
                        word: word,
                        meanings: meanings
                    };
                }
            }
        } catch (err) {
            console.error(`Error reading or parsing ${file}:`, err);
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(filteredDictionary, null, 2));
    console.log(`Successfully created ${outputFile} with ${Object.keys(filteredDictionary).length} words.`);

} catch (err) {
    console.error('Error processing dictionary:', err);
    process.exit(1);
}
