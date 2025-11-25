import { create } from 'zustand';

export type NotificationCategory = 'task' | 'news' | 'system';

export type NotificationLink = {
  route: string;
  params?: Record<string, string>;
};

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  category: NotificationCategory;
  link?: NotificationLink;
  newsContent?: string;
}

type NotificationsStore = {
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read'> & { id?: string }) => void;
};

const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const now = Date.now();

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-task-review',
    title: 'Weekly review is delayed',
    message: 'Task "Plan sprint outline" needs your attention.',
    createdAt: new Date(now - 20 * 60 * 1000),
    read: false,
    category: 'task',
    link: {
      route: '/(tabs)/(planner)/(tabs)/goals',
      params: { focus: 'task-weekly-review' },
    },
  },
  {
    id: 'notif-news-ai',
    title: 'AI assistant learns new tips',
    message: 'Swipe to read the latest research digest.',
    createdAt: new Date(now - 55 * 60 * 1000),
    read: false,
    category: 'news',
    newsContent:
      'Our in-app AI can now summarize your weekly financial insights and highlight anomalies with richer context. Try it from the Insights tab today.',
  },
  {
    id: 'notif-system-backup',
    title: 'Backup completed',
    message: 'Your encrypted cloud backup finished successfully.',
    createdAt: new Date(now - 3 * 60 * 60 * 1000),
    read: true,
    category: 'system',
  },
  {
    id: 'notif-task-habit',
    title: 'Habit streak reached day 21',
    message: 'Keep logging your reflective journaling routine.',
    createdAt: new Date(now - 24 * 60 * 60 * 1000),
    read: false,
    category: 'task',
    link: {
      route: '/(tabs)/(planner)/(tabs)/habits',
      params: { focus: 'habit-reflection' },
    },
  },
];

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          read: false,
          id: notification.id ?? generateId(),
          ...notification,
        },
        ...state.notifications,
      ],
    })),
}));
