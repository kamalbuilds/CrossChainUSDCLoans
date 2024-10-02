// @ts-nocheck
import React, { useState } from "react"
import { ethers } from "ethers"
import {
  createThirdwebClient,
  defineChain,
  getContract,
  prepareContractCall,
} from "thirdweb"
import { useSendTransaction } from "thirdweb/react"

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export default function ActionModal({ action, chains, updateStats }) {
  const [amount, setAmount] = useState("")
  const [selectedChain, setSelectedChain] = useState(null)

  const { mutate: sendTransaction } = useSendTransaction();

  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_KEY!,
  })


  const handleSubmit = async (e: any) => {
    e.preventDefault();

    console.log(selectedChain, amount)

    console.log("Called submit")
    if (!selectedChain || !amount) return

    try {
        console.log("action", action , amount.toString())
      const weiAmount = ethers.parseEther(amount.toString())

      if (action === "Deposit") {
        const contract = getContract({
          client,
          chain: defineChain(selectedChain.chainID),
          address: selectedChain?.spokeAddress,
        })

        const transaction = prepareContractCall({
          contract,
          method: "function deposit(uint256 amount)",
          params: [weiAmount],
        })

        await sendTransaction(transaction)
      } else if (action === "Withdraw") {
        const contract = getContract({
          client,
          chain: defineChain(selectedChain.chainID),
          address: selectedChain?.spokeAddress,
        })

        const transaction = await prepareContractCall({
          contract,
          method: "function requestWithdraw(uint256 amount)",
          params: [weiAmount],
        })

        await sendTransaction(transaction)
      } else if (action === "Borrow") {
        const contract = getContract({
          client,
          chain: defineChain(selectedChain.chainID),
          address: selectedChain?.spokeAddress,
        })

        const transaction = await prepareContractCall({
          contract,
          method: "function requestBorrow(uint256 amount)",
          params: [weiAmount],
        })

        await sendTransaction(transaction)
      } else if (action === "Repay") {
        const contract = getContract({
          client,
          chain: defineChain(selectedChain.chainID),
          address: selectedChain?.spokeAddress,
        })

        const transaction = await prepareContractCall({
          contract,
          method: "function repayBorrow(uint256 amount)",
          params: [weiAmount],
        })

        await sendTransaction(transaction)
      }

      updateStats(weiAmount) // Update stats after the transaction
      // setIsModalOpen(false);
    } catch (err) {
      console.error(err)
    }
  }

  const updatetheselectedchain = (value) => {
    const chain = chains.find((chain) => chain.name === value)
    setSelectedChain(chain)
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">{action}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action}</AlertDialogTitle>
            <AlertDialogDescription></AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="modal">
              <div className="modal-content">
                <div className="mb-3">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    type="number"
                    className="form-control"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-3">
                  <Label htmlFor="chains-dropdown">Chain</Label>
                  <Select onValueChange={(value) => updatetheselectedchain(value)}>
                    <SelectTrigger className="">
                      <SelectValue placeholder="Select Chain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select Chain</SelectLabel>
                        {chains.map((chain) => (
                          <SelectItem value={chain.name}>
                            {chain.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button className="btn btn-primary" type="submit">
                Execute
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
