import axios from 'axios';
import cheerio from 'cheerio';

async function main(maxPages = 5) {
  console.log(`Hello World. Scraping ${maxPages} pages.`);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((e) => {
        // logging the error message
        console.error(e);

        process.exit(1);
    });
