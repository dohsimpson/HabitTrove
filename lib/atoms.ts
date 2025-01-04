import { atom } from "jotai";
import { getDefaultSettings } from "./types";

export const settingsAtom = atom(getDefaultSettings())
