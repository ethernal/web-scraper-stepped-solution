import axios from 'axios';
import cheerio from 'cheerio';

import { PrismaClient } from '@prisma/client';

async function main(maxPages = 5) {
  const prisma = new PrismaClient();

  // initialized with the webpage to visit
  const paginationURLsToVisit = ["https://scrapeme.live/shop"];
  const visitedURLs: Set<string> = new Set();
  const products = new Set();

  // iterating until the queue is empty
  // or the iteration limit is hit
  while (paginationURLsToVisit.length !== 0 && visitedURLs.size <= maxPages) {
    // the current url to crawl
    const paginationURL = paginationURLsToVisit.pop();

    // if the queue is empty, skip the current iteration and continue the loop
    if (paginationURL === undefined) {
      continue;
    }

    // retrieving the HTML content from paginationURL
    const pageHTML = await axios.get(paginationURL);

    // adding the current webpage to the
    // web pages already crawled
    visitedURLs.add(paginationURL);

    // initializing cheerio on the current webpage
    const $ = cheerio.load(pageHTML.data);

    // retrieving the pagination URLs
    $(".page-numbers a").each((index, element) => {
      const paginationURL = $(element).attr("href");

      // if the queue is empty, skip to the next element in the loop
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
    console.log("Adding products...");

    // retrieving the product URLs
    $("li.product a.woocommerce-LoopProduct-link").each((index, element) => {
      // extract all information about the product

      const productURL = $(element).attr("href");
      const productImg = $(element).find("img").attr("src");
      const productName = $(element).find("h2").text();
      const productPrice = $(element).find(".woocommerce-Price-amount").text();
      const productPriceCurrency = $(element)
        .find(".woocommerce-Price-currencySymbol")
        .text();

      const product = {
        name: productName,
        price: productPrice.replaceAll(productPriceCurrency, ""), // remove currency symbol from the price
        currency: productPriceCurrency,
        image: productImg,
        url: productURL,
      };

      products.add(product);

      if (productURL === undefined) {
        return;
      }

      // create a function that will save the information about the product to the database
      const addData = async (data: typeof product) => {
        // use upsert to create row if it does not exist or update data if it has changed since last run
        // sqlite and prisma don't support createMany so we need to use per element inserts
        await prisma.scrappedData.upsert({
          where: {
            url: data.url,
          },
          create: {
            url: data.url,
            price: parseFloat(data.price),
            data: JSON.stringify(data),
          },
          update: {
            price: parseFloat(data.price),

            data: JSON.stringify(data),
          },
        });
      };

      // Here we're saving scrapped data to the database
      addData(product);

      console.log(`Added: ${JSON.stringify(product, undefined, 2)}`);
    });
  }

  console.log("Products added.");
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
