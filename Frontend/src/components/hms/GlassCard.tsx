import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string;
  glowIntensity?: 'none' | 'low' | 'medium' | 'high';
  hoverable?: boolean;
}

export default function GlassCard({
  children,
  glowColor = 'rgba(138, 75, 241, 0.15)',
  glowIntensity = 'low',
  hoverable = true,
  className = '',
  style,
  ...props
}: GlassCardProps) {
  
  const intensityMap = {
    none: '0px 0px 0px 0px transparent',
    low: `0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 20px 0 ${glowColor}`,
    medium: `0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 35px 2px ${glowColor}`,
    high: `0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 50px 5px ${glowColor}`,
  };

  const shadowGlow = intensityMap[glowIntensity];

  const cardStyle: React.CSSProperties = {
    boxShadow: shadowGlow,
    ...style
  };

  return (
    <div
      className={`glass-card p-6 ${hoverable ? 'hover:scale-[1.01]' : 'pointer-events-none'} ${className}`}
      style={cardStyle}
      {...props}
    >
      {children}
    </div>
  );
}
