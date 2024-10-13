"use client"

import { useEffect, useRef, useState } from "react"
import {
  createThirdwebClient,
  defineChain,
  getContract,
  readContract,
} from "thirdweb"
import { useActiveAccount } from "thirdweb/react"
import { ethers } from "ethers"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ActionModal from "@/components/ActionModal"
import ChainStats from "@/components/ChainStats"
import LiquidityChart from "@/components/LiquidityChart"
import UserOptions from "@/components/UserOptions"

export default function Dashboard() {
  const [deposited, setDeposited] = useState(0)
  const [borrowed, setBorrowed] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [action, setAction] = useState("")
  const [chains, setChains] = useState([])

  const chainsRef = useRef([])
  const address = useActiveAccount()

  useEffect(() => {
    if (address?.address) {
      updateStats()
    }
  }, [address])

  useEffect(() => {
    const loadChains = async () => {
      const spokechainsData = [
        {
          name: "Base Sepolia",
          logo: "/baseSepolia.webp",
          color: "rgb(50, 60, 150)",
          chainID: 84532,
          rpc: "https://sepolia.base.org",
          wormholeID: 10004,
          spokeAddress: "0x42bf9b7d5c3627b273d7ce3929ef0c224209e89b",
          tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          symbol: "ETH",
          balance: "0",
          data: [],
        },
        {
          name: "OP Sepolia",
          logo: "/optimismSepolia.webp",
          color: "rgb(200, 50, 200)",
          chainID: 11155420,
          rpc: "https://sepolia.optimism.io",
          wormholeID: 10005,
          spokeAddress: "0x42bf9b7d5c3627b273d7ce3929ef0c224209e89b",
          tokenAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
          symbol: "ETH",
          balance: "0",
          data: [],
        },
        {
          name: "Avalanche Fuji",
          logo: "/avax.png",
          color: "rgb(200, 50, 50)",
          chainID: 43113,
          rpc: "https://rpc.ankr.com/avalanche_fuji",
          wormholeID: 6,
          spokeAddress: "0x42bf9b7D5c3627b273D7ce3929EF0c224209E89b",
          tokenAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
          symbol: "AVAX",
          balance: "0",
          data: [],
        }
      ]

      chainsRef.current = spokechainsData
      setChains(spokechainsData)
    }

    loadChains()
  }, [])

  useEffect(() => {
    const fetchChainBalances = async () => {
      const updatedChains = [...chainsRef.current]

      for (let i = 0; i < updatedChains.length; i++) {
        const chain = updatedChains[i]
        const client = createThirdwebClient({
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_KEY!,
        })

        const contract = getContract({
          client,
          chain: defineChain(chain.chainID),
          address: chain.tokenAddress,
        })

        const balance = await readContract({
          contract,
          method: "function balanceOf(address) view returns (uint256)",
          params: [address?.address!],
        });

        console.log(balance, "balance");

        const weiBalance = ethers.formatEther(balance);

        updatedChains[i].balance = weiBalance;
      }

      chainsRef.current = updatedChains
      setChains(updatedChains)
    }

    if (chains.length > 0) {
      fetchChainBalances()
    }
  }, [address])

  const handleAction = (actionType) => {
    setAction(actionType)
    setIsModalOpen(true)
  }

  const updateStats = async () => {
    const client = createThirdwebClient({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_KEY!,
    })

    // hub contract
    const contract = getContract({
      client,
      chain: defineChain(11155111),
      address: "0xDdcD1015078baa3E5794Eb8d9Ff4Df4835669A9c",
    })

    const borrowsdata = await readContract({
      contract,
      method: "function borrows(address) view returns (uint256)",
      params: [address?.address!],
    })

    const depositdata = await readContract({
      contract,
      method: "function deposits(address) view returns (uint256)",
      params: [address?.address!],
    })

    setDeposited(Number(depositdata) / 10 ** 18)
    setBorrowed(Number(borrowsdata) / 10 ** 18)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-4xl font-bold text-center">CrossChain USDC Loans</h1>
      <Card className="mb-8">
        <CardContent className="p-6">
          <p className="text-lg text-center text-gray-600">
            CrossChain USDC Loans innovates DeFi by offering a multi-chain lending and
            borrowing protocol, enabling seamless cross-chain liquidity management.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Deposited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{deposited} USDC</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Borrowed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{borrowed} USDC</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <UserOptions chains={chains} updateStats={updateStats} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Liquidity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <LiquidityChart chains={chains} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chain Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <ChainStats chains={chains} />
          </CardContent>
        </Card>
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        action={action}
        chains={chains}
        updateStats={updateStats}
      />
    </div>
  )
}
