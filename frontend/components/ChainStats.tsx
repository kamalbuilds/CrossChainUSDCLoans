import { useActiveAccount, useReadContract } from "thirdweb/react";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from "next/image";
export default function ChainStats({ chains }) {

  return (
    <div>
      <h3 className="mb-3">Chain Stats</h3>
      <div className="flex flex-col gap-4">
        {chains.map((chain, index) => (
          <Card key={index} className={`border-[${chain.color}]`}>
            <CardHeader>
              <CardTitle className="flex flex-row gap-2">
                <Image src={chain.logo} alt={chain.name} className="mr-2 rounded-xl" width={24} height={24} />
                {chain.name}
              </CardTitle>
              <CardDescription>USDC Balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <div className="underline" style={{ backgroundColor: chain.color }}></div>
                <p><strong>Balance:</strong> {chain.balance}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
