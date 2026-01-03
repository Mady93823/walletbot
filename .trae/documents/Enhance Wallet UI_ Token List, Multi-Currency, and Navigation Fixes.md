# Wallet App Enhancement Plan

I will update the wallet application to support multi-currency display, a token list, improved navigation, and correct Etherscan linking.

## 1. Homepage Overhaul (`webapp/src/pages/Home.tsx`)

### Token List & "Trust Wallet" Style

* **Replace Recent Activity**: Remove the "Recent Activity" section.

* **Add Asset List**: Implement a list displaying ETH and ERC-20 tokens (USDT, USDC, DAI) with their balances and current values.

* **Mock Data**: Since we don't have a live token backend, I will add mock data for these tokens to demonstrate the UI.

### Total Balance & Currency Settings

* **Currency Logic**: Add support for switching currencies (USD, INR, AED).

* **Dynamic Calculation**: The "Total Balance" will now calculate the sum of all assets (ETH + Tokens) converted to the selected currency.

* **Currency Selector**: Add a setting/dropdown in the header to toggle between currencies (e.g., USD, INR, AED).

## 2. Navigation Fixes (`webapp/src/pages/Receive.tsx`)

* **Back Button**: Change the back button behavior to explicitly navigate to the Home page (`/`) instead of using browser history (`-1`), ensuring it always works even if the user landed directly on the page.

* **UI Tweaks**: Increase the touch target size of the back button for better usability.

## 3. Transaction Success Actions (`webapp/src/pages/Send.tsx`)

* **Etherscan Link**: Add/Fix the "View on Etherscan" button in the transaction success view.

* **Correct URL**: Ensure it points to `https://sepolia.etherscan.io/tx/{hash}` instead of the error page.

## 4. Verification

* **Visual Check**: Verify the Home page shows the token list and updates values when currency changes.

* **Navigation Check**: Verify the Receive page back button returns to Home.

* **Link Check**: Verify the Etherscan link opens the correct transaction URL.

