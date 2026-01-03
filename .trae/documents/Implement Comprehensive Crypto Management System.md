# Bottom Navigation Redesign Plan

I will redesign the bottom navigation bar to be fixed, responsive, accessible, and aesthetically pleasing with smooth animations. I will also ensure page content is not obscured.

## 1. Content Padding Update (`webapp/src/App.tsx`)

* **Wrap Routes**: Enclose the `<Routes>` component in a container with `pb-24` (padding-bottom \~96px) to ensure the last element on any page is always visible above the fixed navigation bar.

## 2. Bottom Navigation Redesign (`webapp/src/components/BottomNav.tsx`)

* **Structure**: Use a `<nav>` element with proper ARIA roles (`role="navigation"`, `aria-label`, `aria-current`).

* **Styling**:

  * **Background**: Use a semi-transparent dark background (`bg-[#0F172A]/90`) with a heavy blur (`backdrop-blur-xl`) for a modern glassmorphism effect.

  * **Border**: Add a subtle top border for separation.

  * **Safe Area**: Explicitly use `pb-[env(safe-area-inset-bottom)]` to handle iPhone Home indicator areas.

* **Interactivity**:

  * **Active Indicator**: Implement a layout-aware animated indicator (using `framer-motion`'s `layoutId`) that slides or appears above the active tab.

  * **Icon Animation**: Slight lift (`translate-y`) and color change for the active icon.

  * **Touch Targets**: Ensure full-height click areas for easier touch interaction.

## 3. Verification

* **Visual**: Check that the bar stays at the bottom and looks good.

* **Functional**: Verify navigation works and the active state updates correctly.

* **Layout**: Ensure scrolling to the very bottom of a long page (like History) shows the last item clearly above the nav bar.

