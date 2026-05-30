export interface Queue {
    key: string;
    attractionName: string;
    status: "Open" | "Closed" | "Paused";
    statusMessage: string;
    attractionId: number;
    currentGroupNumber: number | null;
    nextGroupNumber: number | null;
    nextGroupActualTime: string | null;
    totalPeopleInQueue: number;
    maxPartySize: number;
    openingTime: string;
    closingTime: string;
    vqOpeningTime: string;
    vqClosingTime: string;
    lastGroupTime: string | null;
    pauseEndTime: string | null;
    estimatedTimes: EstimatedTime[];
    upcomingGroups: UpcomingGroup[];
}

export interface EstimatedTime {
    partySize: number;
    time: string;
}

export interface UpcomingGroup {
    groupNumber: number;
    peopleCount: number;
    estimatedTime: string;
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
    status: "Created" | "Confirmed" | "Used" | "Cancelled";
    usedTimes: number;
    messageType: string;
    cancelledReason: string | null;
}

export interface JoinRequest {
    queueKey: string;
    partySize: number;
    messageIdentifier: string;
}

export type StatusResponse = {
    status: "waiting";
} | Ticket;