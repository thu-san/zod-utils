---
"@zod-utils/react-hook-form": patch
"@zod-utils/core": patch
---

Fix unstable useMemo dependency array in flattenFieldSelector

Object.values() with spread operators produced arrays of varying sizes depending on which properties existed, causing React useMemo hooks to incorrectly detect dependency changes. Now returns a fixed 4-element array with explicit properties for stable memoization.
