import axios from 'axios';
import cheerio from 'cheerio';

async function main(maxPages = 5) {
    // start with the initial webpage to visit
    const paginationURLsToVisit = ["https://scrapeme.live/shop"];

    // list of URLs the crawler has visited
    const visitedURLs:Set<string> = new Set();
    const productURLs = new Set();

    // iterating until the queue is empty
    // or the iteration limit is hit
    while (
        paginationURLsToVisit.length !== 0 &&
        visitedURLs.size <= maxPages
    ) {
        // get the current url to crawl
        const paginationURL = paginationURLsToVisit.pop();

        // if the queue is empty, break the loop
        if (paginationURL === undefined) {
            break;
        }

        // retrieving the HTML content of the page from paginationURL
        const pageHTML = await axios.get(paginationURL);

        // adding the current webpage to the set of
        // web pages already crawled
        visitedURLs.add(paginationURL);

        // initializing cheerio on the current webpage
        const $ = cheerio.load(pageHTML.data);

        // get all pagination URLs and for each page...
        // see image above
        $(".page-numbers a").each((index, element) => {
            const paginationURL = $(element).attr("href");
            // if the queue is empty, break the loop
            if (paginationURL === undefined) {
                return;
            }

            // adding the pagination URL to the queue
            // of web pages to crawl, if it wasn't yet crawled
            if (
                !visitedURLs.has(paginationURL) &&
                !paginationURLsToVisit.includes(paginationURL)
            ) {
                paginationURLsToVisit.push(paginationURL);
            }
        });

        // retrieve the product URLs
        $("li.product a.woocommerce-LoopProduct-link").each((index, element) => {
            const productURL = $(element).attr("href");
            productURLs.add(productURL);
        });
    }
    console.log([...productURLs]);
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
