import React from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <h3 className="font-playfair text-xl text-brunProfond mb-2">{title}</h3>
      {description && <p className="text-sm text-taupe max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
