import React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import ActionModal from "./ActionModal"
import { Button } from "./ui/button"

const UserOptions = ({ chains, updateStats } : any) => {
  const options = [
    {
      title: "Deposit",
    },
    {
      title: "Withdraw",
    },
    {
      title: "Borrow",
    },
    {
      title: "Repay",
    },
  ]
  return (
    <div className="flex flex-row gap-4">

      {options.map((option) => (
        <ActionModal
          action={option.title}
          chains={chains}
          updateStats={updateStats}
        />
      ))}
    </div>
  )
}

export default UserOptions
