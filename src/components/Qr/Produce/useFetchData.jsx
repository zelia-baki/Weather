import { useState, useEffect } from "react";
import axiosInstance from "../../../axiosInstance";

/**
 * useFetchData — fetch toutes les pages pour éviter la limite page=1 (6 items)
 * Gère la pagination automatiquement si l'API retourne total_pages.
 */
const useFetchData = (endpoint, key) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Page 1
        const response  = await axiosInstance.get(`${endpoint}?page=1&per_page=100`);
        const firstPage = response.data[key] || [];

        const totalPages = response.data.total_pages;

        if (totalPages && totalPages > 1) {
          // Fetch toutes les pages restantes en parallèle
          const promises = [];
          for (let page = 2; page <= totalPages; page++) {
            promises.push(axiosInstance.get(`${endpoint}?page=${page}&per_page=100`));
          }
          const rest = await Promise.all(promises);
          const allData = rest.reduce(
            (acc, res) => acc.concat(res.data[key] || []),
            firstPage
          );
          setData(allData);
        } else {
          setData(firstPage);
        }
      } catch (err) {
        console.error(`Error fetching ${key}:`, err);
        setData([]);
      }
    };

    fetchData();
  }, [endpoint, key]);

  return data;
};

export default useFetchData;