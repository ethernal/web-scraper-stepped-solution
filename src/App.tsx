import axios from 'axios';
import { useEffect, useState } from 'react';
import { useDebounce } from 'usehooks-ts';

type Product = {
  id: string;
  url: string;
  price: number;
  data: string;
  dataType: string;
  createdAt: Date;
  updatedAt: Date;
}
function App() {
  // use search url params to set initial data for the state
  const searchParams = new URLSearchParams(window.location.search);
  const priceParam = searchParams.get('price_lte') ?? '';
  const priceFromURL = isNaN(parseInt(priceParam)) ? 80 : parseInt(priceParam);

  const [products, setProducts] = useState<Product[]>([]);
  const [sortOptions, setSortOptions] = useState({ sortBy: searchParams.get('sortBy') || '', sortOrder: searchParams.get('sortOrder') || 'asc' });
  const [maxPrice, setMaxPrice] = useState(priceFromURL);
  const debouncedMaxPrice = useDebounce(maxPrice, 50);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      // create a query string based on the parameters passed
      // if any of the parameters is empty then don't add it to the query string
      const price_lte = 'price_lte=' + debouncedMaxPrice.toString();
      const sortBy = sortOptions.sortBy !== '' ? '&sortBy=' + sortOptions.sortBy : '';
      const sortOrder = sortOptions.sortBy !== '' && sortOptions.sortOrder !== '' ? '&sortOrder=' + sortOptions.sortOrder : '';

      // query will look like ?price_lte=80&sortBy=price&sortOrder=asc with all parameters
      // if sortBy is missing it and the sortOrder will not be added,
      // adding sortOrder alone will trigger an error with Prisma
      const queryParams = price_lte + sortBy + sortOrder;
      // these parameters should be part of the QueryParams on the frontend as well that way client can share the link
      // with current state of the application: use URLSearchParams
      history.pushState(queryParams, '', `?${queryParams}`);

      // the code below will prevent axios from throwing promise error (CanceledError) in the console when fetch is cancelled.
      // see answer by [Scott McAlister](https://stackoverflow.com/users/8288828/scott-mcallister) on [StackOverflow]() https://stackoverflow.com/questions/73140563/axios-throwing-cancelederror-with-abort-controller-in-react)
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.code === "ERR_CANCELED") {
            // aborted in useEffect cleanup
            return Promise.resolve({ status: 499 })
          }
          return Promise.reject((error.response && error.response.data) || 'Error')
        }
      );

      const products = (
        await axios.get(`http://localhost:3213/api/products?${queryParams}`, { signal: signal })).data;

      console.log('products', products);
      setProducts(products);
    }

    fetchData();

    return () => {
      console.log('Aborting fetch..')
      controller.abort();
    }
  }, [debouncedMaxPrice, sortOptions.sortBy, sortOptions.sortOrder])


  const handleSortByChange = () => {

    setSortOptions({ ...sortOptions, sortBy: sortOptions.sortBy === 'price' ? '' : 'price' })
  }

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOptions({ ...sortOptions, sortOrder: e.target.value });
  }

  return (
    <>
      <div className='py-8 sticky top-0 bg-slate-800 opacity-95'>
        <div className='flex justify-center items-baseline gap-2'>
          <label className='text-2xl font-bold' htmlFor='max-price'>Max Price: </label>
          <input
            id='max-price'
            type="range"
            min={25}
            max={200}
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            className="w-1/2"
          />
          <p className='text-2xl font-bold'>{maxPrice}</p>
        </div>
        <div className='flex justify-center items-baseline gap-2 mb-4 text-2xl'>
          <label htmlFor='sort'>Sort (by price)</label>
          <input type='checkbox'
            className='text-2xl font-bold me-4 w-6 h-6' id="sort"
            name="sort"
            checked={sortOptions.sortBy === 'price' ? true : false}
            aria-checked={sortOptions.sortBy === 'price' ? true : false}
            onChange={handleSortByChange}
          />
          {/* dropdown to select asc or desc sort order for the query param */}
          <select name="sortOrder" id="sortOrder" value={sortOptions.sortOrder} onChange={handleSortOrderChange}>
            <option value="asc">Lowest first</option>
            <option value="desc">Highest first</option>
          </select>

        </div>
        <div className='flex justify-center items-baseline gap-2'>
          <p className='text-2xl font-bold'>Total Products: {products?.length}</p>
        </div>
      </div>

      {/* Products List */}
      <div className='w-full grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 p-8'>
        {products?.map((data) => {

          const metadata = JSON.parse(data.data);
          return (
            <div key={data.url} className='border-slate-300 bg-slate-600 border-2 p-4 flex flex-col gap-2'>
              <h1 className='text-4xl font-bold self-center'>{metadata.name}</h1>
              <img src={metadata.image} alt={metadata.name} />
              <p className='bg-slate-300 text-black p-2 inline-block rounded-lg self-start font-bold text-xl tracking-wide'>{metadata.currency}{data.price}</p>
            </div>
          )
        }
        )}
      </div>
    </>
  )
}

export default App
