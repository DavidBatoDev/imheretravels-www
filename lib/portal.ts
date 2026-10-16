/**
 * Entry points to the customer portal (portal WF 1a). Off unless
 * NEXT_PUBLIC_PORTAL_SIGNIN_ENABLED=true, so this can merge before the portal
 * launches without visitors seeing a Sign in button.
 */
export const PORTAL_SIGNIN_ENABLED = process.env.NEXT_PUBLIC_PORTAL_SIGNIN_ENABLED === "true";

/** The portal is a separate app under /account, so links are plain <a>s. */
export const PORTAL_SIGNIN_URL = process.env.NEXT_PUBLIC_PORTAL_SIGNIN_URL || "/account/sign-in";
