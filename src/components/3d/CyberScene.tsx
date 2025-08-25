import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import { CyberBackground, NetworkNodes, SecurityShield } from './CyberBackground';

interface CyberSceneProps {
  className?: string;
}

export const CyberScene = ({ className }: CyberSceneProps) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 60,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#ff6b35" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#00d4ff" />
          
          <Stars 
            radius={300} 
            depth={60} 
            count={5000} 
            factor={7} 
            saturation={0} 
            speed={0.5}
          />
          
          <CyberBackground count={3000} />
          <NetworkNodes />
          <SecurityShield />
          
          <Environment preset="night" />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};