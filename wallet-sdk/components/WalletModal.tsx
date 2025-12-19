import { Wallet } from '../types';

interface WalletModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  wallets?: Wallet[];
  onSelectWallet?: (wallet: Wallet) => void;
  connecting: boolean;
  error?: Error | null;
}
const WalletModal = ({ isOpen, onClose, wallets, onSelectWallet, connecting, error }: WalletModalProps) => {
  if (!isOpen) return null;
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50' onClick={onClose}>
      <div className='bg-white p-4 rounded-lg'>
        <h2 className='text-2xl font-bold'>
          Select a Wallet
        </h2>
        {/* 渲染 wallets */}
        <div className='space-y-3 max-h-[60vh] overflow-y-auto pr-l'>
          {
            wallets?.map((wallet) => (
              <div key={wallet.id} className='flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100'
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation();
                  if (onSelectWallet) {
                    onSelectWallet(wallet);
                  }
                }}>
                <img src={wallet.icon} alt={wallet.name} className='w-6 h-6 mr-2' />
                <span className='text-sm'>{wallet.name}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default WalletModal;