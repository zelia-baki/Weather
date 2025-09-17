import { useState, useEffect } from "react";
import axiosInstance from "../../../axiosInstance";

const useFetchData = (endpoint, key) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(endpoint);
        setData(response.data[key] || []);
      } catch (err) {
        console.error(`Error fetching ${key}:`, err);
      }
    };
    fetchData();
  }, [endpoint, key]);
  return data;
};


export default useFetchData;
