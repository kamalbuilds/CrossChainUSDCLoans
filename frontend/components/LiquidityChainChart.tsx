import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LiquidityChainChart = ({
    chains
}) => {
    // console.log("Chains >>", chains);

    const chainData = {
        labels: Array.from({ length: 1000 }, (_, i) => i),
        datasets: chains.map((chain, index) => ({
            label: chain.name,
            data: index,
            borderColor: chain.color,
            tension: 0.2,
        })),
    };

    console.log("chainData", chainData);

    return (
        <div>
            <LineChart
                width={500}
                height={300}
                data={chainData.datasets}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="data" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
        </div>
    );
};

export default LiquidityChainChart;