export const NeynarPageImageAspectRatioEnum = {
  Square: "1:1",
  Wide: "1.91:1",
} as const;

export const NeynarPageButtonActionTypeEnum = {
  Link: "link",
  Post: "post",
  Mint: "mint",
} as const;


export const MIN_PRICE_IN_SOL = 0.001; // 0.001 SOL
export const MIN_PRICE_IN_LAMPORTS = 1_000_000; // 0.001 SOL in lamports (1 SOL = 1,000,000,000 lamports)
