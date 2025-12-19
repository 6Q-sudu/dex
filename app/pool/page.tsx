"use client";
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import * as React from 'react';
import { usePoolContract, useERC20Contract } from '@/hooks/useContract';
import { useWallet } from '@/wallet-sdk/provider';
import { ethers } from 'ethers';
import { Tick, TickMath } from '@uniswap/v3-sdk';
import AddPool from './components/addPool';
import { sqrtPriceX96ToPrice } from '@/utils/price';
import Link from 'next/link'

export default function Pool() {
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [page, setPage] = React.useState(0);
  const [allRows, setAllRows] = React.useState([]);
  const [pageRows, setPageRows] = React.useState<(any)[]>([]);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const poolContract = usePoolContract();
  const { provider } = useWallet();

  const queryAllPoolList = async () => {
    if (!poolContract) return;
    const poolList = await poolContract.getAllPools();
    setAllRows(poolList.map((pool: any) => {
      return {
        poolAddress: pool.pool,
        token0: pool.token0,
        token1: pool.token1,
        index: pool.index,
        fee: pool.fee,
        feeProtocol: pool.feeProtocol,
        tickLower: pool.tickLower,
        tickUpper: pool.tickUpper,
        tick: pool.tick,
        sqrtPriceX96: pool.sqrtPriceX96,
        liquidity: pool.liquidity,
      }
    }));
    console.log('poolList', poolList);

  }
  const queryPagePoolList = async (pageIndex: number, pageSize: number) => {
    if (!allRows.length) return;
    const cPageRowList = allRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    const prList: any = await Promise.all(cPageRowList.map(async (pool: any) => {
      const token0Contract = useERC20Contract(pool.token0, provider);
      const token1Contract = useERC20Contract(pool.token1, provider);
      if (!token0Contract || !token1Contract) return;
      let symbol0, decimals0, symbol1, decimals1, balanceOf0, balanceOf1;
      try {
        symbol0 = await token0Contract.symbol();
        decimals0 = await token0Contract.decimals();
        symbol1 = await token1Contract.symbol();
        decimals1 = await token1Contract.decimals();
        balanceOf0 = await token0Contract.balanceOf(pool.poolAddress);
        balanceOf1 = await token1Contract.balanceOf(pool.poolAddress);
      } catch (error) {
        console.log('error', error);
        return {
          poolAddress: pool.poolAddress,
        };
      }
      // 格式化余额（考虑小数位）
      const formattedToken0Balance = ethers.formatUnits(balanceOf0, decimals0);
      const formattedToken1Balance = ethers.formatUnits(balanceOf1, decimals1);

      let tickLower: string | undefined;
      try {
        const sqrtPriceLower = TickMath.getSqrtRatioAtTick(Number(pool.tickLower));
        tickLower = sqrtPriceX96ToPrice(BigInt(sqrtPriceLower.toString()), Number(decimals0), Number(decimals1));
      } catch (error) {
        console.log('tickLower_error', error);
      }

      let tickUpper: string | undefined;
      try {
        const sqrtPriceUpper = TickMath.getSqrtRatioAtTick(Number(pool.tickUpper));
        tickUpper = sqrtPriceX96ToPrice(BigInt(sqrtPriceUpper.toString()), Number(decimals0), Number(decimals1));
      } catch (error) {
        console.log('tickUpper_error', error);
      }

      let currentPrice: string | undefined;
      try {
        const sqrtPrice = sqrtPriceX96ToPrice(pool.sqrtPriceX96, Number(decimals0), Number(decimals1));
        currentPrice = sqrtPrice;
      } catch (error) {
        console.log('currentPrice_error', error);
      }
      return {
        poolAddress: pool.poolAddress,
        token: `${symbol0} (${Number(formattedToken0Balance).toFixed(4)}) / ${symbol1} (${Number(formattedToken1Balance).toFixed(4)})`,
        feeTier: (Number(pool.fee) / 10000).toFixed(2) + '%',
        priceRange: `${tickLower} - ${tickUpper}`,
        currentPrice: currentPrice,
        liquidity: parseFloat(pool.liquidity).toFixed(2),
      }
    }))
    console.log('prList', prList);
    setPageRows(prList);
  }
  React.useEffect(() => {
    console.log(1);

    console.log('poolContract', poolContract);
    queryAllPoolList();
  }, [poolContract])

  React.useEffect(() => {
    queryPagePoolList(page, rowsPerPage);
  }, [allRows, page, rowsPerPage]);
  return (
    <div className="flex flex-col flex-1 p-4">
      <h2 className="py-2 font-bold">Pool</h2>
      <div className="flex flex-col flex-1 p-4 bg-white">
        <div className="flex justify-between w-full h-min">
          <div className="font-bold">
            Pool list
          </div>
          <div className="flex">
            <Button
              className='mr-4!'
              variant="outlined" style={{ textTransform: 'none' }}>
              <Link href="/myPositions">
                My Positions
              </Link>
            </Button>
            <AddPool />
          </div>
        </div>

        <div className='pt-4'>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead className='bg-gray-200'>
                <TableRow>
                  <TableCell>Pool Address</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell align="right">Fee tier</TableCell>
                  <TableCell align="right">Set price range</TableCell>
                  <TableCell align="right">Current price</TableCell>
                  <TableCell align="right">Liquidity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow
                    key={row.poolAddress}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.poolAddress}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {row.token}
                    </TableCell>
                    <TableCell align="right">{row.feeTier}</TableCell>
                    <TableCell align="right">{row.priceRange}</TableCell>
                    <TableCell align="right">{row.currentPrice}</TableCell>
                    <TableCell align="right">{row.liquidity}</TableCell>
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
    </div>
  );
}