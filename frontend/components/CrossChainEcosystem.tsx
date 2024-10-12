"use client";
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

const CrossChainEcosystem = ({ setCurrentFeature }) => {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central USDC hub */}
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="gold" metalness={0.7} roughness={0.3} />
      </Sphere>
      <Text position={[0, 1.5, 0]} fontSize={0.5} color="white">
        USDC
      </Text>

      {/* Blockchain networks */}
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const angle = (index / 6) * Math.PI * 2
        const x = Math.cos(angle) * 5
        const z = Math.sin(angle) * 5
        return (
          <React.Fragment key={index}>
            <Sphere args={[0.5, 32, 32]} position={[x, 0, z]}>
              <meshStandardMaterial color="blue" />
            </Sphere>
            <Line
              points={[[0, 0, 0], [x, 0, z]]}
              color="white"
              lineWidth={1}
            />
            <Html position={[x, 1, z]}>
              <div className="text-white text-center">
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
            <meshStandardMaterial color="gold" />
          </Sphere>
        ))}
      </group>
    </group>
  )
}

export default CrossChainEcosystem