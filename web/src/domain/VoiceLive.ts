import type { VoiceOccupancyRoom } from "./VoiceRoom";

export type VoiceLiveSubscription = {
  hubUrl: string;
  topic: string;
  token: string;
};

export type VoiceLiveEvent = {
  type: "occupancy";
  room: VoiceOccupancyRoom;
};

export type VoiceLiveStream = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
};
