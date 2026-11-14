"use client";

import dynamic from "next/dynamic";
import { BuilderLoading } from "./builder-page";

/**
 * Loads the builder in the browser only: `grapesjs` touches `window` at import time, so the
 * whole editor bundle is kept out of the server render and out of the dashboard's chunks.
 */
export const BuilderPageLoader = dynamic(
  () => import("./builder-page").then((m) => m.BuilderPage),
  { ssr: false, loading: () => <BuilderLoading /> }
);
