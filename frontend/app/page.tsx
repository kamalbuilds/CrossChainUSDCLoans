"use client";

import React, { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, PerspectiveCamera, Html } from '@react-three/drei'
import dynamic from 'next/dynamic'

const CrossChainEcosystem = dynamic(() => import('@/components/CrossChainEcosystem'), { ssr: false })
const FeatureIsland = dynamic(() => import('@/components/FeatureIsland'), { ssr: false })

const features = [
  { title: "Cross-Chain Interoperability", description: "Seamless transactions across multiple blockchain networks" },
  { title: "USDC Loans and Borrowing", description: "Decentralized lending system for global financial access" },
  { title: "Programmable Wallets", description: "Secure asset management with full user custody" },
  { title: "Secure Smart Contracts", description: "Transparent and audited financial transactions" },
  { title: "CCTP Integration", description: "Smooth USDC movement across blockchain ecosystems" },
  { title: "Global Accessibility", description: "Financial inclusion without traditional banking" },
]

export default function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(null)

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="w-full h-screen">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 10, 20]} fov={60} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Suspense fallback={null}>
              <CrossChainEcosystem setCurrentFeature={setCurrentFeature} />
              {features.map((feature, index) => (
                <FeatureIsland 
                  key={index}
                  position={[Math.cos(index * Math.PI / 3) * 10, 0, Math.sin(index * Math.PI / 3) * 10]}
                  feature={feature}
                  isActive={currentFeature === index}
                />
              ))}
            </Suspense>
            <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 6} />
            
            <Html fullscreen>
              <div className="absolute top-0 left-0 p-4 text-white">
                <h1 className="text-4xl font-bold mb-2">CrossChain USDCLoans</h1>
                <p className="text-xl">Empowering global access to digital dollars</p>
              </div>
              {currentFeature !== null && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
                  <h2 className="text-2xl font-bold mb-2">{features[currentFeature].title}</h2>
                  <p>{features[currentFeature].description}</p>
                </div>
              )}
            </Html>
          </Canvas>
        </div>
      </main>
    </div>
  )
}
