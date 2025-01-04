import { atom } from "jotai";
import { 
  getDefaultSettings,
  getDefaultHabitsData,
  getDefaultCoinsData,
  getDefaultWishlistData
} from "./types";

export const settingsAtom = atom(getDefaultSettings());
export const habitsAtom = atom(getDefaultHabitsData());
export const coinsAtom = atom(getDefaultCoinsData());
export const wishlistAtom = atom(getDefaultWishlistData());
