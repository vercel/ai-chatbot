'use client';

import { useEffect, useRef, useCallback } from 'react';

interface LostMindLogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
  animated?: boolean;
  theme?: 'dark' | 'light' | 'gradient';
  onClick?: () => void;
}

export function LostMindLogo({
  width = 50,
  height = 50,
  showText = true,
  animated = true,
  theme = 'dark',
  onClick
}: LostMindLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Theme color mapping
  const getThemeColors = useCallback(() => {
    switch (theme) {
      case 'light':
        return { primary: '#6D28D9', secondary: '#8B5CF6' };
      case 'gradient':
        return { primary: '#4F46E5', secondary: '#8B5CF6' };
      default:
        return { primary: '#4F46E5', secondary: '#4F46E5' };
    }
  }, [theme]);

  // Text styling based on theme
  const getTextStyles = () => {
    const styles: React.CSSProperties = {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: 'clamp(14px, 2vw, 24px)',
    };

    if (theme === 'gradient') {
      return {
        ...styles,
        background: 'linear-gradient(45deg, #4F46E5, #8B5CF6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      };
    } else if (theme === 'light') {
      return {
        ...styles,
        color: '#6D28D9',
      };
    } else {
      return {
        ...styles,
        color: '#4F46E5',
      };
    }
  };
  
  useEffect(() => {
    if (!canvasRef.current || !animated) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getThemeColors();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Node structure
    interface Node {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
    }
    
    interface Connection {
      from: number;
      to: number;
      active: boolean;
      life: number;
      maxLife: number;
    }
    
    const nodes: Node[] = [];
    const numNodes = 15; // Fewer nodes for smaller logo
    const connections: Connection[] = [];
    
    // Create nodes
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        radius: 1 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }
    
    // Create connections between nodes
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        if (Math.random() > 0.8) {
          connections.push({
            from: i,
            to: j,
            active: false,
            life: 0,
            maxLife: 40 + Math.random() * 80
          });
        }
      }
    }
    
    let animationFrameId: number;

    function animate() {
      if (!ctx) return; // Add null check for ctx
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Update nodes
      for (let i = 0; i < numNodes; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off edges
        if (node.x <= node.radius || node.x >= canvasWidth - node.radius) {
          node.vx *= -1;
        }
        if (node.y <= node.radius || node.y >= canvasHeight - node.radius) {
          node.vy *= -1;
        }
        
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.fill();
      }
      
      // Draw connections
      for (let i = 0; i < connections.length; i++) {
        const connection = connections[i];
        const fromNode = nodes[connection.from];
        const toNode = nodes[connection.to];
        
        // Randomly activate connections
        if (Math.random() > 0.995 && !connection.active) {
          connection.active = true;
          connection.life = connection.maxLife;
        }
        
        // Draw active connections
        if (connection.active) {
          const progress = connection.life / connection.maxLife;
          const pulse = 1 - Math.abs(progress - 0.5) * 2;
          
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);

          // For gradient theme, use secondary color
          const strokeColor = theme === 'gradient' 
            ? `rgba(${hexToRgb(colors.secondary)}, ${0.2 + pulse * 0.8})`
            : `rgba(${hexToRgb(colors.primary)}, ${0.2 + pulse * 0.8})`;
            
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 0.5 + pulse * 0.5;
          ctx.stroke();
          
          connection.life--;
          if (connection.life <= 0) {
            connection.active = false;
          }
        } else {
          // Draw inactive connections (very faint)
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, 0.1)`;
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }
    
    // Helper to convert hex to rgb
    function hexToRgb(hex: string): string {
      // Remove # if present
      const processedHex = hex.replace('#', '');
      
      // Parse the hex values
      const r = Number.parseInt(processedHex.substring(0, 2), 16);
      const g = Number.parseInt(processedHex.substring(2, 4), 16);
      const b = Number.parseInt(processedHex.substring(4, 6), 16);
      
      return `${r}, ${g}, ${b}`;
    }
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [animated, theme, getThemeColors]);
  
  // If not animated, render static logo
  useEffect(() => {
    if (!canvasRef.current || animated) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getThemeColors();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw static nodes in a pattern
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.4;
    
    // Draw nodes in a network pattern
    const numNodes = 10;
    
    interface StaticNode {
      x: number;
      y: number;
      radius: number;
    }
    
    const nodes: StaticNode[] = [];
    
    // Create nodes in a pattern
    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * Math.PI * 2;
      const distance = radius * (0.5 + 0.5 * Math.sin(i * 3));
      
      nodes.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        radius: 1.5 + Math.random() * 1.5
      });
    }
    
    // Add central node
    nodes.push({
      x: centerX,
      y: centerY,
      radius: 3
    });
    
    // Draw connections
    for (let i = 0; i < numNodes; i++) {
      const fromNode = nodes[i];
      const toNode = nodes[(i + 1) % numNodes];
      const centerNode = nodes[numNodes];
      
      // Connection to next node
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      
      if (theme === 'gradient') {
        const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, 0.5)`;
      }
      
      ctx.lineWidth = 0.5;
      ctx.stroke();
      
      // Connection to center
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(centerNode.x, centerNode.y);
      
      if (theme === 'gradient') {
        const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, centerNode.x, centerNode.y);
        gradient.addColorStop(0, colors.secondary);
        gradient.addColorStop(1, colors.primary);
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, 0.5)`;
      }
      
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    // Draw nodes
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      if (theme === 'gradient' && node === nodes[numNodes]) {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = colors.primary;
      }
      
      ctx.fill();
    }

    // Helper to convert hex to rgb
    function hexToRgb(hex: string): string {
      // Remove # if present
      const processedHex = hex.replace('#', '');
      
      // Parse the hex values
      const r = Number.parseInt(processedHex.substring(0, 2), 16);
      const g = Number.parseInt(processedHex.substring(2, 4), 16);
      const b = Number.parseInt(processedHex.substring(4, 6), 16);
      
      return `${r}, ${g}, ${b}`;
    }
  }, [animated, theme, getThemeColors]);
  
  return (
    <div
      className="flex items-center gap-2 transition-all hover:opacity-90 cursor-pointer"
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && onClick) {
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height} 
        className="cursor-pointer transition-transform duration-300 hover:scale-105"
      />
      {showText && (
        <span style={getTextStyles()} className="transition-all">
          LostMind AI
        </span>
      )}
    </div>
  );
}