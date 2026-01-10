import { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  role: 'parent' | 'child';
  avatar: string;
  points?: number;
  email: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  points: number;
  assigneeId: string;
  assignerId: string;
  status: 'todo' | 'completed' | 'approved';
  createdAt: Timestamp;
  dueDate: Timestamp;
};

export type Reward = {
  id: string;
  name: string;
  description: string;
  costInPoints: number;
  imageUrl: string;
};

export type Redemption = {
  id: string;
  userId: string;
  rewardId?: string;
  description: string;
  pointsRedeemed: number;
  redemptionDate: Timestamp;
};

// Mock data is no longer needed as we will fetch from Firestore.
// You can remove the exported arrays if you wish, or keep them for reference.

export const users: User[] = [];
export const tasks: Task[] = [];
export const rewards: Reward[] = [];
export const pointHistory: Redemption[] = [];
