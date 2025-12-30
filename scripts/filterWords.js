import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../src/data');
const dictionaryDir = path.join(dataDir, 'wordset-dictionary');
const enTxtFile = path.join(dataDir, 'en.txt');
const commonWordsFile = path.join(dataDir, 'common-words.txt');

const outDir = path.join(__dirname, '../public/data');
const allowedWordsFile = path.join(outDir, 'allowed-guesses.txt');
const dictionaryJsonFile = path.join(outDir, 'target-dictionary.json');

async function run() {
    try {
        // --- Task 1: allowed-words.txt ---
        console.log('Generating allowed-words.txt...');
        if (!fs.existsSync(enTxtFile)) {
            console.error(`Error: ${enTxtFile} not found.`);
            process.exit(1);
        }

        const enTxtContent = fs.readFileSync(enTxtFile, 'utf8');
        const allWords = enTxtContent.split(/\r?\n/);
        const allowedWords = [...new Set(allWords
            .map(w => w.trim().toLowerCase())
            .filter(word => word.length >= 4 && word.length <= 6 && /^[a-z]+$/.test(word))
        )].sort();

        fs.writeFileSync(allowedWordsFile, allowedWords.join('\n'));
        console.log(`Successfully created ${allowedWordsFile} with ${allowedWords.length} words.`);

        // --- Task 2: dictionary.json ---
        console.log('Generating dictionary.json for common words...');
        if (!fs.existsSync(commonWordsFile)) {
            console.error(`Error: ${commonWordsFile} not found.`);
            process.exit(1);
        }

        const commonWordsContent = fs.readFileSync(commonWordsFile, 'utf8');
        const commonWords = new Set(
            commonWordsContent.split(/\r?\n/)
                .map(w => w.trim().toLowerCase())
                .filter(word => word.length >= 4 && word.length <= 6)
        );

        const filteredDictionary = {};
        const jsonFiles = fs.readdirSync(dictionaryDir).filter(file => file.endsWith('.json'));

        jsonFiles.forEach(file => {
            const filePath = path.join(dictionaryDir, file);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                for (const [key, entry] of Object.entries(data)) {
                    const word = (entry.word || key).toLowerCase();
                    if (commonWords.has(word) && word.length >= 4 && word.length <= 6) {
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
                console.error(`Error processing ${file}:`, err);
            }
        });

        fs.writeFileSync(dictionaryJsonFile, JSON.stringify(filteredDictionary));
        console.log(`Successfully created ${dictionaryJsonFile} with ${Object.keys(filteredDictionary).length} words.`);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
