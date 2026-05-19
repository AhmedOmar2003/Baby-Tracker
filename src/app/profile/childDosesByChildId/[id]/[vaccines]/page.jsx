'use client';
import Spinner from '@/Components/Spinner/Spinner';
import { host } from '@/Components/utils/Host';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import './vaccinesDetailsByChild.css';
import PageTitle from '@/Components/PageTitle/PageTitle';
export default function VaccinesDetails() {
  const params = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${host}/vaccine/vaccinesByDoseId/${params.vaccines}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })
      .then((response) => {
        // console.log(response.data.data.rows[0]);
        setData(response.data.data.rows);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <div className="vaccines">
          <PageTitle text="Dose's vaccines" />
          <div className="container" style={{marginTop: "30px"}}>
            {data.map((item, index) => {
              return (
                <div className="vaccinesDetails" key={index}>
                  <h3>{item.vaccine_name}</h3>
                  <div className="mianAndMax">
                    <h5>Min Age <span>{item.min_age} M</span></h5>
                    <h5>Max Age <span>{item.max_age} M</span></h5>
                  </div>
                  <p>{item.description || 'No description available for this vaccine.'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
