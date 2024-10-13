import { useState, useEffect } from 'react';
import { createThirdwebClient, defineChain, getContract, readContract } from 'thirdweb';
import { useReadContract } from "thirdweb/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LiquidityChart({ chains } : any) {
    const [liquidityData, setLiquidityData] = useState([]);
    const [labels, setLabels] = useState([]);

    const client = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_KEY!,
    });

    const contract = getContract({
        client,
        chain: defineChain(11155111),
        address: "0x30429ac3d1ac9182c8b062706fd0ebb781dd144d",
    });

    useEffect(() => {
        const fetchLiquidityData = async () => {
            const allChainData = [];
            const newLabels = [];

            for (const chain of chains) {
                const id = chain.wormholeID;
                const chainData = [];

                for (let i = 0; i < 1000; i++) {
                    try {
                        const data = await readContract({
                            contract,
                            method: "function spokeBalancesHistorical(uint16, uint256) view returns (uint256)",
                            params: [id, BigInt(i)]
                        });

                        console.log(data, "data")
                        chainData.push(parseInt(data?.toString()!) / 10 ** 6);
                        console.log(id, data);

                        if (newLabels.length <= i) {
                            newLabels.push(i);
                        }
                    } catch (err) {
                        console.error(`Error fetching data for ${chain.name} at index ${i}:`, err);
                        break;
                    }
                }

                allChainData.push({
                    name: chain.name,
                    data: chainData,
                    color: chain.color,
                });
            }

            setLiquidityData(allChainData);
            setLabels(newLabels);
        };

        fetchLiquidityData();
    }, [chains]);

    const chartData = labels.map((label, index) => {
        const dataPoint = { label };
        liquidityData.forEach(chain => {
            dataPoint[chain.name] = chain.data[index];
        });
        return dataPoint;
    });

    console.log('Liquidity Data:', chartData);

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {liquidityData.map(chain => (
                        <Line
                            key={chain.name}
                            type="monotone"
                            dataKey={chain.name}
                            stroke={chain.color}
                            activeDot={{ r: 8 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
