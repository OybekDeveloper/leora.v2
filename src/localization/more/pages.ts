import { useLocalization } from '@/localization/useLocalization';
import { SupportedLanguage } from '@/stores/useSettingsStore';

type SectionInfo = { title: string; subtitle: string };

export type AboutLocalization = {
  sections: {
    appInfo: string;
    information: string;
    legal: string;
  };
  app: {
    name: string;
    tagline: string;
    version: string;
    description: string;
  };
  infoRows: { label: string; value: string }[];
  legalLinks: string[];
};

export type DataLocalization = {
  sections: Record<'backup' | 'export' | 'storage', SectionInfo>;
  rows: Record<
    'backup' | 'export' | 'storage',
    { title: string; subtitle: string; action: string }[]
  >;
  summary: {
    backup: { label: string; value: string }[];
    storage: { label: string; value: string }[];
  };
};

export type IntegrationLocalization = {
  sections: {
    key: 'calendars' | 'banks' | 'applications' | 'devices';
    title: string;
    activeLabel: string;
    items: {
      key: string;
      name: string;
      meta?: string;
      statusLabel: string;
      statusTone?: 'positive' | 'warning' | 'neutral';
    }[];
  }[];
  footerCta: string;
};

export type SupportLocalization = {
  sections: Record<'popular' | 'manuals' | 'videos' | 'contact', SectionInfo>;
  popularQuestions: string[];
  manuals: { title: string; duration: string }[];
  videos: { title: string; duration: string; isChannel?: boolean }[];
  channels: {
    title: string;
    subtitle?: string;
    cta?: string;
    tone?: 'positive' | 'warning';
  }[];
  footer: {
    report: string;
    suggest: string;
  };
};

export type MorePagesLocalization = {
  about: AboutLocalization;
  data: DataLocalization;
  integrations: IntegrationLocalization;
  support: SupportLocalization;
};

