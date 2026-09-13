import { createAction } from '@reduxjs/toolkit';

/**
 * Defined outside authSlice so apiSlice can dispatch it on a forced logout
 * (e.g. refresh-token failure) without creating a circular import between
 * apiSlice.ts and authSlice.ts.
 */
export const signOut = createAction('auth/signOut');
