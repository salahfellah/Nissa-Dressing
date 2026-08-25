export default function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${className}`}>
      {children}
    </div>
  );
}
