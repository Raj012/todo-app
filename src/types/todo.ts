export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  targetTime?: Date;
  completedAt?: Date;
}

export interface UserStats {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  lastCompletedDate?: Date;
}