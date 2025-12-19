import React, { use } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { priceToSqrtPriceX96 } from '@/utils/price';
import { useERC20Contract, usePoolContract, usePositionContractWithSigner, useERC20ContractWithSigner } from '@/hooks/useContract'
import { useWallet } from '@/wallet-sdk/provider'
import { toast } from 'react-toastify';
import { TickMath } from '@uniswap/v3-sdk';
import JSBI from 'jsbi'
import { ethers } from 'ethers';
import { sqrtPriceX96ToPrice } from '@/utils/price';
import { erc20 } from "@/assets/abis/erc20";
export default function AddPosition() {
  const [open, setOpen] = React.useState(false);
  const { provider, address, signer } = useWallet();
  const [pairValue, setPairValue] = React.useState("")
  const poolContract = usePoolContract();
  const positionContractWithSigner = usePositionContractWithSigner();
  const [pairOptions, setPairOptions] = React.useState<any[]>([]);
  const [formValue, setFormValue] = React.useState({
    formattedBalance0: "",
    formattedBalance1: "",
    tickLower: "",
    tickUpper: "",
    currentPrice: "",
    feeTier: "",
  })
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const initialize = React.useCallback(async () => {
    if (!poolContract) return;
    const allPools = await poolContract.getAllPools();

    const pairData = await Promise.all(allPools.map(async (pair: any) => {
      const token0Contract = useERC20Contract(pair.token0, provider);
      const token1Contract = useERC20Contract(pair.token1, provider);
      if (!token0Contract || !token1Contract) return;
      let symbol0, symbol1;
      try {
        symbol0 = await token0Contract.symbol();
        symbol1 = await token1Contract.symbol();
      } catch (error) {
        // console.log("Error fetching token data:", error);
      }
      return {
        poolAddress: pair.pool,
        token0: pair.token0,
        token1: pair.token1,
        index: pair.index,
        fee: pair.fee,
        feeProtocol: pair.feeProtocol,
        tickLower: pair.tickLower,
        tickUpper: pair.tickUpper,
        tick: pair.tick,
        sqrtPriceX96: pair.sqrtPriceX96,
        liquidity: pair.liquidity,
        symbol0,
        symbol1,
      }
    }));
    console.log("pairData", pairData);
    setPairOptions(pairData);
    return { allPools };
  }, [poolContract]);
  React.useEffect(() => {
    initialize();
  }, [initialize]);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries((formData as any).entries());
    console.log("formJson", formJson);
    const { inputToken, outputToken, inputAmount, outputAmount } = formJson;
    if (!inputToken || !outputToken || !inputAmount || !outputAmount) {
      toast("Please fill in all required fields.", {
        type: "error",
      });
      return;
    }
    const pool = pairOptions.find(pair => pair.poolAddress === inputToken);
    const contract0 = useERC20Contract(pool.token0, provider);
    const contract1 = useERC20Contract(pool.token1, provider);
    const contractSigner0 = new ethers.Contract(pool.token0, erc20, signer);
    const contractSigner1 = new ethers.Contract(pool.token1, erc20, signer);
    console.log("contract0 contract1", contract0, contract1);

    if (!contract0 || !contract1) return;
    const decimal0 = await contract0.decimals();
    const decimal1 = await contract1.decimals();
    const amount0Desired = ethers.parseUnits(inputAmount, decimal0);
    const amount1Desired = ethers.parseUnits(outputAmount, decimal1);
    try {
      const allowToken0 = await contract0.allowance(address, pool.poolAddress)
      const allowToken1 = await contract1.allowance(address, pool.poolAddress)
      console.log("amount0Desired", amount0Desired, amount1Desired, allowToken0, allowToken1);

      let tx0, tx1;
      if (amount0Desired > allowToken0) {
        tx0 = await contractSigner0.approve(pool.poolAddress, amount0Desired)
      }
      if (amount1Desired > allowToken1) {
        tx1 = await contractSigner1.approve(pool.poolAddress, amount1Desired)
      }
      console.log("allowToken0", allowToken0, allowToken1, tx0, tx1);

    } catch (error) {
      console.log("allowance", error);

    }
    const deadline = 1864936658;
    const param = {
      token0: pool.token0,
      token1: pool.token1,
      index: pool.index,
      amount0Desired: amount0Desired,
      amount1Desired: amount1Desired,
      recipient: address,
      deadline: deadline,
    }
    console.log("param", param);
    const tx = await positionContractWithSigner!.mint(param);
    console.log("tx", tx);
    toast("Position creation transaction submitted.", {
      type: "info",
    });
    // handleClose();
  };

  const onPairChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPairValue(value);
    const pool = pairOptions.find(pair => pair.poolAddress === value);
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
    let tickLower: string | undefined;
    try {
      const sqrtPriceLower = TickMath.getSqrtRatioAtTick(Number(pool.tickLower));
      tickLower = sqrtPriceX96ToPrice(BigInt(sqrtPriceLower.toString()), Number(decimal0), Number(decimal1));
    } catch (error) {
      console.log('tickLower_error', error);
    }

    let tickUpper: string | undefined;
    try {
      const sqrtPriceUpper = TickMath.getSqrtRatioAtTick(Number(pool.tickUpper));
      tickUpper = sqrtPriceX96ToPrice(BigInt(sqrtPriceUpper.toString()), Number(decimal0), Number(decimal1));
    } catch (error) {
      console.log('tickUpper_error', error);
    }

    let currentPrice: string | undefined;
    try {
      const sqrtPrice = sqrtPriceX96ToPrice(pool.sqrtPriceX96, Number(decimal0), Number(decimal1));
      currentPrice = sqrtPrice;
    } catch (error) {
      console.log('currentPrice_error', error);
    }
    const feeTier = (Number(pool.fee) / 10000) + '%';
    console.log('balanceOf0, balanceOf1', value, formattedBalance0, formattedBalance1);
    console.log("tickLower, tickUpper, currentPrice", tickLower, tickUpper, currentPrice);
    console.log("feeTier", feeTier);
    setFormValue({
      formattedBalance0,
      formattedBalance1,
      tickLower: tickLower?.toString() || "",
      tickUpper: tickUpper?.toString() || "",
      currentPrice: currentPrice?.toString() || "",
      feeTier,
    })

  };
  return (
    <React.Fragment>
      <Button variant="contained" style={{ textTransform: 'none' }} onClick={handleClickOpen}>Add</Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"

      >
        <DialogTitle id="alert-dialog-title">
          Add Position
        </DialogTitle>
        <DialogContent className="w-[600px]">
          <form onSubmit={handleSubmit} id="subscription-form">
            <div className='mt-4'>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"> <span className='text-red-500'>*</span> Deposit amounts</label>
              <div>
                <div className='p-2 border rounded-lg border-gray-200'>
                  <div className='flex justify-between items-end mb-4'>
                    <input type="number" step={0.000000000000000001} name='inputAmount' className='font-bold text-2xl w-[100px] flex-1' placeholder='please input' defaultValue={0} />
                    <select className='w-[400px]' name="inputToken" id="inputToken" value={pairValue} onChange={onPairChange}>
                      <option value="">请选择</option>
                      {(pairOptions || []).map((pair: any, index) => (
                        <React.Fragment key={pair.poolAddress}>
                          <option value={pair.poolAddress}>{pair.symbol0}({pair?.token0?.substring(0, 6) + '...' + pair.token0.substring(pair.token0.length - 4)}) -- {pair.symbol1}({pair.token1.substring(0, 6) + '...' + pair.token1.substring(pair.token1.length - 4)})/{pair.index}</option>
                        </React.Fragment>
                      ))}

                    </select>
                  </div>
                  <div className='text-gray-500 flex justify-between'>
                    <div>
                      $0.00
                    </div>
                    <div>
                      Balance: {formValue.formattedBalance0}
                      <Button variant="text" style={{ textTransform: 'none' }}>Max</Button>
                    </div>
                  </div>
                </div>
                <div className='p-2 mt-2 border rounded-lg border-gray-200'>
                  <div className='flex justify-between items-end mb-4'>
                    <input type="number" step={0.000000000000000001} name='outputAmount' className='font-bold text-2xl w-[100px] flex-1' placeholder='please input' defaultValue={0} />
                    <select className='w-[400px]' name="outputToken" id="outputToken" value={pairValue} onChange={onPairChange}>
                      <option value="">请选择</option>
                      {(pairOptions || []).map((pair: any, index) => (
                        <React.Fragment key={pair.poolAddress}>
                          <option value={pair.poolAddress}>{pair.symbol0}({pair?.token0?.substring(0, 6) + '...' + pair.token0.substring(pair.token0.length - 4)}) -- {pair.symbol1}({pair.token1.substring(0, 6) + '...' + pair.token1.substring(pair.token1.length - 4)})/{pair.index}</option>
                        </React.Fragment>
                      ))}
                    </select>
                  </div>
                  <div className='text-gray-500 flex justify-between'>
                    <div>
                      $0.00
                    </div>
                    <div>
                      Balance: {formValue.formattedBalance1}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='mt-4'>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"> <span className='text-red-500'>*</span> Fee tier</label>
              <input type="text" name='feeTier' disabled value={formValue.feeTier} className='font-bold text-2xl flex-1' />
            </div>
            <div className='mt-4'>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"> <span className='text-red-500'>*</span>Set price range</label>
              <div className='flex space-x-2'>
                <input
                  type="text"
                  name='priceRangeLow'
                  className='border rounded-lg border-gray-200 p-2 flex-1'
                  placeholder='Low price'
                  disabled
                  value={formValue.tickLower}
                />
                <input
                  type="text"
                  name='priceRangeHigh'
                  className='border rounded-lg border-gray-200 p-2 flex-1'
                  placeholder='High price'
                  disabled
                  value={formValue.tickUpper}
                />
              </div>
            </div>
            <div className='mt-4'>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"> <span className='text-red-500'>*</span>Current price</label>
              <input
                type="number"
                name='currentPrice'
                className='w-full h-10 border rounded-lg border-gray-200 p-2'
                placeholder='Current price'
                disabled
                value={formValue.currentPrice}
              />
              <div className='text-gray-500 text-xs pt-2'>USDC per ETH</div>
            </div>
          </form>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={handleClose} style={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" type='submit' autoFocus form="subscription-form" style={{ textTransform: 'none' }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}