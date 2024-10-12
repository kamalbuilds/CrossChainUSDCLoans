"use client";
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Torch = ({ position = [0, 5, 5] }) => {
  const lightRef = useRef<THREE.PointLight>()

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 2
      lightRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.5) * 2
    }
  })

  return (
    <pointLight
      ref={lightRef}
      position={position}
      intensity={2}
      distance={15}
      color="#ffaa00"
    />
  )
}

export default Torch
