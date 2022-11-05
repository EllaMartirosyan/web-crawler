const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = global.process.argv[2] || 'https://www.iban.com/exchange-rates';
console.log(url);
const depth = +global.process.argv[3] || 3;
console.log('Depth: ' + depth);

let depthIndex = 0;

const results = [];

crawl(url, depthIndex);

function crawl(url, depthIndex) {
    if (depthIndex === depth) {
        return;
    }
    fetchData(url).then( (res) => {
        const html = res.data;
        fetchImages(html);
        fetchLinks(html);
        writeToFile();
    });
}

function writeToFile() {
    fs.writeFile('results.json', JSON.stringify({ results }), (err) => {
        if (err) { throw err; }
        console.log(`${url} -> Success!`);
    });
}

function fetchLinks(html) {
    depthIndex++;
    const $ = cheerio.load(html);
    $('a').each(function(i, element) {
        const a = $(this);
        crawl(a.attr('href'), depthIndex);
    });
}

function fetchImages(html) {
    const $ = cheerio.load(html);
    $('img').each(function(i, element) {
        const img = $(this);
        const image = { imageUrl: img.attr('src'), sourceUrl: url, depth: depthIndex };
        results.push(image);
    });
}

async function fetchData(url) {
    console.log('Crawling data...')
    // make http call to url
    let response = await axios(url).catch((err) => console.log(err));

    if (response.status !== 200) {
        console.log("Error occurred while fetching data");
        return;
    }
    return response;
}