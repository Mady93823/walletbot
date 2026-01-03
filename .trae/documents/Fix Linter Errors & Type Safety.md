# Diagnostics Fix Plan

## 1. Issue Analysis

We have two primary categories of TypeScript errors:

1.  **Type Mismatch (Decimal vs Number)**: In `assetService.ts` and `transactionService.ts`, there are attempts to assign `Prisma.Decimal` objects to fields that TypeScript expects to be `number`. This usually happens when the generated Prisma client types haven't fully synced with the schema change (Float -> Decimal) or when explicitly passing types.
2.  **Null Safety**: In `walletService.ts`, TypeScript flags `user.wallet` as possibly null inside a closure, even after an earlier check, because closure variables aren't type-narrowed automatically.

## 2. Proposed Changes

### A. Fix `assetService.ts`
*   **Problem**: `balance: asset.symbol === 'USDT' ? new Prisma.Decimal(1.0) : new Prisma.Decimal(0.0)` is erroring.
*   **Fix**: Even though `balance` is `Decimal` in the schema, the generated types might still be expecting `number` if the client wasn't fully regenerated or if we need to cast it. However, the correct approach for `Decimal` fields in Prisma is to pass `string` or `Decimal`. We will verify the type definition. If it complains about `number`, it implies the schema change to `Decimal` might need a forced type alignment or simply passing a string/number which Prisma converts.
*   **Action**: Change `new Prisma.Decimal(1.0)` to just `1.0` or `'1.0'`. Prisma handles the conversion to Decimal automatically.

### B. Fix `transactionService.ts`
*   **Problem**: Similar errors in lines 151 and 162.
*   **Fix**: Ensure that when we are calling `increment` or `decrement`, we are passing values compatible with the Prisma Client's generated types. Using `amountDec` (which is a `Prisma.Decimal`) should be correct for a `Decimal` field. If TS complains, it's likely a type definition lag.
*   **Action**: We will use `amount` (string) directly or `parseFloat(amount)` if the client strictly demands numbers, but since we migrated to Decimal, we should use strings to preserve precision.
    *   *Correction*: Since we updated the schema to `Decimal`, we should pass the `Decimal` object or string. The error "Decimal not assignable to number" suggests TypeScript *thinks* the field is still a `number` (Float).
    *   **Crucial Step**: We need to ensure the Prisma Client is fully regenerated and the editor knows about it.

### C. Fix `walletService.ts`
*   **Problem**: `'user.wallet' is possibly 'null'`.
*   **Fix**: Capture `user.wallet` into a local `const wallet` variable after the null check.
    ```typescript
    const wallet = user.wallet;
    // ... use 'wallet.id' instead of 'user.wallet.id' inside the async function
    ```

## 3. Execution Steps

1.  **Regenerate Prisma Client**: Run `npx prisma generate` to ensure the TypeScript definitions match the new `Decimal` schema. This is the most likely root cause of the "Decimal vs Number" errors.
2.  **Fix `walletService.ts`**: Apply the local variable capture pattern.
3.  **Fix `assetService.ts`**: Simplify the assignment to use primitives if the error persists.
4.  **Fix `transactionService.ts`**: Verify types after regeneration.

## 4. Verification

*   Run `npx tsc --noEmit` (or check IDE diagnostics) to confirm errors are gone.
