"use client";
import { useEffect, useMemo, useState } from "react";
import { useWallet, ChainsConfig } from "../provider/index";
import { ethers } from "ethers";

interface ConnectionButtonProps {
  label?: string;
  showBalance?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onChainChange?: (chainId: number) => void;
  onBalanceChange?: (balance: string) => void;
}

const ConnectionButton = ({
  label = "Connect Wallet",
  showBalance = false,
  size = 'md',
  className = '',
  onConnect,
}: ConnectionButtonProps) => {
  const { connect, disconnect, isConnected, address, chainID, ensName, error, openModal, closeModal, provider, openChainModal } = useWallet();
  // console.log("address11111:", address, chainID, ensName, provider);

  const [balance, setBalance] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const getBalance = async () => {
    let _balance = undefined;
    let network: any;
    let _symbol = undefined;
    if (provider) {
      _balance = await provider.getBalance(address);
      // console.log("balance:", _balance);
      setBalance(ethers.formatEther(_balance));
      // console.log("balance2:", balance);
      network = await provider.getNetwork();
      setName(network.name);
      // console.log("network:", network);
      _symbol = ChainsConfig.find((chain) => BigInt(chain.id) === BigInt(network.chainId))?.currency.symbol || '***';
      setSymbol(_symbol);
    } else {
      const unisat = (window as any).unisat;
      _balance = await unisat.getBalance();
      // console.log("balance222222:", _balance);

      setBalance(ethers.formatUnits(_balance.total, 8));
      const chain = ChainsConfig.find(chain => chainID === chain.id);
      // console.log("chain222222", chain);

      setName(chain?.name || "");
      setSymbol(chain?.currency?.symbol || "");
    }
  }
  useMemo(() => {
    if (address) {
      getBalance();
    }
  }, [address, provider, chainID])
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };
  const handleConnect = async () => {
    try {
      await connect('metamask');

    } catch (error) {
      console.error('Failed to connect wallet:', error);

    }
  }
  const handleDisConnect = async () => {
    try {
      await disconnect();
      localStorage.removeItem('connectedWallet');
      localStorage.removeItem('connectedAddress');
      localStorage.removeItem('connectedChainId');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);

    }
  }
  useEffect(() => {
    const walletId = localStorage.getItem('connectedWallet');
    if (walletId) {
      connect(walletId);
    }
  }, []);
  if (!isConnected) {
    return (<>
      <button
        className={`bg-blue-500 text-white font-bold py-2 px-4 rounded ${sizeClasses[size]} ${className}`}
        onClick={openModal}
      >
        {label}
      </button>
    </>)
  }
  return (<div className="flex items-center space-x-4">
    <button
      className={`flex items-center bg-white border text-black font-bold py-2 px-4 rounded ${sizeClasses[size]} ${className}`}
      onClick={openChainModal}
    >
      <span className="mr-2 flex items-center">
        <svg className="mr-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM3 5C3.01671 5 3.03323 4.99918 3.04952 4.99758C3.28022 6.1399 4.28967 7 5.5 7C6.71033 7 7.71978 6.1399 7.95048 4.99758C7.96677 4.99918 7.98329 5 8 5H13.5C13.7761 5 14 4.77614 14 4.5C14 4.22386 13.7761 4 13.5 4H8C7.98329 4 7.96677 4.00082 7.95048 4.00242C7.71978 2.86009 6.71033 2 5.5 2C4.28967 2 3.28022 2.86009 3.04952 4.00242C3.03323 4.00082 3.01671 4 3 4H1.5C1.22386 4 1 4.22386 1 4.5C1 4.77614 1.22386 5 1.5 5H3ZM11.9505 10.9976C11.7198 12.1399 10.7103 13 9.5 13C8.28967 13 7.28022 12.1399 7.04952 10.9976C7.03323 10.9992 7.01671 11 7 11H1.5C1.22386 11 1 10.7761 1 10.5C1 10.2239 1.22386 10 1.5 10H7C7.01671 10 7.03323 10.0008 7.04952 10.0024C7.28022 8.8601 8.28967 8 9.5 8C10.7103 8 11.7198 8.8601 11.9505 10.0024C11.9668 10.0008 11.9833 10 12 10H13.5C13.7761 10 14 10.2239 14 10.5C14 10.7761 13.7761 11 13.5 11H12C11.9833 11 11.9668 10.9992 11.9505 10.9976ZM8 10.5C8 9.67157 8.67157 9 9.5 9C10.3284 9 11 9.67157 11 10.5C11 11.3284 10.3284 12 9.5 12C8.67157 12 8 11.3284 8 10.5Z" fill="currentColor"></path></svg>
        {name}
      </span>
    </button>
    <button
      className={`flex items-center bg-white border text-black font-bold py-2 px-4 rounded ${sizeClasses[size]} ${className}`}
    >
      <span className="mr-1">{(+(balance || 0))?.toFixed(4)}</span>
      <span className="mr-4">{symbol}</span>
      {address?.substring(0, 6) + '...' + address?.substring(address.length - 4)}
      <svg onClick={handleDisConnect} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 1C2.44771 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H10.5C10.7761 14 11 13.7761 11 13.5C11 13.2239 10.7761 13 10.5 13H3V2L10.5 2C10.7761 2 11 1.77614 11 1.5C11 1.22386 10.7761 1 10.5 1H3ZM12.6036 4.89645C12.4083 4.70118 12.0917 4.70118 11.8964 4.89645C11.7012 5.09171 11.7012 5.40829 11.8964 5.60355L13.2929 7H6.5C6.22386 7 6 7.22386 6 7.5C6 7.77614 6.22386 8 6.5 8H13.2929L11.8964 9.39645C11.7012 9.59171 11.7012 9.90829 11.8964 10.1036C12.0917 10.2988 12.4083 10.2988 12.6036 10.1036L14.8536 7.85355C15.0488 7.65829 15.0488 7.34171 14.8536 7.14645L12.6036 4.89645Z" fill="currentColor"></path></svg>
    </button>
  </div>);
};

export default ConnectionButton;