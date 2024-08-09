import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import axios from 'axios';

function Graph() {
  const [monthlyProduction, setMonthlyProduction] = useState(new Array(12).fill(0));
  const [yearlyProduction, setYearlyProduction] = useState(new Array(12).fill(0));

  // Les mois
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

  useEffect(() => {
    // Appel à l'API pour récupérer les données de production
    axios.get('/api/production')
      .then(response => {
        const { monthly_production, yearly_production } = response.data;
        setMonthlyProduction(monthly_production);
        setYearlyProduction(yearly_production);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des données :', error);
      });
  }, []);

  // Données pour les graphiques
  const chartDataMonth = {
    labels: months,
    datasets: [
      {
        label: "Production Mensuelle",
        data: monthlyProduction,
        backgroundColor: '#E3C6B1',
        borderColor: '#E3C6B1',
      }
    ]
  };

  const chartDataYear = {
    labels: months,
    datasets: [
      {
        label: "Production Annuelle",
        data: yearlyProduction,
        backgroundColor: '#B1E3C6',
        borderColor: '#B1E3C6',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className='Graph'>
      <div className='container'>
        <div className='chart'>
          <Bar data={chartDataMonth} />
        </div>
        <div className='chart'>
          <Line data={chartDataMonth} />
        </div>
        <div className='chart'>
          <Doughnut data={chartDataMonth} />
        </div>
        <div className='chart'>
          <Pie data={chartDataMonth} options={options} />
        </div>
        <div className='chart'>
          <Bar data={chartDataYear} />
        </div>
        <div className='chart'>
          <Line data={chartDataYear} />
        </div>
        <div className='chart'>
          <Doughnut data={chartDataYear} />
        </div>
        <div className='chart'>
          <Pie data={chartDataYear} options={options} />
        </div>
      </div>
    </div>
  );
}

export default Graph;
