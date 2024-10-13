// @ts-nocheck
import React, { useState } from "react"
import { ethers } from "ethers"
import axios from 'axios'
import {
  createThirdwebClient,
  defineChain,
  getContract,
  prepareContractCall,
  sendAndConfirmTransaction,
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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function ActionModal({ action, chains, updateStats }) {
  const [amount, setAmount] = useState("")
  const [selectedChain, setSelectedChain] = useState(null)
  const [executionMethod, setExecutionMethod] = useState("thirdweb")

  const { mutate: sendTransaction } = useSendTransaction();

  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_KEY!,
  })

  const executeWithCircle = async (abiFunctionSignature, abiParameters) => {
    const options = {
      method: 'POST',
      url: 'https://api.circle.com/v1/w3s/user/transactions/contractExecution',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_CIRCLE_API_KEY}`,
        accept: 'application/json',
        'content-type': 'application/json',
        'X-User-Token': process.env.NEXT_PUBLIC_CIRCLE_USER_TOKEN
      },
      data: {
        abiFunctionSignature,
        abiParameters,
        idempotencyKey: crypto.randomUUID(),
        contractAddress: selectedChain.spokeAddress,
        feeLevel: 'HIGH',
        walletId: process.env.NEXT_PUBLIC_CIRCLE_WALLET_ID
      }
    };

    try {
      const { data } = await axios.request(options);
      console.log(data);
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!selectedChain || !amount) return

    try {
      const weiAmount = ethers.parseEther(amount.toString())

      if (executionMethod === "circle") {
        let abiFunctionSignature, abiParameters;

        switch(action) {
          case "Deposit":
            abiFunctionSignature = "deposit(uint256)";
            break;
          case "Withdraw":
            abiFunctionSignature = "requestWithdraw(uint256)";
            break;
          case "Borrow":
            abiFunctionSignature = "requestBorrow(uint256)";
            break;
          case "Repay":
            abiFunctionSignature = "repayBorrow(uint256)";
            break;
        }

        abiParameters = [weiAmount.toString()];

        await executeWithCircle(abiFunctionSignature, abiParameters);
      } else {
        const contract = getContract({
          client,
          chain: defineChain(selectedChain.chainID),
          address: selectedChain?.spokeAddress,
        })

        let method;
        switch(action) {
          case "Deposit":
            method = "function deposit(uint256 amount)";
            break;
          case "Withdraw":
            method = "function requestWithdraw(uint256 amount)";
            break;
          case "Borrow":
            method = "function requestBorrow(uint256 amount)";
            break;
          case "Repay":
            method = "function repayBorrow(uint256 amount)";
            break;
        }

        const transaction = await prepareContractCall({
          contract,
          method,
          params: [weiAmount],
        })

        await sendTransaction(transaction)
      }

      updateStats(weiAmount)
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
                          <SelectItem key={chain.name} value={chain.name}>
                            {chain.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-3">
                  <Label>Execution Method</Label>
                  <RadioGroup defaultValue="thirdweb" onValueChange={(value) => setExecutionMethod(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="thirdweb" id="thirdweb" />
                      <Label htmlFor="thirdweb">Browser Wallet</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="circle" id="circle" />
                      <Label htmlFor="circle">Circle Programmable Wallet</Label>
                    </div>
                  </RadioGroup>
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
