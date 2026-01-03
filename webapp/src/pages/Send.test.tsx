import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Send } from './Send';
import { BrowserRouter } from 'react-router-dom';
import { walletApi } from '../api';

// Mocks
vi.mock('../api', () => ({
  walletApi: {
    sendTransaction: vi.fn(),
    getAssets: vi.fn(),
  },
}));

vi.mock('@twa-dev/sdk', () => ({
  default: {
    showPopup: vi.fn(),
    showAlert: vi.fn(),
    openLink: vi.fn(),
    HapticFeedback: {
      notificationOccurred: vi.fn(),
    },
  },
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Send />
    </BrowserRouter>
  );
};

describe('Send Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (walletApi.getAssets as any).mockResolvedValue({
      data: {
        assets: [
          { id: '1', symbol: 'ETH', name: 'Ethereum', chain: 'ETH', is_enabled: true, logo_url: 'https://placehold.co/32' },
        ]
      }
    });
  });

  it('renders initial form correctly', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Send')).toBeInTheDocument()); // Changed from 'Send ETH' to 'Send' based on new code
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument();
  });

  it('validates invalid inputs', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Send')).toBeInTheDocument());

    const nextBtn = screen.getByText('Review Transaction');
    fireEvent.click(nextBtn);

    expect(screen.getByText('Recipient address is required')).toBeInTheDocument();
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
  });

  it('validates invalid ETH address', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Send')).toBeInTheDocument());

    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: 'invalid-address' } });
    
    const nextBtn = screen.getByText('Review Transaction');
    fireEvent.click(nextBtn);

    expect(screen.getByText('Invalid Ethereum address')).toBeInTheDocument();
  });

  it('proceeds to review step with valid inputs', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Send')).toBeInTheDocument());

    const validAddress = '0x1234567890123456789012345678901234567890';
    
    fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: validAddress } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '0.5' } });
    
    fireEvent.click(screen.getByText('Review Transaction'));

    expect(screen.getByText('Review')).toBeInTheDocument(); // Changed from 'Review Transaction' header
    expect(screen.getByText('0.5 ETH')).toBeInTheDocument();
    expect(screen.getByText(validAddress)).toBeInTheDocument();
  });

  it('handles fee selection', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Send')).toBeInTheDocument());
    
    // Default is Medium
    const mediumBtn = screen.getByText('Average').parentElement;
    expect(mediumBtn).toHaveClass('bg-blue-600');

    // Select Fast
    const fastBtn = screen.getByText('Fast');
    fireEvent.click(fastBtn);
    expect(fastBtn.parentElement).toHaveClass('bg-blue-600');
  });

  it('shows PIN modal on confirmation and submits', async () => {
    (walletApi.sendTransaction as any).mockResolvedValue({
      data: { success: true, hash: '0xhash123' }
    });

    renderComponent();
    await waitFor(() => expect(screen.getByText('Send')).toBeInTheDocument());
    
    // Fill Form
    const validAddress = '0x1234567890123456789012345678901234567890';
    fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: validAddress } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '0.5' } });
    fireEvent.click(screen.getByText('Review Transaction'));

    // Click Confirm
    fireEvent.click(screen.getByText('Confirm & Send'));

    // Check PIN Modal
    expect(screen.getByText('Enter PIN to Confirm')).toBeInTheDocument();

    // Enter PIN (1234)
    const keys = ['1', '2', '3', '4'];
    keys.forEach(key => {
      fireEvent.click(screen.getByText(key));
    });

    // Confirm PIN
    const confirmPinBtn = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmPinBtn);

    // Verify Submission
    await waitFor(() => {
      expect(walletApi.sendTransaction).toHaveBeenCalledWith(
        validAddress,
        '0.5',
        '1234',
        '',
        'medium', // Default fee
        '1' // Asset ID
      );
      expect(screen.getByText('Transaction Sent!')).toBeInTheDocument();
    });
  });
});
