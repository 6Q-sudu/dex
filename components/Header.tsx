"use client";
import Link from "next/link";
import ConnectButton from '@/wallet-sdk/components/ConnectionButton';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn'
export default function Header() {
  const pathname = usePathname();
  return <div className="h-[50px] flex justify-between items-center px-8 border-b">
    <Link
      className="hover:cursor-pointer font-bold"
      href={"/"}>
      MetaNodeSwap
    </Link>
    <div className="flex gap-4">
      <Link
        className={cn("hover:cursor-pointer hover:font-bold", {
          "font-bold": pathname === "/",
        })}
        href={"/"}>
        Swap
      </Link>
      <Link
        className={cn("hover:cursor-pointer hover:font-bold", {
          "font-bold": pathname === "/pool",
        })}
        href={"/pool"}>
        Pool
      </Link>
    </div>
    <div>
      <ConnectButton />
    </div>
  </div>
}