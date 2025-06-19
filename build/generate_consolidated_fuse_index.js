const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const Fuse = require('fuse.js');

const COLLECTIONS_DIR = path.join(__dirname, 'files');
const FILES_INFO_PATH = path.join(__dirname, 'files_info.json');
const CONSOLIDATED_INDEX_PATH = path.join(__dirname, 'files', 'consolidated_index.json');

function parseXML(xmlContent) {
    const dom = new JSDOM(xmlContent, { contentType: 'text/xml' });
    const lines = [...dom.window.document.querySelectorAll('l')];
    return lines.map((el, i) => ({
        text: el.textContent.trim(),
        facs: el.getAttribute('facs')
    }));
}

function buildConsolidatedIndex(items) {
    const fuseIndex = Fuse.createIndex(['text', 'collection', 'page_name'], items);
    return {
        rawDocs: items,
        index: fuseIndex.toJSON(),
        meta: {
            generated: new Date().toISOString(),
            totalLines: items.length,
            collections: [...new Set(items.map(item => item.collection))],
            totalPages: [...new Set(items.map(item => `${item.collection}/${item.page_name}`))].length
        }
    };
}

function processAllCollections() {
    const filesInfo = JSON.parse(fs.readFileSync(FILES_INFO_PATH, 'utf-8'));
    const allLines = [];

    filesInfo.forEach(collection => {
        const { path: collectionPath, pages } = collection;
        const xmlDir = path.join(COLLECTIONS_DIR, collectionPath, 'xml');
        
        if (!fs.existsSync(xmlDir)) {
            console.warn(`⚠️ Missing XML directory: ${xmlDir}`);
            return;
        }

        console.log(`Processing collection: ${collectionPath}`);
        
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
                collection: collectionPath,
                file_path: `${collectionPath}/xml/${pageName}.xml`
            }));
            allLines.push(...lines);
        });
    });

    const consolidatedIndex = buildConsolidatedIndex(allLines);
    fs.writeFileSync(CONSOLIDATED_INDEX_PATH, JSON.stringify(consolidatedIndex, null, 2));
    
    console.log(`✅ Consolidated index created: ${CONSOLIDATED_INDEX_PATH}`);
    console.log(`📊 Total lines indexed: ${allLines.length}`);
    console.log(`📚 Collections processed: ${consolidatedIndex.meta.collections.length}`);
    console.log(`📄 Total pages processed: ${consolidatedIndex.meta.totalPages}`);
    
    return consolidatedIndex;
}

function main() {
    try {
        processAllCollections();
    } catch (error) {
        console.error('❌ Error generating consolidated index:', error);
    }
}

main();