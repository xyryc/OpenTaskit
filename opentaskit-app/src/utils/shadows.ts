import { ViewStyle } from 'react-native';

/**
 * ============================================================================
 * OPENTASKIT SHADOW CONFIGURATION & GUIDE
 * ============================================================================
 *
 * To adjust shadow strength across the app, edit the values in the `shadows`
 * object below.
 *
 * PARAMETER GUIDE:
 * - `shadowColor`: Base shadow color. Always use `#0C1417` (theme ink) for a
 *   natural look, never pitch black (`#000000`).
 * - `shadowOpacity`: Shadow intensity.
 *     • 0.00 = Flat (no shadow, clean border only)
 *     • 0.02 = Ultra-minimal & soft (recommended for modern UI)
 *     • 0.04 = Subtle ambient depth
 *     • 0.08+ = Prominent floating lift
 * - `shadowRadius`: Blur spread. Higher values (6–16) give a smoother, softer edge.
 * - `shadowOffset`: Direction. `{ width: 0, height: 1 }` is soft downward depth.
 * - `elevation`: Android-only drop shadow.
 *     • Set to `0` for completely flat cards (prevents Android's dark gray OS shadow).
 *     • Set to `1` or `2` for subtle Android native lift.
 */

export interface ShadowTheme {
  /** Task cards (Discover list, Home carousel, Category task lists) */
  card: ViewStyle;
  /** Floating preview cards (e.g. Map task preview popover, elevated banners) */
  raised: ViewStyle;
  /** Small controls, search bar, map zoom/recenter buttons, filter pills */
  subtle: ViewStyle;
  /** Bottom sheets & modal dialogues */
  sheet: ViewStyle;
  /** Primary brand blue glowing buttons (e.g. Center "+" tab bar button) */
  brandFloat: ViewStyle;
}

export const shadows: ShadowTheme = {
  // --------------------------------------------------------------------------
  // 1. CARD SHADOW
  // --------------------------------------------------------------------------
  // RESPONSIBLE FOR:
  // - TaskCard in Discover list (src/components/task/TaskCard.tsx)
  // - TaskCard in Home feed & Category feeds
  // - TaskCard carousel on Home screen
  // - Provider cards in Category provider lists
  //
  // TIP: Set `elevation: 0` and `shadowOpacity: 0` if you want 100% flat cards
  // that rely purely on their hairline border (#E2E7E9).
  // --------------------------------------------------------------------------
  card: {
    shadowColor: '#0C1417',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02, // Ultra-minimal soft ambient depth (reduce to 0 for flat)
    shadowRadius: 6,
    elevation: 0, // 0 removes Android's harsh default drop-shadow edge
  },

  // --------------------------------------------------------------------------
  // 2. RAISED / FLOATING PREVIEW SHADOW
  // --------------------------------------------------------------------------
  // RESPONSIBLE FOR:
  // - Floating task card over the Map in Discover (when tapping a price pin)
  // - Confirmation alert dialogs (src/components/ui/Overlay.tsx)
  // - Popover tooltips and dropdown menus
  // --------------------------------------------------------------------------
  raised: {
    shadowColor: '#0C1417',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },

  // --------------------------------------------------------------------------
  // 3. SUBTLE CONTROLS SHADOW
  // --------------------------------------------------------------------------
  // RESPONSIBLE FOR:
  // - Map zoom in/out & recenter buttons (src/components/task/DiscoverMap.tsx)
  // - "Tap a price pin to preview" helper pill over the map
  // - Segmented control active tab pill (List / Map toggle)
  // - Filter buttons & search inputs
  // --------------------------------------------------------------------------
  subtle: {
    shadowColor: '#0C1417',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0,
  },

  // --------------------------------------------------------------------------
  // 4. BOTTOM SHEET & MODAL SHADOW
  // --------------------------------------------------------------------------
  // RESPONSIBLE FOR:
  // - Filter sheet modal (src/components/task/FilterSheet.tsx)
  // - BottomSheet components across the app (Make offer, Report problem, etc.)
  // --------------------------------------------------------------------------
  sheet: {
    shadowColor: '#0C1417',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 6,
  },

  // --------------------------------------------------------------------------
  // 5. BRAND BLUE FLOATING ACCENT GLOW
  // --------------------------------------------------------------------------
  // RESPONSIBLE FOR:
  // - Center floating "+" create task button in Bottom Tab Bar
  // - Active primary CTA buttons with blue glow
  // --------------------------------------------------------------------------
  brandFloat: {
    shadowColor: '#0094F7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 2,
  },
};
