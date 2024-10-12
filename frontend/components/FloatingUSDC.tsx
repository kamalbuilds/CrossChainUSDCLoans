"use client"
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

const FloatingUSDC = () => {
  const textRef = useRef()

  useFrame(({ clock }) => {
    if (textRef.current) {
      textRef.current.position.y = Math.sin(clock.getElapsedTime()) * 0.2 + 2
    }
  })

  return (
    <Text
      ref={textRef}
      position={[0, 2, 0]}
      fontSize={0.5}
      color="gold"
      anchorX="center"
      anchorY="middle"
    >
      USDC
    </Text>
  )
}

export default FloatingUSDC