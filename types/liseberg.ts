export interface QueueEstimatedTime {
  partySize: number;
  time: string;
}

export interface UpcomingGroup {
  groupNumber: number;
  peopleCount: number;
  estimatedTime: string;
}

export interface Queue {
  key: string;
  attractionName: string;
  attractionId: number;
  estimatedTimes: QueueEstimatedTime[];
  nextGroupActualTime: string | null;
  pauseEndTime: string | null;
  nextGroupNumber: number;
  openingTime: string;
  closingTime: string;
  vqOpeningTime: string;
  vqClosingTime: string;
  scheduleOpeningTime: string;
  scheduleClosingTime: string;
  maxPartySize: number;
  currentGroupNumber: number;
  upcomingGroups: UpcomingGroup[];
  statusMessage: string;
  status: "Open" | "Closed" | "Paused" | string;
  lastGroupTime: string | null;
  totalPeopleInQueue: number;
}

export interface Ticket {
  attractionName: string;
  originalTime: string;
  actualTime: string;
  queueKey: string;
  partySize: number;
  ticketCode: string;
  isConfirmed: boolean;
  groupNumber: number;
  messageIdentifier: string;
  status: "Confirmed" | "Created" | "Cancelled" | "Redeemed" | string;
  usedTimes: number;
  messageType: string;
  cancelledReason: string | null;
}

export interface JoinRequest {
  queueKey: string;
  partySize: number;
  messageIdentifier: string;
}

export interface SniperConfig {
  id: string;
  queueKey: string;
  partySize: number;
  enabled: boolean;
  createdAt: string;
}