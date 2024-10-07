"use client"

import { useEffect, useRef, useState } from "react"
import {
  createThirdwebClient,
  defineChain,
  getContract,
  readContract,
} from "thirdweb"
import { useActiveAccount } from "thirdweb/react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ActionModal from "@/components/ActionModal"
import ChainStats from "@/components/ChainStats"
import LiquidityChart from "@/components/LiquidityChart"
import UserOptions from "@/components/UserOptions"
import { ethers } from "ethers"

export default function Home() {
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
          name: "Arbitrium Sepolia",
          logo: "/arbitrumsepolia.webp",
          color: "#323C96",
          chainID: 421614,
          rpc: "https://arbitrum-sepolia.blockpi.network/v1/rpc/",
          wormholeID: 10003,
          spokeAddress: "",
          tokenAddress: "",
          symbol: "ETH",
          balance: "0",
          data: [],
        },
        {
          name: "Base Sepolia",
          logo: "/baseSepolia.webp",
          color: "rgb(50, 60, 150)",
          chainID: 84532,
          rpc: "https://sepolia.base.org",
          wormholeID: 10004,
          spokeAddress: "",
          tokenAddress: "",
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
          spokeAddress: "",
          tokenAddress: "",
          symbol: "ETH",
          balance: "0",
          data: [],
        },
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

    const contract = getContract({
      client,
      chain: defineChain(11155111),
      address: "0x76414c98ee9AD3F776054f16A351831b71870Ff3",
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
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-3xl font-bold">CrossChain USDC Loans</h1>
      <p className="mb-4">
      CrossChain USDC Loans innovates DeFi by offering a multi-chain lending and
        borrowing protocol...
      </p>

      <div className="mb-4 flex justify-between">
        <UserOptions chains={chains} updateStats={updateStats} />
        <div className="flex">
          <p className="mr-3">
            Deposited: <span>{deposited} MTC</span>
          </p>
          <p>
            Borrowed: <span>{borrowed} MTC</span>
          </p>
        </div>
      </div>
      <div className="flex">
        <div className="w-2/3">
          <LiquidityChart chains={chains} />
        </div>
        <div className="w-1/3">
          <ChainStats chains={chains} />
        </div>
      </div>
    </div>
  )
}
