import axios, { AxiosResponse } from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

import { prisma } from './src/lib/prisma';

async function createFile(name:string, response:AxiosResponse<any, any>) {
  const file = fs.createWriteStream(`./public/images/${name}`);

  return new Promise<boolean>((resolve, reject) => {
    response.data.pipe(file);
    file.on('finish',() => {
        file.close();
        resolve(true);

      });
    file.on('error', () => {file.close();
        reject(false);
      }
    );
  })
}

async function downloadFiles(downloadFiles: Array<string>) {
  console.log(`Starting download of ${downloadFiles.length} files. This will take few minutes. Please be patient...`);

  let fileDownloadCount = 0;

  const dir='./public/images/'

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  for (let i=0;i< downloadFiles.length;i++) {
    const link = downloadFiles[i];
    const name = path.basename(link);
    const url = link
    console.log('Downloading file: ' + name);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const createdFile = await createFile(name, response);

    if (createdFile) fileDownloadCount++;
  }

  console.log(`Finished downloading ${fileDownloadCount} of ${downloadFiles.length} files.`);
}

async function main(maxPages = 50) {

  // initialized with the webpage to visit
  const paginationURLsToVisit = ["https://scrapeme.live/shop"];
  const visitedURLs: Set<string> = new Set();
  const products = new Set();
  const imageSrc = new Set<string>();

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
      const productPriceCurrency = $(element).find(".woocommerce-Price-currencySymbol").text();


      if (productImg !== undefined) {
        imageSrc.add(productImg);
      }

      //when using vite relative path files are served from the public folder by default so there is no need to add the folder to the path - it will produce a warning in the console
      const localProductImg = (productImg !== undefined) ? `./images/${path.basename(productImg)}` : productImg;

      const product = {
          name: productName,
          price: productPrice.replaceAll(productPriceCurrency, ""),
          currency: productPriceCurrency,
          image: localProductImg,
          url: productURL
      }

      products.add(product);

      if (productURL === undefined) {
        return;
      }

      // create a function that will save the information about the product to the database
      const addData = async (data: typeof product) => {
        // use upsert to create row if it does not exist or update data if it has changed since last run
        // sqlite and prisma don't support createMany so we need to use per element inserts
        await prisma.scrapedData.upsert({
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
    });
  }

  console.log("Products added.");
  console.log('Downloading images...');
  await downloadFiles(Array.from(imageSrc));
  console.log('Done!');
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
