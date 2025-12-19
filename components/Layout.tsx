import Header from "@/components/Header";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      {children}
    </div>
  );
}