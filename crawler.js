const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = global.process.argv[2] || 'https://www.iban.com/exchange-rates';
console.log(`Url: ${url}`);
const depth = +global.process.argv[3] || 2;
console.log(`Depth: ${depth}`);

const results = [];

crawl(url, 0);

function crawl(url, depthIndex) {
    if (depthIndex === depth) {
        return;
    }
    fetchData(url, depthIndex).then( (res) => {
        if (res && res.data) {
            const html = res.data;
            fetchImages(depthIndex, html);
            fetchLinks(depthIndex, html);
            writeToFile(depthIndex);
        }
    });
}

function writeToFile(depthIndex) {
    fs.writeFile('results.json', JSON.stringify({ results }), (err) => {
        if (err) { throw err; }
        console.log(`${depthIndex}: ${url} -> Success!`);
    });
}

function fetchLinks(depthIndex, html) {
    depthIndex++;
    const $ = cheerio.load(html);
    $('a').each(function(i, element) {
        const a = $(this);
        crawl(a.attr('href'), depthIndex);
    });
}

function fetchImages(depthIndex, html) {
    const $ = cheerio.load(html);
    $('img').each(function(i, element) {
        const img = $(this);
        const image = { imageUrl: img.attr('src'), sourceUrl: url, depth: depthIndex };
        results.push(image);
    });
}

async function fetchData(url, depthIndex) {
    console.log(`${depthIndex}: ${url} -> Crawling data...`);
    // make http call to url
    let response = await axios(url).catch((err) => console.log(`${depthIndex}: ${url} -> ${err.message}`));

    if (!response || response.status !== 200) {
        console.log(`${depthIndex}: ${url} -> Error occurred while fetching data`);
        return;
    }
    return response;
}