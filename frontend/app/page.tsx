"use client";

import Features from "@/components/Features"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Globe, Lock, Repeat, Wallet } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <main className="container mx-auto px-4 py-16">
        <motion.section className="mb-16 text-center" initial="initial" animate="animate" variants={fadeIn}>
          <motion.h1 className="mb-4 text-5xl font-bold text-gray-900" variants={fadeIn}>
            Empowering Enterprises with Blockchain Innovation
          </motion.h1>
          <motion.p className="mb-8 text-xl text-gray-600" variants={fadeIn}>
            Access stable digital dollars globally through our decentralized, cross-chain lending platform.
          </motion.p>
          <motion.div variants={fadeIn} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/dashboard">
              <Button size="lg" className="font-semibold">
                Start Borrowing <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </motion.section>

        <motion.section className="mb-16" initial="initial" animate="animate" variants={staggerChildren}>
          <motion.h2 className="mb-8 text-center text-3xl font-bold text-gray-900" variants={fadeIn}>
            Key Features
          </motion.h2>
          <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4" variants={staggerChildren}>
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
          </motion.div>
        </motion.section>

        <motion.section className="mb-16 text-center" initial="initial" animate="animate" variants={fadeIn}>
          <motion.h2 className="mb-4 text-3xl font-bold text-gray-900" variants={fadeIn}>
            Powered by Circle&apos;s Technology Stack
          </motion.h2>
          <motion.p className="mb-8 text-xl text-gray-600" variants={fadeIn}>
            Leveraging USDC, Wormhole, Programmable Wallets, CCTP, and NTT for a robust and secure platform.
          </motion.p>
          <motion.div className="flex justify-center space-x-4" variants={staggerChildren}>
            <motion.img src="/usdc.png?height=50&width=50" alt="USDC Logo" className="h-12 w-12" variants={fadeIn} whileHover={{ scale: 1.1 }} />
            <motion.img src="/wormhole.png?height=50&width=50" alt="Wormhole Logo" className="h-12 w-12" variants={fadeIn} whileHover={{ scale: 1.1 }} />
            <motion.img src="/circle.png?height=50&width=50" alt="Circle Logo" className="h-12 w-12" variants={fadeIn} whileHover={{ scale: 1.1 }} />
          </motion.div>
        </motion.section>

        <Features />

        <motion.section className="text-center" initial="initial" animate="animate" variants={fadeIn}>
          <motion.h2 className="mb-4 text-3xl font-bold text-gray-900" variants={fadeIn}>
            Ready to Get Started?
          </motion.h2>
          <motion.p className="mb-8 text-xl text-gray-600" variants={fadeIn}>
            Join the future of decentralized finance with CrossChain USDCLoans.
          </motion.p>
          <motion.div variants={fadeIn} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/circle">
              <Button size="lg" className="font-semibold">
                Create Account <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </motion.section>
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
    <motion.div variants={fadeIn}>
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
    </motion.div>
  )
}
