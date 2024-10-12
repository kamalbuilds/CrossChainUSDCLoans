import Features from "@/components/Features"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Globe, Lock, Repeat, Wallet } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">

      <main className="container mx-auto px-4 py-16">
        <section className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold text-gray-900">Empowering Enterprises with Blockchain Innovation</h1>
          <p className="mb-8 text-xl text-gray-600">
            Access stable digital dollars globally through our decentralized, cross-chain lending platform.
          </p>
          <Button size="lg" className="font-semibold">
            Start Borrowing <ArrowRight className="ml-2" />
          </Button>
        </section>

        <section className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Key Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Repeat className="h-8 w-8 text-blue-500" />}
              title="Cross-Chain Interoperability"
              description="Seamlessly access USDC across multiple blockchain networks without friction."
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8 text-blue-500" />}
              title="Global Accessibility"
              description="Hold and transact in USDC without needing a traditional bank account."
            />
            <FeatureCard
              icon={<Wallet className="h-8 w-8 text-blue-500" />}
              title="Programmable Wallets"
              description="Securely manage digital assets across multiple applications."
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8 text-blue-500" />}
              title="Secure Smart Contracts"
              description="Fully-audited smart contracts ensure transparent and secure transactions."
            />
          </div>
        </section>

        <section className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Powered by Circle's Technology Stack</h2>
          <p className="mb-8 text-xl text-gray-600">
            Leveraging USDC, Wormhole, Programmable Wallets, CCTP, and NTT for a robust and secure platform.
          </p>
          <div className="flex justify-center space-x-4">
            <img src="/placeholder.svg?height=50&width=50" alt="USDC Logo" className="h-12 w-12" />
            <img src="/placeholder.svg?height=50&width=50" alt="Wormhole Logo" className="h-12 w-12" />
            <img src="/placeholder.svg?height=50&width=50" alt="Circle Logo" className="h-12 w-12" />
          </div>
        </section>

        <Features />

        <section className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-gray-600">
            Join the future of decentralized finance with CrossChain USDCLoans.
          </p>
          <Button size="lg" className="font-semibold">
            Create Account <ArrowRight className="ml-2" />
          </Button>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          © 2024 CrossChain USDCLoans. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}