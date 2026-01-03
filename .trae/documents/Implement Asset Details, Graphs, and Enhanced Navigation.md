# Wallet App Enhancement Plan

I will implement the requested navigation fixes, asset display improvements, and the new Asset Detail view with interactive graphs.

## 1. Dependency Installation
*   **Install `recharts`**: Add the `recharts` library to the webapp to support the interactive price history graphs.

## 2. Navigation & Routing Updates (`webapp/src/App.tsx`)
*   **New Route**: Add a route for `/asset/:id` to handle the new Asset Detail page.
*   **Transition Checks**: Ensure all `useNavigate` calls provide smooth transitions (using existing Framer Motion setup).

## 3. Home Page Refinement (`webapp/src/pages/Home.tsx`)
*   **Asset List Redesign**: Update the asset list items to match the "Left Panel / Right Panel" requirements:
    *   **Left**: Coin Logo (using external CDN for real logos) + Name + Current Price.
    *   **Right**: Total Balance + Calculated Value (Price * Balance).
*   **Click Action**: Make each asset item clickable, navigating to the new `/asset/:id` page.
*   **Real Logos**: Replace generic placeholders with high-quality crypto logos (ETH, USDT, USDC, DAI, etc.).

## 4. New Feature: Asset Detail View (`webapp/src/pages/AssetDetails.tsx`)
*   **Create New Page**: Implement `AssetDetails.tsx`.
*   **Interactive Graph**:
    *   Use `recharts` to display a price timeline.
    *   Add a time period selector (1D, 1W, 1M, 1Y) that updates the mock graph data.
    *   Ensure smooth animations for data transitions.
*   **Receive Section**:
    *   Display the user's wallet address and QR code (using the existing QR API).
    *   Add a "Copy" button.

## 5. Transaction Success Refinement (`webapp/src/pages/Send.tsx`)
*   **Validation**: Ensure the "Success" state is robust and prevents double-submission.
*   **Feedback**: Verify the Etherscan link works correctly (already addressed, but will double-check context).

## 6. Verification
*   **Visual Check**: Confirm the Home page list looks correct with logos and prices.
*   **Interaction Check**: Click an asset -> Verify it opens the Detail view -> Interact with the graph -> Check the Receive section.
*   **Navigation Check**: Ensure "Back" buttons work correctly across the new flow.
