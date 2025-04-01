export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-12">
      {children}
    </div>
  );
} 