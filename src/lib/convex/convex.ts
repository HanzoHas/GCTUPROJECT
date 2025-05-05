import { ConvexReactClient } from "convex/react";

// Create the Convex client
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string); 