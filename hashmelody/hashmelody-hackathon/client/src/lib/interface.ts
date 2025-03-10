export interface UploadRow {
  id: number;
  title?: string;
  genres?: string; // or whatever type you used
  artist?: string;
  cover?: string; // if you store a cover image URL
  duration_milliseconds?: number;
  // add any other columns from your upload table
}

export interface DirectRequestData {
  prompt: string;
  userId: string;
  walletAddress?: string;
  chainType?: string;
  uploadId?: number;
  requestId?: string;
}
