
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VoiceVisualizationProps {
  isListening: boolean;
  isSpeaking: boolean;
  className?: string;
}

const VoiceVisualization: React.FC<VoiceVisualizationProps> = ({ 
  isListening, 
  isSpeaking,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get the device pixel ratio to make canvas clear on high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set the canvas size accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Size of the orb
    const baseRadius = Math.min(width, height) * 0.35;
    
    // For animation
    let time = 0;
    const speed = isSpeaking ? 0.006 : isListening ? 0.004 : 0.002;
    
    const drawOrb = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Update time for animation
      time += speed;
      
      // Create a pulsing effect based on listening/speaking state
      const pulseSpeedMultiplier = isSpeaking ? 3 : isListening ? 2 : 1;
      const pulseSize = Math.sin(time * 5) * 5 * pulseSpeedMultiplier;
      const radius = baseRadius + (isListening || isSpeaking ? pulseSize : 0);
      
      // Create gradient based on state
      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.4, 
        centerX, centerY, radius * 1.2
      );
      
      if (isSpeaking) {
        // Bright blue/purple when speaking - high contrast for visibility
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.9)');
        gradient.addColorStop(0.5, 'rgba(106, 90, 205, 0.7)');
        gradient.addColorStop(1, 'rgba(65, 105, 225, 0.3)');
      } else if (isListening) {
        // Vibrant purple/blue when listening - clearly distinct
        gradient.addColorStop(0, 'rgba(106, 90, 205, 0.8)');
        gradient.addColorStop(0.5, 'rgba(72, 61, 139, 0.6)');
        gradient.addColorStop(1, 'rgba(25, 25, 112, 0.3)');
      } else {
        // Subtle but visible purple/blue when idle
        gradient.addColorStop(0, 'rgba(72, 61, 139, 0.6)');
        gradient.addColorStop(0.5, 'rgba(25, 25, 112, 0.4)');
        gradient.addColorStop(1, 'rgba(25, 25, 112, 0.2)');
      }
      
      // Draw main orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add dynamic "swirls" inside the orb - more active when speaking/listening
      const swirlCount = isSpeaking ? 5 : isListening ? 4 : 3;
      
      for (let i = 0; i < swirlCount; i++) {
        const swirl = (time + i) % (Math.PI * 2);
        const swirl2 = (time * 0.7 + i) % (Math.PI * 2);
        
        const x1 = centerX + Math.cos(swirl) * radius * 0.5;
        const y1 = centerY + Math.sin(swirl) * radius * 0.5;
        
        const x2 = centerX + Math.cos(swirl2) * radius * 0.3;
        const y2 = centerY + Math.sin(swirl2) * radius * 0.3;
        
        const smallGradient = ctx.createRadialGradient(
          x1, y1, radius * 0.05,
          x1, y1, radius * 0.2
        );
        
        smallGradient.addColorStop(0, 'rgba(147, 112, 219, 0.8)');
        smallGradient.addColorStop(1, 'rgba(147, 112, 219, 0)');
        
        ctx.beginPath();
        ctx.arc(x1, y1, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = smallGradient;
        ctx.fill();
        
        const smallGradient2 = ctx.createRadialGradient(
          x2, y2, radius * 0.03,
          x2, y2, radius * 0.15
        );
        
        smallGradient2.addColorStop(0, 'rgba(72, 209, 204, 0.8)');
        smallGradient2.addColorStop(1, 'rgba(72, 209, 204, 0)');
        
        ctx.beginPath();
        ctx.arc(x2, y2, radius * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = smallGradient2;
        ctx.fill();
      }
      
      // Add sound wave effects when speaking
      if (isSpeaking) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const waveAmplitude = Math.sin(time * 10 + i) * 10 + 5;
          
          const startX = centerX + Math.cos(angle) * (radius + 5);
          const startY = centerY + Math.sin(angle) * (radius + 5);
          
          const endX = centerX + Math.cos(angle) * (radius + waveAmplitude + 15);
          const endY = centerY + Math.sin(angle) * (radius + waveAmplitude + 15);
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = 'rgba(147, 112, 219, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      
      // Add a glow effect - enhanced for visibility
      const glowSize = radius * 1.5;
      const glowColor = isSpeaking ? 'rgba(138, 43, 226, 0.4)' : 'rgba(106, 90, 205, 0.3)';
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, radius,
        centerX, centerY, glowSize
      );
      
      glowGradient.addColorStop(0, glowColor);
      glowGradient.addColorStop(1, 'rgba(106, 90, 205, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      // Add slight outline for better visibility for visually impaired users
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(drawOrb);
    };
    
    // Start animation
    drawOrb();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isListening, isSpeaking]);
  
  return (
    <div 
      className={cn(
        "flex items-center justify-center w-full max-w-md mx-auto", 
        className
      )}
      role="img"
      aria-label={isSpeaking ? "Assistant is speaking" : isListening ? "Assistant is listening" : "Assistant is idle"}
    >
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className={cn(
          "max-w-full h-auto",
          isListening && !isSpeaking ? "animate-pulse" : ""
        )}
      />
    </div>
  );
};

export default VoiceVisualization;
