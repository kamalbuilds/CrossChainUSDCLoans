"use client";
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Text } from '@react-three/drei'

const FeatureIsland = ({ position, feature, isActive }) => {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime + position[0]) * 0.2
    }
  })

  return (
    <group ref={ref} position={position}>
      <Box args={[2, 0.5, 2]}>
        <meshStandardMaterial color={isActive ? "green" : "gray"} />
      </Box>
      <Text position={[0, 0.5, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {feature.title}
      </Text>
    </group>
  )
}

export default FeatureIsland