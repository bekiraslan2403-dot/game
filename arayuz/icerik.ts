// Derlenmiş içerik paketi. uretilen/icerik.json, "npm run derle" sırasında içerik derleyiciden üretilir.
import ham from "../uretilen/icerik.json";
import type { IcerikPaketi } from "../cekirdek/icerik.ts";

export const ICERIK = ham as unknown as IcerikPaketi;
