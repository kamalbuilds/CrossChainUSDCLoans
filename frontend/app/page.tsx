"use client";

import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import dynamic from 'next/dynamic'

const CrossChainEcosystem = dynamic(() => import('@/components/CrossChainEcosystem'), { ssr: false })
const FeatureIsland = dynamic(() => import('@/components/FeatureIsland'), { ssr: false })
const Torch = dynamic(() => import('@/components/Torch'), { ssr: false })

const features = [
  { title: "Cross-Chain Interoperability", description: "Seamless transactions across multiple blockchain networks" },
  { title: "USDC Loans and Borrowing", description: "Decentralized lending system for global financial access" },
  { title: "Programmable Wallets", description: "Secure asset management with full user custody" },
  { title: "Secure Smart Contracts", description: "Transparent and audited financial transactions" },
  { title: "CCTP Integration", description: "Smooth USDC movement across blockchain ecosystems" },
  { title: "Global Accessibility", description: "Financial inclusion without traditional banking" },
]

export default function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 5000) // Change feature every 5 seconds

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <main className="flex-grow">
        <div className="w-full h-screen">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 10, 20]} fov={60} />
            <ambientLight intensity={0.2} />
            <Suspense fallback={null}>
              <CrossChainEcosystem />
              {features.map((feature, index) => (
                <FeatureIsland 
                  key={index}
                  position={[Math.cos(index * Math.PI / 3) * 10, 0, Math.sin(index * Math.PI / 3) * 10]}
                  feature={feature}
                  isActive={currentFeature === index}
                />
              ))}
              <Torch position={[0, 10, 5]} />
            </Suspense>
            <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 6} />
            
            <Html fullscreen>
              <div className="absolute top-0 left-0 p-4 text-yellow-300 bg-black bg-opacity-50 rounded-lg m-4">
                <h1 className="text-4xl font-bold mb-2 text-yellow-400">CrossChain USDCLoans</h1>
                <p className="text-xl text-yellow-200">Empowering global access to digital dollars</p>
              </div>
            </Html>
          </Canvas>
        </div>
      </main>
    </div>
  )
}