const EN_PAGES: MorePagesLocalization = {
  about: {
    sections: {
      appInfo: 'App information',
      information: 'Information',
      legal: 'Legal information',
    },
    app: {
      name: 'LEORA',
      tagline: 'LEORA Premium',
      version: 'Version: 1.0.0 (Build 145)',
      description: 'Your Personal AI Companion for Financial Freedom',
    },
    infoRows: [
      { label: 'Application size', value: '125 MB' },
      { label: 'Data size', value: '47 MB' },
      { label: 'Cache size', value: '23 MB' },
      { label: 'Last update', value: '3 days ago' },
    ],
    legalLinks: ['Terms of Use', 'Privacy Policy', 'Open Source Licenses', 'Copyrights'],
  },
  data: {
    sections: {
      backup: {
        title: 'Backup & restore',
        subtitle: 'Keep snapshots of your workspace and bring them back when needed.',
      },
      export: {
        title: 'Export data',
        subtitle: 'Generate copies of your information for reports or external tools.',
      },
      storage: {
        title: 'Storage & cache',
        subtitle: 'Manage local data, cache, and storage usage across devices.',
      },
    },
    rows: {
      backup: [
        { title: 'Create manual backup', subtitle: 'Capture a fresh snapshot of your workspace.', action: 'Start' },
        { title: 'Restore backup', subtitle: 'Select from stored snapshots.', action: 'Choose file' },
      ],
      export: [
        { title: 'Export transactions', subtitle: 'Generate CSV or XLSX reports.', action: 'Configure' },
        {
          title: 'Export archive',
          subtitle: 'Bundle everything into a password-protected archive.',
          action: 'Generate',
        },
        {
          title: 'API access',
          subtitle: 'Create or manage personal access tokens.',
          action: 'Manage',
        },
      ],
      storage: [
        { title: 'Local cache', subtitle: 'Current size 45 MB on this device.', action: 'Clear' },
        { title: 'Temporary files', subtitle: 'Delete generated previews and logs.', action: 'Review' },
        { title: 'Storage preferences', subtitle: 'Decide what gets cached locally.', action: 'Adjust' },
      ],
    },
    summary: {
      backup: [
        { label: 'Last automatic backup', value: '3 days ago' },
        { label: 'Stored snapshots', value: '4 snapshots' },
      ],
      storage: [
        { label: 'Synced workspace size', value: '128 MB' },
        { label: 'Downloads this month', value: '6 exports' },
      ],
    },
  },
  integrations: {
    sections: [
      {
        key: 'calendars',
        title: 'Calendars',
        activeLabel: 'Active 2 / 3',
        items: [
          { key: 'google-calendar', name: 'Google Calendar', meta: 'Last sync: 15 mins ago', statusLabel: 'Settings', statusTone: 'positive' },
          { key: 'apple-calendar', name: 'Apple calendar', meta: 'Last sync: 1 hour ago', statusLabel: 'Settings', statusTone: 'positive' },
          { key: 'outlook-calendar', name: 'Outlook', statusLabel: 'Connect', statusTone: 'neutral' },
        ],
      },
      {
        key: 'banks',
        title: 'Banks',
        activeLabel: 'Active 0 / 4',
        items: [
          { key: 'uzcard', name: 'Uzcard', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'humo', name: 'Humo', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'kapitalbank', name: 'Kapitalbank', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'ipotekabank', name: 'Ipoteka Bank', statusLabel: 'Connect', statusTone: 'neutral' },
        ],
      },
      {
        key: 'applications',
        title: 'Applications',
        activeLabel: 'Active 2 / 8',
        items: [
          { key: 'telegram', name: 'Telegram', statusLabel: 'Notification on', statusTone: 'positive' },
          { key: 'whatsapp', name: 'WhatsApp', statusLabel: 'Notification on', statusTone: 'positive' },
          { key: 'slack', name: 'Slack', statusLabel: 'Status updating', statusTone: 'warning' },
          { key: 'notion', name: 'Notion', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'todoist', name: 'Todoist', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'spotify', name: 'Spotify', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'strava', name: 'Strava', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'myfitnesspal', name: 'MyFitnessPal', statusLabel: 'Connect', statusTone: 'neutral' },
        ],
      },
      {
        key: 'devices',
        title: 'Devices',
        activeLabel: 'Active 1 / 2',
        items: [
          { key: 'apple-watch', name: 'Apple Watch', meta: 'Model: Series 8', statusLabel: 'Settings', statusTone: 'positive' },
          { key: 'wear-os', name: 'Wear OS', statusLabel: 'Connect', statusTone: 'neutral' },
        ],
      },
    ],
    footerCta: 'Find other integrations',
  },
  support: {
    sections: {
      popular: {
        title: 'Popular questions',
        subtitle: 'Your teammates looked into these recently',
      },
      manuals: {
        title: 'Manuals',
        subtitle: 'Step-by-step guides to master LEORA',
      },
      videos: {
        title: 'Video tutorials',
        subtitle: 'Learn faster with concise walkthroughs',
      },
      contact: {
        title: 'Contact support',
        subtitle: 'Reach out and we will be right with you',
      },
    },
    popularQuestions: [
      'How to add transaction with voice?',
      'What Premium offers?',
      'How focus mode works?',
      'Can we export data?',
      'How to change the currency?',
    ],
    manuals: [
      { title: 'Quick start', duration: '5 mins' },
      { title: 'Financials controlling', duration: '9 mins' },
      { title: 'Planning and goals', duration: '11 mins' },
      { title: 'Habit forming', duration: '7 mins' },
      { title: 'AI functions', duration: '6 mins' },
      { title: 'Professionals guides', duration: '12 mins' },
    ],
    videos: [
      { title: 'First steps into LEORA', duration: '3:45' },
      { title: 'Voice typing', duration: '2:15' },
      { title: 'Budget settings', duration: '4:30' },
      { title: 'Focus Mode', duration: '3:00' },
      { title: 'Youtube channel', duration: '', isChannel: true },
    ],
    channels: [
      { title: 'Chat support', subtitle: 'Average response time: 5 min', cta: 'Start', tone: 'positive' },
      { title: 'Email support@leora.app', cta: 'Email' },
      { title: 'Telegram @leora_support', cta: 'Open' },
      { title: 'Premium support', subtitle: '< 1 hour', cta: 'Priority', tone: 'positive' },
      { title: 'Free support', subtitle: '< 24 hours', cta: 'Standard', tone: 'warning' },
    ],
    footer: {
      report: 'Report error',
      suggest: 'Suggest a feature',
    },
  },
};

const buildPagesLocalization = (): Record<SupportedLanguage, MorePagesLocalization> => {
  const languages: SupportedLanguage[] = ['en', 'ru', 'uz', 'ar', 'tr'];
  return languages.reduce<Record<SupportedLanguage, MorePagesLocalization>>((acc, lang) => {
    acc[lang] = EN_PAGES;
    return acc;
  }, {} as Record<SupportedLanguage, MorePagesLocalization>);
};

const PAGES_LOCALIZATION = buildPagesLocalization();

export const useMorePagesLocalization = () => {
  const { language } = useLocalization();
  return PAGES_LOCALIZATION[language] ?? PAGES_LOCALIZATION.en;
};
