import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageCrypto } from './ManageCrypto';
import { BrowserRouter } from 'react-router-dom';
import { walletApi } from '../api';

// Mocks
vi.mock('../api', () => ({
  walletApi: {
    getAssets: vi.fn(),
    toggleAsset: vi.fn(),
    addCustomAsset: vi.fn(),
  },
}));

vi.mock('@twa-dev/sdk', () => ({
  default: {
    showPopup: vi.fn(),
    showAlert: vi.fn(),
    HapticFeedback: {
      notificationOccurred: vi.fn(),
      impactOccurred: vi.fn(),
    },
  },
}));

const mockAssets = [
  { id: '1', symbol: 'ETH', name: 'Ethereum', chain: 'ETH', is_enabled: true },
  { id: '2', symbol: 'USDT', name: 'Tether', chain: 'ETH', is_enabled: false },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ManageCrypto />
    </BrowserRouter>
  );
};

describe('ManageCrypto Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (walletApi.getAssets as any).mockResolvedValue({ data: { assets: mockAssets } });
  });

  it('renders assets list', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Ethereum/i)).toBeInTheDocument();
      expect(screen.getByText(/Tether/i)).toBeInTheDocument();
    });
  });

  it('toggles asset visibility', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Ethereum/i)).toBeInTheDocument());

    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[0]); // Toggle ETH

    await waitFor(() => {
      expect(walletApi.toggleAsset).toHaveBeenCalledWith('1', false);
    });
  });

  it('filters assets by search', async () => {
    renderComponent();
    // Wait for initial load - find by text content instead of exact string
    await waitFor(() => {
      expect(screen.getByText(/Ethereum/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search tokens...');
    fireEvent.change(searchInput, { target: { value: 'Tether' } });

    // Wait for filter to apply
    await waitFor(() => {
        expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
        screen.getByText(/Tether/i);
    }, { timeout: 2000 });
  });

  it('adds custom token', async () => {
    (walletApi.addCustomAsset as any).mockResolvedValue({ success: true });
    
    renderComponent();
    
    // Open Modal
    const addBtn = screen.getAllByRole('button')[1]; // Plus icon
    fireEvent.click(addBtn);

    expect(screen.getByText('Add Custom Token')).toBeInTheDocument();

    // Fill Form
    fireEvent.change(screen.getByPlaceholderText('Contract Address'), { target: { value: '0x123' } });
    fireEvent.change(screen.getByPlaceholderText('Symbol (e.g. PEPE)'), { target: { value: 'PEPE' } });
    
    // Submit
    fireEvent.click(screen.getByText('Add Token'));

    await waitFor(() => {
      expect(walletApi.addCustomAsset).toHaveBeenCalledWith(expect.objectContaining({
        symbol: 'PEPE',
        contract_addr: '0x123'
      }));
    });
  });
});
