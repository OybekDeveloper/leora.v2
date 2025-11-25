import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Particle } from '@/types/voice-ai.types';
interface ParticlesProps {
  stage: 'listening' | 'thinking';
}

export const Particles: React.FC<ParticlesProps> = ({ stage }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        const newParticles = [...prev];
        if (newParticles.length < 40) {
          for (let i = 0; i < 4; i++) {
            newParticles.push({
              id: Math.random(),
              x: Math.random() * 100,
              y: Math.random() * 100,
              size: Math.random() * 3 + 1,
              opacity: Math.random() * 0.6 + 0.2,
              speed: Math.random() * 1.5 + 0.5
            });
          }
        }
        return newParticles
          .map(p => ({
            ...p,
            y: p.y - p.speed,
            opacity: p.opacity - 0.015
          }))
          .filter(p => p.opacity > 0 && p.y > -10);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [stage]);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 160 }]}>
      {particles.map(particle => (
        <View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity,
              width: particle.size,
              height: particle.size,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});
