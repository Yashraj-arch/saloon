import React from 'react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'purple' | 'subtle';
  onClick?: () => void;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick
}) => {
  const variantClass = variant === 'purple'
    ? 'bento-card-purple'
    : 'bento-card';

  return (
    <div
      onClick={onClick}
      className={`p-6 relative overflow-hidden flex flex-col justify-between ${variantClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Subtle ambient light gradient at top corner */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      {children}
    </div>
  );
};
