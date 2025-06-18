const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const Fuse = require('fuse.js');

const COLLECTIONS_DIR = path.join(__dirname, 'files');
const FILES_INFO_PATH = path.join(__dirname, 'files_info.json');

function parseXML(xmlContent) {
    const dom = new JSDOM(xmlContent, { contentType: 'text/xml' });
    const lines = [...dom.window.document.querySelectorAll('l')];
    return lines.map((el, i) => ({
        text: el.textContent.trim(),
        facs: el.getAttribute('facs')
    }));
}

function buildIndex(items) {
    const fuseIndex = Fuse.createIndex(['text'], items)
    return {
        rawDocs: items,
        index: fuseIndex.toJSON(),
    };
}

function processCollection(collection) {
    const { path: collectionPath, pages } = collection;
    const xmlDir = path.join(COLLECTIONS_DIR, collectionPath, 'xml');
    if (!fs.existsSync(xmlDir)) return;

    const allLines = [];

    pages.forEach((pageName, pageIndex) => {
        const filePath = path.join(xmlDir, `${pageName}.xml`);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Missing file: ${filePath}`);
            return;
        }
        const xmlContent = fs.readFileSync(filePath, 'utf-8');
        const lines = parseXML(xmlContent).map(obj => ({
            ...obj,
            page: pageIndex + 1,
            page_name: pageName,
        }));
        allLines.push(...lines);
    });

    const indexData = buildIndex(allLines);
    const outputPath = path.join(COLLECTIONS_DIR, collectionPath, 'index.json');
    fs.writeFileSync(outputPath, JSON.stringify(indexData, null, 2));
    console.log(`✅ Indexed ${collectionPath} (${pages.length} pages) → ${outputPath}`);
}

function main() {
    const filesInfo = JSON.parse(fs.readFileSync(FILES_INFO_PATH, 'utf-8'));
    filesInfo.forEach(processCollection);
}

main();