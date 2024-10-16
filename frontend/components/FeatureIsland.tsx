"use client";
import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

const FeatureIsland = ({ position, feature, isActive }) => {
  const ref = useRef()
  const descriptionRef = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime + position[0]) * 0.2
    }
    if (descriptionRef.current) {
      descriptionRef.current.position.y = isActive ? 2 : 0
      descriptionRef.current.scale.setScalar(isActive ? 1 : 0)
    }
  })

  return (
    <group ref={ref} position={position}>
      <Box args={[2, 0.5, 2]}>
        <meshStandardMaterial color={isActive ? "#4ade80" : "#6b7280"} />
      </Box>
      <Text position={[0, 0.5, 0]} fontSize={0.3} color="#fde047" anchorX="center" anchorY="middle">
        {feature.title}
      </Text>
      <group ref={descriptionRef}>
        <Box args={[3, 2, 0.1]}>
          <meshStandardMaterial color="#1f2937" />
        </Box>
        <Html position={[0, 0, 0.06]} transform occlude>
          <div className="bg-gray-800 p-2 rounded-lg shadow-lg text-yellow-200" style={{ width: '250px' }}>
            <h3 className="text-lg font-bold mb-2 text-yellow-300">{feature.title}</h3>
            <p className="text-sm">{feature.description}</p>
          </div>
        </Html>
      </group>
    </group>
  )
}

export default FeatureIsland
