"use client"
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'

const CrossChainModel = () => {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central hub */}
      <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="blue" />
      </Sphere>

      {/* Satellite chains */}
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2
        const x = Math.cos(angle) * 2
        const z = Math.sin(angle) * 2
        return (
          <React.Fragment key={index}>
            <Sphere args={[0.3, 32, 32]} position={[x, 0, z]}>
              <meshStandardMaterial color="green" />
            </Sphere>
            <Line
              points={[[0, 0, 0], [x, 0, z]]}
              color="white"
              lineWidth={1}
            />
          </React.Fragment>
        )
      })}
    </group>
  )
}

export default CrossChainModel