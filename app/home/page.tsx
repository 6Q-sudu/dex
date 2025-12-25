"use client";
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { usePoolContract, useERC20Contract, useRouterContractWithSigner } from '@/hooks/useContract';
import { useWallet } from '@/wallet-sdk/provider'
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { erc20 } from "@/assets/abis/erc20";
export default function Home() {
  const poolContract = usePoolContract();
  const contractWithSigner = useRouterContractWithSigner();
  const { provider, address, signer } = useWallet();
  const [tokenAmounts, setTokenAmounts] = React.useState<{
    inputToken: number | string;
    outputToken: number | string;
  }>({
    inputToken: 0,
    outputToken: 0,
  })
  const [pools, setPools] = React.useState<({
    poolAddress: string;
    symbol0: string;
    symbol1: string;
    token0: string;
    token1: string;
    index: number;
    formattedToken0Balance: string;
    formattedToken1Balance: string;
    sqrtPriceX96: any;
    liquidity: any;
  })[]>([]);
  const [pairValue, setPairValue] = React.useState("")
  const [formValue, setFormValue] = React.useState({
    formattedBalance0: "",
    formattedBalance1: "",
    tickLower: "",
    tickUpper: "",
    currentPrice: "",
    feeTier: "",
  })
  const [balances, setBalances] = React.useState<{
    formattedBalance0: string;
    formattedBalance1: string;
  }>({
    formattedBalance0: "",
    formattedBalance1: "",
  })
  const onPairChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPairValue(value)
    setTokenAmounts({
      inputToken: 0,
      outputToken: 0,
    });
    setBalances({
      formattedBalance0: "",
      formattedBalance1: "",
    });
    const pool = pools.find(pool => pool.poolAddress === value);
    if (!pool) return;
    const contract0 = useERC20Contract(pool.token0, provider);
    const contract1 = useERC20Contract(pool.token1, provider);
    if (!contract0 || !contract1) return;
    const balanceOf0 = await contract0.balanceOf(address);
    const balanceOf1 = await contract1.balanceOf(address);
    const decimal0 = await contract0.decimals();
    const decimal1 = await contract1.decimals();
    const formattedBalance0 = ethers.formatUnits(balanceOf0, decimal0);
    const formattedBalance1 = ethers.formatUnits(balanceOf1, decimal1);

    setBalances({
      formattedBalance0,
      formattedBalance1,
    })

  };
  const inputTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAmounts((prev) => ({
      ...prev,
      inputToken: e.target.value,
    }));
  }
  const outputTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAmounts((prev) => ({
      ...prev,
      outputToken: e.target.value,
    }));
  }
  const inputTokenBlur = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (pairValue === "") {
      toast("Please select a trading pair first.", {
        type: "warning",
      });

      setTokenAmounts({
        inputToken: 0,
        outputToken: 0,
      });
      return;
    }
    const pool = pools.find(pool => pool.poolAddress === pairValue);
    if (!pool) {
      toast("Selected trading pair not found.", {
        type: "error",
      });
      return;
    };
    const { token0, token1, index } = pool;
    const amountIn = tokenAmounts.inputToken;
    const contract0 = await useERC20Contract(pool.token0, provider);
    const contract1 = await useERC20Contract(pool.token1, provider);
    if (!contract0 || !contractWithSigner) return;
    const decimal0 = await contract0.decimals();
    const decimal1 = await contract1!.decimals();
    // const indexs = pools.filter(p => {
    //   return p.token0 === token0 && p.token1 === token1;
    // }).map(p => p.index);
    // console.log("indexs", indexs);

    const params = {
      tokenIn: token0,
      tokenOut: token1,
      indexPath: [index],
      amountIn: ethers.parseUnits(amountIn.toString(), decimal0), // 假设输入金额以18位小数表示
      sqrtPriceLimitX96: 4295128740,
    }
    console.log("quoteExactInput params", params);
    try {
      const tx = await contractWithSigner.quoteExactInput.staticCall(params)
      console.log("quoteExactInput tx", tx);
      const amountOut = ethers.formatUnits(tx, decimal1);
      setTokenAmounts({
        ...tokenAmounts,
        outputToken: amountOut,
      });
    } catch (error) {
      console.log("quoteExactInput error", error);

      toast("this pool has zero liquidity", {
        type: "warning",
      });
    }

  };
  const outputTokenBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (pairValue === "") {
      toast("Please select a trading pair first.", {
        type: "warning",
      });
      setTokenAmounts({
        inputToken: 0,
        outputToken: 0,
      });
      return;
    }
  };
  const handleSwap = async () => {
    if (!contractWithSigner) return;
    console.log("Swapping...", pairValue, tokenAmounts, balances);
    const pool = pools.find(pool => pool.poolAddress === pairValue);
    console.log("pool", pool);
    if (!pool) return;
    const contract0 = useERC20Contract(pool.token0, provider);
    const contract1 = useERC20Contract(pool.token1, provider);
    const contractSigner0 = new ethers.Contract(pool.token0, erc20, signer);
    if (!contract0 || !contract1 || !contractSigner0) return;
    const decimal0 = await contract0.decimals();
    const decimal1 = await contract1.decimals();
    const amount0Desired = ethers.parseUnits(tokenAmounts.inputToken.toString(), decimal0);
    const amount1Desired = ethers.parseUnits(tokenAmounts.outputToken.toString(), decimal1);
    try {
      const allowToken0 = await contract0.allowance(address, process.env.NEXT_PUBLIC_SWAP_ROUTER_ID)
      console.log("amount0Desired", amount0Desired, allowToken0);
      let tx0;
      if (amount0Desired > allowToken0) {
        tx0 = await contractSigner0.approve(process.env.NEXT_PUBLIC_SWAP_ROUTER_ID, amount0Desired);
        await tx0.wait();
      }
    } catch (error) {
      console.log("allowance", error);
    }
    const slippageTolerance = 0.005; // 0.5%
    const amountOutMinimum = amount1Desired * BigInt((1 - slippageTolerance) * 10000) / BigInt(10000);
    // 不管什么交易对，统一这样设：
    // if (zeroForOne) {
    //   sqrtPriceLimitX96 = "4295128740";      // > MIN
    // } else {
    //   sqrtPriceLimitX96 = "1461446703485210103287273052241885168127"; // < MAX
    // }
    const params = {
      tokenIn: pool.token0,
      tokenOut: pool.token1,
      indexPath: [pool.index],
      amountIn: amount0Desired, // 假设输入金额以18位小数表示
      recipient: address,
      deadline: Math.floor(Date.now() / 1000) + 300, // 5分钟过期
      amountOutMinimum: amountOutMinimum, // 最小接受输出数量，防止滑点
      sqrtPriceLimitX96: 4295128740,
    }
    console.log("Swap params", params);
    const tx = await contractWithSigner.exactInput(params);
    console.log("Swap tx", tx);
    const receipt = await tx.wait();
    console.log("Swap receipt", receipt);
  };
  React.useEffect(() => {
    const fetchPools = async () => {
      if (!poolContract) return;
      const allPools = await poolContract.getAllPools();
      const pools1 = await Promise.all(allPools.map(async (pool: any) => {
        const token0Contract = useERC20Contract(pool.token0, provider);
        const token1Contract = useERC20Contract(pool.token1, provider);
        if (!token0Contract || !token1Contract) return;
        let symbol0: any, symbol1: any, balanceOf0: any, balanceOf1: any, decimals0: any, decimals1: any, formattedToken0Balance = "", formattedToken1Balance = "";
        try {
          symbol0 = await token0Contract.symbol();
          symbol1 = await token1Contract.symbol();
          balanceOf0 = await token0Contract.balanceOf(pool.pool);
          balanceOf1 = await token1Contract.balanceOf(pool.pool);
          decimals0 = await token0Contract.decimals();
          decimals1 = await token1Contract.decimals();
          formattedToken0Balance = ethers.formatUnits(balanceOf0, decimals0);
          formattedToken1Balance = ethers.formatUnits(balanceOf1, decimals1);
        } catch (error) {
          // console.log("Error fetching token data:", error);
        }

        return {
          poolAddress: pool.pool,
          symbol0: symbol0 || "",
          symbol1: symbol1 || "",
          token0: pool.token0,
          token1: pool.token1,
          index: pool.index,
          formattedToken0Balance,
          formattedToken1Balance,
          sqrtPriceX96: pool.sqrtPriceX96,
          liquidity: pool.liquidity,
        }
      }));
      console.log('allPools', pools1);
      setPools(pools1);
    }
    fetchPools();
  }, [poolContract])
  return (
    <div className="flex">
      <div className="w-[600px] h-auto bg-white justify-center items-center flex flex-col mx-auto mt-40 rounded-lg border border-gray-200 py-4">
        <h1 className="text-3xl font-bold mb-4">Swap</h1>
        <div className='w-full px-6'>
          <div className='w-full p-2 border rounded-lg border-gray-200'>
            <div className='w-full flex justify-between items-end mb-4'>
              <input type="number" step={0.000000000000000001} name='inputAmount' className='font-bold text-2xl w-[100px] flex-1' placeholder='please input' value={tokenAmounts.inputToken} onChange={inputTokenChange} onBlur={inputTokenBlur} />
              <select className='w-[400px]' name="inputToken" id="inputToken" value={pairValue} onChange={onPairChange}>
                <option value="">请选择</option>
                {pools.map((pool) => (
                  <option key={pool.poolAddress} value={pool.poolAddress}>{`${pool.symbol0}[${pool.formattedToken0Balance}](${pool.token0.substring(0, 6)}...${pool.token0.substring(pool.token0.length - 4)}) / ${pool.symbol1}[${pool.formattedToken1Balance}](${pool.token1.substring(0, 6)}...${pool.token1.substring(pool.token1.length - 4)})/${pool.index}/${pool.liquidity}`}</option>
                ))}
              </select>
            </div>
            <div className='text-gray-500 flex justify-between'>
              <div>
                $0.00
              </div>
              <div>
                Balance: {balances.formattedBalance0}
                <Button variant="text" style={{ textTransform: 'none' }}>Max</Button>
              </div>
            </div>
          </div>
          <div className='p-2 my-2 border rounded-lg border-gray-200'>
            <div className='flex justify-between items-end mb-4'>
              <input type="number" step={0.000000000000000001} name='outputAmount' className='font-bold text-2xl w-[100px] flex-1' placeholder='please input' value={tokenAmounts.outputToken} onChange={outputTokenChange} onBlur={outputTokenBlur} />
              <select className='w-[400px]' name="outputToken" id="outputToken" value={pairValue} onChange={onPairChange}>
                <option value="">请选择</option>
                {pools.map((pool) => (
                  <option key={pool.poolAddress} value={pool.poolAddress}>{`${pool.symbol0}[${pool.formattedToken0Balance}](${pool.token0.substring(0, 6)}...${pool.token0.substring(pool.token0.length - 4)}) / ${pool.symbol1}[${pool.formattedToken1Balance}](${pool.token1.substring(0, 6)}...${pool.token1.substring(pool.token1.length - 4)})/${pool.index}/${pool.liquidity}`}</option>
                ))}
              </select>
            </div>
            <div className='text-gray-500 flex justify-between'>
              <div>
                $0.00
              </div>
              <div>
                Balance: {balances.formattedBalance1}
              </div>
            </div>
          </div>
          <Button variant="contained" type='submit' autoFocus form="subscription-form" style={{ textTransform: 'none', width: '100%' }} onClick={handleSwap}>Swap</Button>
        </div>
      </div>
    </div>
  );
}