"use client";
import React, { useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Sphere, Line, Html } from '@react-three/drei'
import * as THREE from 'three'

const CrossChainEcosystem = ({ setCurrentFeature }) => {
  const groupRef = useRef()
  const texture = useLoader(THREE.TextureLoader, '/usdc.png')

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central USDC hub */}
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial map={texture} />
      </Sphere>

      {/* Blockchain networks */}
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const angle = (index / 6) * Math.PI * 2
        const x = Math.cos(angle) * 5
        const z = Math.sin(angle) * 5
        return (
          <React.Fragment key={index}>
            <Sphere args={[0.5, 32, 32]} position={[x, 0, z]}>
              <meshStandardMaterial color="#3b82f6" />
            </Sphere>
            <Line
              points={[[0, 0, 0], [x, 0, z]]}
              color="#fde047"
              lineWidth={1}
            />
            <Html position={[x, 1, z]}>
              <div className="text-yellow-300 text-center font-bold">
                Chain {index + 1}
              </div>
            </Html>
          </React.Fragment>
        )
      })}

      {/* Orbiting USDC tokens */}
      <group>
        {[0, 1, 2].map((index) => (
          <Sphere key={index} args={[0.2, 16, 16]} position={[Math.cos(index * Math.PI * 2 / 3) * 3, Math.sin(index * Math.PI * 2 / 3) * 3, 0]}>
            <meshStandardMaterial map={texture} />
          </Sphere>
        ))}
      </group>
    </group>
  )
}

export default CrossChainEcosystem
