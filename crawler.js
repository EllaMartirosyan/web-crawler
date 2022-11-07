const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { unlinkSync } = require('fs');

const FILE = 'results.json';

const url = global.process.argv[2] || 'https://dataloop.ai';
console.log(`Url: ${url}`);
const depth = +global.process.argv[3] || 2;
console.log(`Depth: ${depth}`);

let pendingRecursive = 1;
let id = 1;
let seperator = '';
let results;

try {
  unlinkSync(FILE);
  results = fs.createWriteStream(FILE, { flags: 'a' });
  console.log();
  results.write('{\n\t\t"results": [\n');
  crawl(url, 0);
} catch (error) {
  console.error('Error:', error.message);
}

function crawl(urlToFetch, depthIndex) {
  if (depthIndex === depth-1) {
    pendingRecursive++;
  }
  fetchData(urlToFetch, depthIndex).then( (res) => {
    if (res && res.data) {
      const html = res.data;
      fetchImages(depthIndex, urlToFetch, html);
      depthIndex++;
      if (depthIndex === depth) {
        return;
      }
      fetchLinks(depthIndex, html);
    }
  });
}

async function fetchData(urlToFetch, depthIndex) {
  console.log(`${depthIndex}: ${urlToFetch} -> Crawling data...`);
  let response = await axios(urlToFetch).catch((err) => {
    console.log(`${depthIndex}: ${urlToFetch} -> ${err.message}`);
    if (depthIndex === depth-1) {
      if (--pendingRecursive == 0) {
        closeFile();
      }
    }
  });
  if (!response || response.status !== 200) {
    console.log(`${depthIndex}: ${urlToFetch} -> Error occurred while fetching data`);
    if (depthIndex === depth-1) {
      if (--pendingRecursive == 0) {
        closeFile();
      }
    }
    return;
  }
  return response;
}

function fetchImages(depthIndex, urlToFetch, html) {
  const $ = cheerio.load(html);
  $('img').each(function(i, element) {
    const img = $(this);
    const image = { id: id++, imageUrl: img.attr('src'), sourceUrl: urlToFetch, depth: depthIndex };
    results.write(`${seperator}\t\t\t\t${JSON.stringify(image)}`);
    if (!seperator) {
      seperator = ',\n';
    }
  });
  if (depthIndex === depth-1) {
    if (--pendingRecursive == 0) {
      closeFile();
    }
  }
}

function fetchLinks(depthIndex, html) {
  const $ = cheerio.load(html);
  $('a').each(function(i, element) {
    const a = $(this);
    crawl(a.attr('href'), depthIndex);
  });
}

function closeFile() {
  results.write('\n\t\t]\n}');
  results.end();
}