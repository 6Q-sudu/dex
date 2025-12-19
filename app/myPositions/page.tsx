"use client";
import Button from '@mui/material/Button';
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { usePositionContract, useERC20Contract, usePositionContractWithSigner } from '@/hooks/useContract';
import { useWallet } from '@/wallet-sdk/provider';
import AddPosition from './components/addPosition'
import { TickMath } from '@uniswap/v3-sdk';
import { sqrtPriceX96ToPrice } from '@/utils/price';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { positionManagerAbi } from '@/assets//abis/positionManager';
export default function MyPositions() {
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [page, setPage] = React.useState(0);
  const [allRows, setAllRows] = React.useState([]);
  const [pageRows, setPageRows] = React.useState<(any)[]>([]);
  const positionContract = usePositionContract();
  const positionContractWithSigner = usePositionContractWithSigner();
  const { address, provider } = useWallet();
  console.log('positionContract', positionContract);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const queryAllPositionList = async () => {
    if (!positionContract) return;
    const positionList = await positionContract.getAllPositions();
    setAllRows(positionList.map((position: any) => {
      return {
        id: position.id,
        owner: position.owner,
        token0: position.token0,
        token1: position.token1,
        index: position.index,
        fee: position.fee,
        liquidity: position.liquidity,
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        tokensOwed0: position.tokensOwed0,
        tokensOwed1: position.tokensOwed1,
        feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
        feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
      }
    }).filter((position: any) => {
      const currentUserAddress = address;
      return position.owner.toLowerCase() === currentUserAddress?.toLowerCase();
    }));
    console.log('AllRows', allRows);
  }
  const queryPagePositionList = async (pageIndex: number, pageSize: number) => {
    if (!allRows.length) return;
    const cPageRowList = allRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    console.log("cPageRowList", cPageRowList);

    const prList = await Promise.all(cPageRowList.map(async (position: any) => {
      const token0Contract = useERC20Contract(position.token0, provider);
      const token1Contract = useERC20Contract(position.token1, provider);
      if (!token0Contract || !token1Contract) return;
      let symbol0, decimals0, symbol1, decimals1, balanceOf0, balanceOf1;
      try {
        symbol0 = await token0Contract.symbol();
        decimals0 = await token0Contract.decimals();
        symbol1 = await token1Contract.symbol();
        decimals1 = await token1Contract.decimals();
        balanceOf0 = await token0Contract.balanceOf(address);
        balanceOf1 = await token1Contract.balanceOf(address);
      } catch (error) {
        console.log('error', error);
      }
      // 格式化余额（考虑小数位）
      const formattedToken0Balance = ethers.formatUnits(balanceOf0, decimals0);
      const formattedToken1Balance = ethers.formatUnits(balanceOf1, decimals1);
      let tickLower: string | undefined;
      try {
        const sqrtPriceLower = TickMath.getSqrtRatioAtTick(Number(position.tickLower));
        tickLower = sqrtPriceX96ToPrice(BigInt(sqrtPriceLower.toString()), Number(decimals0), Number(decimals1));
      } catch (error) {
        console.log('tickLower_error', error);
      }

      let tickUpper: string | undefined;
      try {
        const sqrtPriceUpper = TickMath.getSqrtRatioAtTick(Number(position.tickUpper));
        tickUpper = sqrtPriceX96ToPrice(BigInt(sqrtPriceUpper.toString()), Number(decimals0), Number(decimals1));
      } catch (error) {
        console.log('tickUpper_error', error);
      }

      let currentPrice: string | undefined;
      // try {
      //   const sqrtPrice = sqrtPriceX96ToPrice(position.sqrtPriceX96, Number(decimals0), Number(decimals1));
      //   currentPrice = sqrtPrice;
      // } catch (error) {
      //   console.log('currentPrice_error', error);
      // }
      return {
        positionAddress: position.id,
        token: `${symbol0} (${Number(formattedToken0Balance).toFixed(4)}) / ${symbol1} (${Number(formattedToken1Balance).toFixed(4)})`,
        feeTier: Number(position.fee) / 1e4 + '%',
        priceRange: `${tickLower} ~ ${tickUpper}`,
        currentPrice: '---', // 这里可以添加当前价格的计算逻辑
      }
    }));
    console.log('PageRows', pageRows);
    setPageRows(prList);
  }
  // 移除流动性
  const handleRemovePosition = async (positionAddress: string) => {
    if (!positionContractWithSigner) return;
    const tx = await positionContractWithSigner.burn(positionAddress);
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error('移除失败！');
    }
    console.log("Remove Position receipt", receipt);
    toast("Position removal success.", {
      type: "info",
    });
  }
  // 提取手续费
  const handleCollectFees = async (positionAddress: string) => {
    if (!positionContractWithSigner) return;
    const txResponse = await positionContractWithSigner.collect(positionAddress, address);
    const receipt = await txResponse.wait();
    console.log("Collect Position receipt", receipt);
    if (receipt.status === 0) {
      throw new Error('交易执行失败！');
    }

    toast("Position collected successfully.", {
      type: "info",
    });
  }
  React.useEffect(() => {
    queryAllPositionList();
  }, [positionContract]);
  React.useEffect(() => {
    queryPagePositionList(page, rowsPerPage);
  }, [page, rowsPerPage, allRows]);
  return <div className="flex flex-col flex-1 p-4">
    <h2 className="py-2 font-bold">Positions</h2>
    <div className="flex flex-col flex-1 p-4 bg-white">
      <div className="flex justify-between w-full h-min">
        <div className="font-bold">
          My Positions
        </div>
        <div className="flex">
          <AddPosition />
        </div>
      </div>
      <div className='pt-4'>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead className='bg-gray-200'>
              <TableRow>
                <TableCell>Token</TableCell>
                <TableCell align="right">Fee tier</TableCell>
                <TableCell align="right">Set price range</TableCell>
                <TableCell align="right">Current price</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((row) => (
                <TableRow
                  key={row.positionAddress}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.token}
                  </TableCell>
                  <TableCell align="right">{row.feeTier}</TableCell>
                  <TableCell align="right">{row.priceRange}</TableCell>
                  <TableCell align="right">{row.currentPrice}</TableCell>
                  <TableCell align="right">
                    <Button variant="text" style={{ textTransform: 'none' }} onClick={() => handleRemovePosition(row.positionAddress)}>Remove</Button>
                    <Button variant="text" style={{ textTransform: 'none' }} onClick={() => handleCollectFees(row.positionAddress)}>Collect</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={allRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>
    </div>
  </div>;
}