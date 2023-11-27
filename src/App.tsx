import axios from 'axios';
import { useEffect, useState } from 'react';

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
  const [maxPrice, setMaxPrice] = useState(priceFromURL);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      // create a query string based on the parameters passed
      const price_lte = 'price_lte=' + maxPrice.toString();

      // query will look like ?price_lte=80 by default
      const queryParams = price_lte;

      const products = (
        await axios.get(`http://localhost:3213/api/products?${queryParams}`,{signal:signal})).data;

      console.log('products', products);
      setProducts(products);
    }

    fetchData();
  },[maxPrice])

  return (
    <>
      {/* Products List */}
      <div className='w-full grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 p-8'>
        {products?.map((data) =>  {

          const metadata = JSON.parse(data.data);
          return (
          <div key={data.url} className='border-slate-300 bg-slate-600 border-2 p-4 flex flex-col gap-2'>
            <h1 className='text-4xl font-bold self-center'>{metadata.name}</h1>
          </div>
        )
        }
        )}

      </div>
    </>
  )
}
export default App
