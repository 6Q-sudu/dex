import { ethers } from 'ethers';
import { poolManagerAbi } from '@/assets/abis/poolManager';
import { positionManagerAbi } from '@/assets//abis/positionManager';
import { swapRouterAbi } from '@/assets/abis/swapRouter';
import { useWallet } from '@/wallet-sdk/provider';
import { erc20 } from "@/assets/abis/erc20";
import { useMemo } from 'react';
type useContractOptions = {
  contractAddress: string;
  contractABI: any;
  provider: any;
}

export default function useContract({ contractAddress, contractABI, provider }: useContractOptions) {
  return useMemo(() => {
    if (!provider) return null;
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    return contract;

  }, [contractAddress, contractABI, provider])
}

export function usePoolContract() {
  const { provider } = useWallet();
  return useContract({ contractAddress: process.env.NEXT_PUBLIC_POOL_MANAGER_ID as string, contractABI: poolManagerAbi, provider });
}

export function usePoolContractWithSigner() {
  const { provider, signer } = useWallet();
  return useContract({ contractAddress: process.env.NEXT_PUBLIC_POOL_MANAGER_ID as string, contractABI: poolManagerAbi, provider: signer });
}

export function usePositionContract() {
  const { provider } = useWallet();
  return useContract({ contractAddress: process.env.NEXT_PUBLIC_POSITION_MANAGER_ID as string, contractABI: positionManagerAbi, provider });
}

export function usePositionContractWithSigner() {
  const { provider, signer } = useWallet();
  return useContract({ contractAddress: process.env.NEXT_PUBLIC_POSITION_MANAGER_ID as string, contractABI: positionManagerAbi, provider: signer });
}

export function useRouterContract() {
  const { provider } = useWallet();
  return useContract({ contractAddress: process.env.NEXT_PUBLIC_SWAP_ROUTER_ID as string, contractABI: swapRouterAbi, provider });
}

export function useRouterContractWithSigner() {
  const { signer } = useWallet();
  return useContract({ contractAddress: process.env.NEXT_PUBLIC_SWAP_ROUTER_ID as string, contractABI: swapRouterAbi, provider: signer });
}

export function useERC20Contract(tokenAddress: string, provider: any) {
  if (!provider) return null;
  const contract = new ethers.Contract(tokenAddress, erc20, provider);
  return contract;
}

export function useERC20ContractWithSigner(tokenAddress: string) {
  const { signer } = useWallet();
  const contract = new ethers.Contract(tokenAddress, erc20, signer);
  return contract;
}