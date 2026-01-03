import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Receive } from './Receive';
import { BrowserRouter } from 'react-router-dom';
import { walletApi } from '../api';

// Mocks
vi.mock('../api', () => ({
  walletApi: {
    getUserMe: vi.fn(),
    getHistory: vi.fn(),
  },
}));

vi.mock('@twa-dev/sdk', () => ({
  default: {
    showPopup: vi.fn(),
    showAlert: vi.fn(),
    openTelegramLink: vi.fn(),
    HapticFeedback: {
      notificationOccurred: vi.fn(),
    },
  },
}));

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Receive />
    </BrowserRouter>
  );
};

describe('Receive Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (walletApi.getUserMe as any).mockResolvedValue({
      data: { wallet: { address: '0x123' } },
    });
    (walletApi.getHistory as any).mockResolvedValue({
      data: {
        history: [
          {
            id: '1',
            tx_hash: '0xabc123',
            amount: 0.5,
            symbol: 'ETH',
            type: 'Received',
            status: 'success',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            tx_hash: '0xdef456',
            amount: 0.05,
            symbol: 'ETH',
            type: 'Received',
            status: 'success',
            timestamp: new Date(Date.now() - 100000).toISOString(),
          },
          // Sent tx should be filtered out
          {
            id: '3',
            tx_hash: '0xsent789',
            amount: 1.0,
            symbol: 'ETH',
            type: 'Sent',
            status: 'success',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
  });

  it('renders correctly and fetches data', async () => {
    renderComponent();
    
    expect(screen.getByText('Receive')).toBeInTheDocument();
    expect(screen.getByText('Incoming History')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(walletApi.getUserMe).toHaveBeenCalled();
      expect(walletApi.getHistory).toHaveBeenCalled();
      expect(screen.getByText('0x123')).toBeInTheDocument();
    });
  });

  it('filters out Sent transactions', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('+0.5 ETH')).toBeInTheDocument();
      expect(screen.queryByText('-1.0 ETH')).not.toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('+0.5 ETH')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Search hash or amount...');
    fireEvent.change(searchInput, { target: { value: '0.05' } });

    expect(screen.getByText('+0.05 ETH')).toBeInTheDocument();
    expect(screen.queryByText('+0.5 ETH')).not.toBeInTheDocument();
  });

  it('handles filtering', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('+0.5 ETH')).toBeInTheDocument());

    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'high-value' } });

    expect(screen.getByText('+0.5 ETH')).toBeInTheDocument();
    expect(screen.queryByText('+0.05 ETH')).not.toBeInTheDocument();
  });

  it('handles bulk selection and deletion (hiding)', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('+0.5 ETH')).toBeInTheDocument());

    // Select all
    const selectAllBtn = screen.getByText('Select All').previousElementSibling as HTMLButtonElement;
    fireEvent.click(selectAllBtn);

    expect(screen.getByText('2 selected')).toBeInTheDocument();

    // Click Delete
    const deleteBtn = screen.getByTitle('Hide');
    fireEvent.click(deleteBtn);

    // Should be hidden
    expect(screen.queryByText('+0.5 ETH')).not.toBeInTheDocument();
  });
});
