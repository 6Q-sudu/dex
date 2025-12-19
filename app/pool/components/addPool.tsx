import React, { use } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { priceToSqrtPriceX96, sortTokens } from '@/utils/price';
import { useERC20Contract, usePoolContract, usePoolContractWithSigner } from '@/hooks/useContract'
import { useWallet } from '@/wallet-sdk/provider'
import { toast } from 'react-toastify';
import { TickMath } from '@uniswap/v3-sdk';
import { Price } from '@uniswap/sdk-core';
import JSBI from 'jsbi'
export default function AddPool() {
  const [open, setOpen] = React.useState(false);
  const { provider } = useWallet();
  const poolContract = usePoolContract();
  const poolContractWithSigner = usePoolContractWithSigner();
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries((formData as any).entries());
    console.log("formJson", formJson);
    const { inputToken, outputToken, feeTier, currentPrice, priceRangeLow, priceRangeHigh } = formJson;
    if (!inputToken || !outputToken || !feeTier || !currentPrice || !priceRangeLow || !priceRangeHigh) {
      toast("Please fill in all required fields.", {
        type: "error",
      });
      return;
    }
    const contract0 = useERC20Contract(inputToken, provider);
    const contract1 = useERC20Contract(outputToken, provider);
    if (!contract0 || !contract1) return;
    const decimal0 = await contract0.decimals();
    const decimal1 = await contract1.decimals();

    const sqrtPriceX96Low = JSBI.BigInt(priceToSqrtPriceX96(priceRangeLow, decimal0, decimal1).toString());
    const sqrtPriceX96High = JSBI.BigInt(priceToSqrtPriceX96(priceRangeHigh, decimal0, decimal1).toString());
    const sqrtPriceX96 = priceToSqrtPriceX96(currentPrice, decimal0, decimal1);
    const tickLower = TickMath.getTickAtSqrtRatio(sqrtPriceX96Low);
    const tickUpper = TickMath.getTickAtSqrtRatio(sqrtPriceX96High);
    console.log("sqrtPriceX96Low, sqrtPriceX96High, tickLower, tickUpper, sqrtPriceX96", sqrtPriceX96Low, sqrtPriceX96High, tickLower, tickUpper, sqrtPriceX96);
    console.log("poolContract", poolContract);

    const tx = await poolContractWithSigner!.createAndInitializePoolIfNecessary({
      token0: inputToken,
      token1: outputToken,
      fee: Math.floor(parseFloat(feeTier) * 1e6), // 转为 uint24 格式的 fee
      tickLower: tickLower,
      tickUpper: tickUpper,
      sqrtPriceX96: sqrtPriceX96,
    });
    console.log("tx", tx);
    toast("Pool creation transaction submitted.", {
      type: "info",
    });
    handleClose();
  };
  return (
    <React.Fragment>
      <Button variant="contained" style={{ textTransform: 'none' }} onClick={handleClickOpen}>Add Pool</Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"

      >
        <DialogTitle id="alert-dialog-title">
          Add Pool
        </DialogTitle>
        <DialogContent className="w-[600px]">
          <form onSubmit={handleSubmit} id="subscription-form">
            <div className='mt-4'>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"> <span className='text-red-500'>*</span> Deposit amounts</label>
              <div>
                <div className='p-2 border rounded-lg border-gray-200'>
                  {/* <div className='flex justify-between items-end mb-4'>
                    <input type="number" name='inputAmount' className='font-bold text-2xl flex-1' placeholder='please input' defaultValue={0} /> */}
                  <select name="inputToken" id="inputToken">
                    <option value="0x4798388e3adE569570Df626040F07DF71135C48E">MNTokenA</option>
                    <option value="0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30">MNTokenB</option>
                    <option value="0x86B5df6FF459854ca91318274E47F4eEE245CF28">MNTokenC</option>
                    <option value="0x7af86B1034AC4C925Ef5C3F637D1092310d83F03">MNTokenD</option>
                    <option value="0x55f66188a343EcF1D451e1bfA04b0a12614Ce43a">QTA</option>
                    <option value="0x89C6FCA151dDd3F82E9622EFD424207011Af4c6c">QTB</option>
                    <option value="0x00F1Fc1bD0753C9fC05aC964CDbd762a0867b878">QTC</option>
                    <option value="0x9937A414Ed27aA357803b6c5cde6198923179338">QTD</option>
                  </select>
                  {/* </div> */}
                  {/* <div className='text-gray-500 flex justify-between'>
                    <div>
                      $0.00
                    </div>
                    <div>
                      Balance: 0.00
                      <Button variant="text" style={{ textTransform: 'none' }}>Max</Button>
                    </div>
                  </div> */}
                </div>
                <div className='p-2 mt-2 border rounded-lg border-gray-200'>
                  {/* <div className='flex justify-between items-end mb-4'>
                    <input type="number" name='outputAmount' className='font-bold text-2xl flex-1' placeholder='please input' defaultValue={0} /> */}
                  <select name="outputToken" id="outputToken">
                    <option value="0x4798388e3adE569570Df626040F07DF71135C48E">MNTokenA</option>
                    <option value="0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30">MNTokenB</option>
                    <option value="0x86B5df6FF459854ca91318274E47F4eEE245CF28">MNTokenC</option>
                    <option value="0x7af86B1034AC4C925Ef5C3F637D1092310d83F03">MNTokenD</option>
                    <option value="0x55f66188a343EcF1D451e1bfA04b0a12614Ce43a">QTA</option>
                    <option value="0x89C6FCA151dDd3F82E9622EFD424207011Af4c6c">QTB</option>
                    <option value="0x00F1Fc1bD0753C9fC05aC964CDbd762a0867b878">QTC</option>
                    <option value="0x9937A414Ed27aA357803b6c5cde6198923179338">QTD</option>
                  </select>
                  {/* </div>
                  <div className='text-gray-500 flex justify-between'>
                    <div>
                      $0.00
                    </div>
                    <div>
                      Balance: 0.00
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
            <div className='mt-4'>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"> <span className='text-red-500'>*</span> Fee tier</label>
              <select name="feeTier" id="feeTier" className='w-full h-10 border rounded-lg border-gray-200'>
                <option value="0.0005">0.05%</option>
                <option value="0.003">0.3%</option>
                <option value="0.01">1%</option>
              </select>
            </div>
            <div className='mt-4'>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"> <span className='text-red-500'>*</span>Set price range</label>
              <div className='flex space-x-2'>
                <input
                  type="number"
                  step={0.000000000000000001}
                  name='priceRangeLow'
                  className='border rounded-lg border-gray-200 p-2 flex-1'
                  placeholder='Low price'
                />
                <input
                  type="number"
                  step={0.000000000000000001}
                  name='priceRangeHigh'
                  className='border rounded-lg border-gray-200 p-2 flex-1'
                  placeholder='High price'
                />
              </div>
            </div>
            <div className='mt-4'>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"> <span className='text-red-500'>*</span>Current price</label>
              <input
                type="number"
                step={0.000000000000000001}
                name='currentPrice'
                className='w-full h-10 border rounded-lg border-gray-200 p-2'
                placeholder='Current price'
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