// import required modules for server and connection between front and backend
import cors from 'cors';
import express from 'express';

// import database library
import { prisma } from './src/lib/prisma';

type RequestParams = {
  price_lte?: string
  sortBy?: string
  sortOrder?: string
}

const DEFAULT_MAX_PRICE = 100;
// server port setup
const PORT = process.env.PORT || 3213;

// create an instance of an Express server
const app = express();

// apply cors middleware with no settings (allows all connections)
app.use(cors());

// create a route that will respond with all data that we have in a DB
// under http://localhost:3213/api/products
app.get('/api/products', async (req, res) => {

  const {price_lte, sortBy = '', sortOrder = 'asc'} = req.query as RequestParams;
  // query parameters from request since it's all passed as strings we need to parse data as well
  const maxPrice = isNaN(parseInt(price_lte ?? '')) ? DEFAULT_MAX_PRICE : parseInt(price_lte!); // set default value if not given (never trust data from the frontend)

  // build part of the query based on the parameters passed
  const orderByQuery = sortBy !== '' ? {
    orderBy: {
      [sortBy]: sortOrder
    }
  } : undefined; // return undefined so that the query is empty and ignored when destructuring below

  // declare a function that gets all data from the DB
  const fetchData = async () => {

    const data = await prisma.scrapedData.findMany({
      where: {
        price: {
          lte: maxPrice
        }
      },
      ...orderByQuery
    });
    return data;
  }

  return res.status(200).json(await fetchData()); // return all data with success status
})

// start the server on set port and display message in the console
app.listen(PORT, () => {
  console.log(`Server Listening on: http://localhost:${PORT}`);
});
