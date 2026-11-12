"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./dict";
import { makeTr, type Tr } from "./translate";

const Ctx = createContext<Tr>(makeTr("en"));

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const tr = useMemo(() => makeTr(locale), [locale]);
  return <Ctx.Provider value={tr}>{children}</Ctx.Provider>;
}

/** For client components. Server components use getT().tr. */
export const useTr = () => useContext(Ctx);
