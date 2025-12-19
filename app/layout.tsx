import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from '@/components/Layout';
import { WalletProvider, ChainsConfig } from "@/wallet-sdk";
import { ethers } from "ethers";
import type { Wallet } from '@/wallet-sdk/types'
import { metaMaskWallet } from '@/wallet-sdk/connectors/metamask'
import { ToastContainer } from 'react-toastify'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chains = ChainsConfig;
const window = globalThis.window as Window;
let provider: unknown = null;
if (window?.ethereum) {
  provider = new ethers.BrowserProvider(window.ethereum);
}

const wallets: Wallet[] = [metaMaskWallet];
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cover bg-linear-to-b from-blue-100 to-blue-50 bg-no-repeat flex`}
      >
        <WalletProvider
          chains={chains}
          wallets={wallets}
          provider={provider}
          autoConnect={true}>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="custom-toast"
            progressClassName="custom-toast-progress"
          >
          </ToastContainer>
          <Layout>{children}</Layout>
        </WalletProvider>
      </body>
    </html>
  );
}
