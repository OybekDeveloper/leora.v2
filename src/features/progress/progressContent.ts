import type { ProgressData } from '@/types/home';

export type ProgressMetricKey = keyof ProgressData;

type ThresholdCopy = {
  label: string;
  range: string;
  description: string;
};

type InfoCopy = {
  videoTitle: string;
  videoDescription: string;
  videoUrl: string;
  videoPoster?: string;
  videoMeta?: string;
  videoAuthor?: string;
  paragraphs: string[];
  measurementTitle: string;
  measurementDescription: string;
  thresholds: ThresholdCopy[];
  howItWorksTitle: string;
  howItWorksBullets: string[];
};

export type MetricCopy = {
  title: string;
  subtitle: string;
  banner: {
    title: string;
    description: string;
    cta: string;
    helper: string;
  };
  detailLabels: [string, string, string];
  info: InfoCopy;
};

const PROGRESS_VIDEO = {
  id: '1',
  title: 'Big Buck Bunny',
  thumbnailUrl:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png',
  duration: '8:18',
  uploadTime: 'May 9, 2011',
  views: '24,969,123 views',
  author: 'VLC Media Player',
  videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  description:
    "Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself. When three rodents harass him, he prepares a comical revenge. Licensed under the Creative Commons Attribution license.",
};

export const PROGRESS_METRIC_COPY: Record<ProgressMetricKey, MetricCopy> = {
  tasks: {
    title: 'Task Momentum',
    subtitle: 'Completion rate for the commitments you scheduled today.',
    banner: {
      title: 'Keep your plan fresh',
      description: 'Log task status or reschedule items so completion insights stay accurate.',
      cta: 'Review today\'s tasks',
      helper: 'Synced with Planner → Tasks',
    },
    detailLabels: ['Completion pace', 'Consistency', 'Energy signal'],
    info: {
      videoTitle: PROGRESS_VIDEO.title,
      videoDescription: PROGRESS_VIDEO.description,
      videoUrl: PROGRESS_VIDEO.videoUrl,
      videoPoster: PROGRESS_VIDEO.thumbnailUrl,
      videoMeta: `${PROGRESS_VIDEO.duration} • ${PROGRESS_VIDEO.views} • ${PROGRESS_VIDEO.uploadTime}`,
      videoAuthor: PROGRESS_VIDEO.author,
      paragraphs: [
        'Task Momentum blends the number of completed tasks with their priority and planned effort. When you close an item, we check its weight and whether it was finished on time to estimate your carrying capacity for the rest of the day.',
        'The score also watches for rollover work. If tasks keep slipping, Momentum trends down so you know to lighten the plan or protect a focus block.',
      ],
      measurementTitle: 'How we grade task recovery',
      measurementDescription: 'Momentum is reported on a 0-100 scale that balances completed work, overdue items, and the focus blocks you logged.',
      thresholds: [
        { label: 'Sufficient', range: '> 67%', description: 'You are comfortably ahead of today\'s plan and can take on more if needed.' },
        { label: 'Stable', range: '34 - 66%', description: 'You are holding pace, but one more slip could push tasks into tomorrow.' },
        { label: 'At risk', range: '< 34%', description: 'Too many critical tasks remain. Reprioritize or delegate to avoid spillover.' },
      ],
      howItWorksTitle: 'Signals we monitor',
      howItWorksBullets: [
        'Task completion vs. scheduled load.',
        'High-impact tasks finished in the first half of the day.',
        'Carry-over items from the previous three days.',
        'Focus sessions logged for deep work.',
      ],
    },
  },
  budget: {
    title: 'Budget Health',
    subtitle: 'Tracks how spending aligns with the limits you set.',
    banner: {
      title: 'Reconcile new transactions',
      description: 'Categorize expenses to keep envelope tracking and insights accurate.',
      cta: 'Open budget tracker',
      helper: 'Finance → Budget progress',
    },
    detailLabels: ['Spending pace', 'Essential coverage', 'Runway buffer'],
    info: {
      videoTitle: PROGRESS_VIDEO.title,
      videoDescription: PROGRESS_VIDEO.description,
      videoUrl: PROGRESS_VIDEO.videoUrl,
      videoPoster: PROGRESS_VIDEO.thumbnailUrl,
      videoMeta: `${PROGRESS_VIDEO.duration} • ${PROGRESS_VIDEO.views} • ${PROGRESS_VIDEO.uploadTime}`,
      videoAuthor: PROGRESS_VIDEO.author,
      paragraphs: [
        'Budget Health looks at each envelope you enabled and weighs its burn rate against the pace you set at the start of the month.',
        'We combine that with upcoming recurring payments and recent income to project your available runway. That projection feeds the daily percentage.',
      ],
      measurementTitle: 'How the scale works',
      measurementDescription: 'Budget Health is a 0-100 score that mixes envelope usage, recurring commitments, and cash flow volatility.',
      thresholds: [
        { label: 'Healthy', range: '> 67%', description: 'Spending is comfortably within limits. You are building buffer.' },
        { label: 'Watch', range: '34 - 66%', description: 'Some categories are heating up. Consider trimming non-essentials.' },
        { label: 'Critical', range: '< 34%', description: 'Budgets are overshooting. Shift or pause spending until you recover.' },
      ],
      howItWorksTitle: 'What goes into the score',
      howItWorksBullets: [
        'Envelope burn vs. monthly target.',
        'Uncategorized expenses waiting for review.',
        'Upcoming recurring bills for the next 14 days.',
        'Cash inflow streak vs. plan.',
      ],
    },
  },
  focus: {
    title: 'Focus Readiness',
    subtitle: 'Measures deep work time, rest, and context switching.',
    banner: {
      title: 'Protect a focus block',
      description: 'Schedule an uninterrupted session to lift your readiness score.',
      cta: 'Plan focus session',
      helper: 'Focus Mode -> Sessions',
    },
    detailLabels: ['Deep work ratio', 'Context switching', 'Recovery'],
    info: {
      videoTitle: PROGRESS_VIDEO.title,
      videoDescription: PROGRESS_VIDEO.description,
      videoUrl: PROGRESS_VIDEO.videoUrl,
      videoPoster: PROGRESS_VIDEO.thumbnailUrl,
      videoMeta: `${PROGRESS_VIDEO.duration} • ${PROGRESS_VIDEO.views} • ${PROGRESS_VIDEO.uploadTime}`,
      videoAuthor: PROGRESS_VIDEO.author,
      paragraphs: [
        'Focus Readiness leans on your logged focus sessions plus wearable or manually entered rest data. We estimate how much uninterrupted time you still have in the tank.',
        'Short, frequent sessions or missed breaks push the score down. Stretch blocks followed by deliberate recovery lift it back up.',
      ],
      measurementTitle: 'Reading the dial',
      measurementDescription: 'Readiness is a 0-100 value using session depth, interruptions, and the break cadence you configure.',
      thresholds: [
        { label: 'Prime', range: '> 67%', description: 'Plenty of energy to ship high-impact work.' },
        { label: 'Manage', range: '34 - 66%', description: 'You can keep working, but plan a recharge soon.' },
        { label: 'Rest', range: '< 34%', description: 'You have pushed past the optimal zone. Slow down before burnout.' },
      ],
      howItWorksTitle: 'Inputs we track',
      howItWorksBullets: [
        'Completed vs. planned focus blocks.',
        'Interruptions logged during timers.',
        'Average break length per cycle.',
        'Sleep hours vs. personal baseline.',
      ],
    },
  },
};
