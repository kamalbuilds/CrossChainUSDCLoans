// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import tokenMessengerAbi from '../../abis/cctp/TokenMessenger.json'
import messageTransmitterAbi from '../../abis/cctp/MessageTransmitter.json'
import usdcAbi from '../../abis/USDC.json'

const chains = {
  'eth-sepolia': {
    name: 'Ethereum Sepolia',
    rpc: process.env.NEXT_PUBLIC_ETH_SEPOLIA_TESTNET_RPC,
    tokenMessengerAddress: process.env.NEXT_PUBLIC_ETH_SEPOLIA_TOKEN_MESSENGER_CONTRACT_ADDRESS,
    usdcAddress: process.env.NEXT_PUBLIC_USDC_ETH_SEPOLIA_CONTRACT_ADDRESS,
    destinationDomain: '0',
  },
  'op-sepolia': {
    name: 'Optimism Sepolia',
    rpc: process.env.NEXT_PUBLIC_OP_SEPOLIA_TESTNET_RPC,
    messageTransmitterAddress: process.env.NEXT_PUBLIC_OP_SEPOLIA_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS,
    destinationDomain: '2',
  },
  'polygon-amoy': {
    name: 'Polygon Amoy',
    rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_TESTNET_RPC,
    messageTransmitterAddress: process.env.NEXT_PUBLIC_POLYGON_AMOY_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS,
    destinationDomain: process.env.NEXT_PUBLIC_POLYGON_AMOY_DESTINATION_DOMAIN,
  },
}

export default function CCTPTransfer() {
  const [sourceChain, setSourceChain] = useState('eth-sepolia')
  const [destinationChain, setDestinationChain] = useState('op-sepolia')
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [wallet, setWallet] = useState(null)

  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' })
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const signer = provider.getSigner()
          setWallet(signer)
        } catch (error) {
          console.error('Failed to connect wallet:', error)
        }
      } else {
        console.error('Metamask is not installed')
      }
    }
    connectWallet()
  }, [])

  const handleTransfer = async () => {
    setIsLoading(true)
    setStatus('Starting cross-chain transfer...')

    try {
      const sourceProvider = new ethers.providers.JsonRpcProvider(chains[sourceChain].rpc)
      const destinationProvider = new ethers.providers.JsonRpcProvider(chains[destinationChain].rpc)

      const usdcContract = new ethers.Contract(chains[sourceChain].usdcAddress, usdcAbi, wallet.connect(sourceProvider))
      const tokenMessengerContract = new ethers.Contract(chains[sourceChain].tokenMessengerAddress, tokenMessengerAbi, wallet.connect(sourceProvider))
      const messageTransmitterContract = new ethers.Contract(chains[destinationChain].messageTransmitterAddress, messageTransmitterAbi, wallet.connect(destinationProvider))

      const amountInWei = ethers.parseUnits(amount, 6) // USDC has 6 decimal places
      const destinationAddressInBytes32 = ethers.hexlify(recipientAddress)

      setStatus('Approving USDC contract on source chain...')
      const approveTx = await usdcContract.approve(chains[sourceChain].tokenMessengerAddress, amountInWei)
      await approveTx.wait()

      setStatus('Burning USDC on source chain...')
      const burnTx = await tokenMessengerContract.depositForBurn(amountInWei, chains[destinationChain].destinationDomain, destinationAddressInBytes32, chains[sourceChain].usdcAddress)
      const burnTxReceipt = await burnTx.wait()

      setStatus('Retrieving message bytes from logs...')
      const eventTopic = ethers.id('MessageSent(bytes)')
      const log = burnTxReceipt.logs.find((l) => l.topics[0] === eventTopic)

      if (!log) {
        throw new Error('No MessageSent event found')
      }

      const messageBytes = ethers.defaultAbiCoder.decode(['bytes'], log.data)[0]
      const messageBytesHash = ethers.keccak256(messageBytes)

      setStatus('Fetching attestation signature...')
      let attestationResponse = { status: 'pending' }
      while (attestationResponse.status !== 'complete') {
        setStatus('Checking for attestation...')
        const response = await fetch(`https://iris-api-sandbox.circle.com/attestations/${messageBytesHash}`)
        attestationResponse = await response.json()
        if (attestationResponse.status !== 'complete') {
          await new Promise(r => setTimeout(r, 5000))
        }
      }

      const attestationSignature = attestationResponse.attestation

      setStatus('Receiving funds on destination chain...')
      const receiveTx = await messageTransmitterContract.receiveMessage(messageBytes, attestationSignature)
      const receiveTxReceipt = await receiveTx.wait()

      setStatus(`Transfer complete! Transaction hash: ${receiveTxReceipt.transactionHash}`)
    } catch (error) {
      console.error('Transfer failed:', error)
      setStatus(`Transfer failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>CCTP Transfer</CardTitle>
        <CardDescription>Transfer USDC across chains using Circle CCTP</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="sourceChain">Source Chain</Label>
              <Select value={sourceChain} onValueChange={setSourceChain}>
                <SelectTrigger id="sourceChain">
                  <SelectValue placeholder="Select source chain" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {Object.entries(chains).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>{chain.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="destinationChain">Destination Chain</Label>
              <Select value={destinationChain} onValueChange={setDestinationChain}>
                <SelectTrigger id="destinationChain">
                  <SelectValue placeholder="Select destination chain" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {Object.entries(chains).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>{chain.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input id="recipient" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <Button onClick={handleTransfer} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Transfer
        </Button>
        {status && <p className="mt-2 text-sm text-muted-foreground">{status}</p>}
      </CardFooter>
    </Card>
  )
}