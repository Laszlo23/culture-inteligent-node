/**
 * Parse spoken phrases into Hearing Mode actions.
 */

export type HearingCommand =
  | 'status'
  | 'academy'
  | 'club'
  | 'spread'
  | 'broadcast'
  | 'map'
  | 'next'
  | 'repeat'
  | 'stop'
  | 'help'
  | 'exit'
  | 'start'
  | 'option_1'
  | 'option_2'
  | 'option_3'
  | 'zen'
  | 'mind'
  | 'machine'
  | 'focus'
  | 'metrics'
  | 'unknown';

const RULES: Array<{ cmd: HearingCommand; patterns: RegExp[] }> = [
  {
    cmd: 'exit',
    patterns: [
      /\b(exit|quit|leave)\b.*\bhear/,
      /\b(stop|end|close)\b.*\bhearing\b/,
      /\bhearing\s+off\b/,
      /\bexit\s+hearing\b/,
    ],
  },
  {
    cmd: 'help',
    patterns: [/\bhelp\b/, /\bwhat\s+can\s+i\s+say\b/, /\bcommands?\b/],
  },
  {
    cmd: 'focus',
    patterns: [/\bfocus\b/, /\bfull\s+focus\b/, /\bdeep\s+work\b/],
  },
  {
    cmd: 'metrics',
    patterns: [/\bmetrics\b/, /\bstats\b/, /\bsnapshot\b/, /\bnumbers\b/],
  },
  {
    cmd: 'zen',
    patterns: [/\bzen\b/, /\bknowledge\s+first\b/, /\bquiet\s+mode\b/],
  },
  {
    cmd: 'mind',
    patterns: [/\bmind\b/, /\bhold\b.*\bknowledge\b/, /\bsit\s+with\b/],
  },
  {
    cmd: 'machine',
    patterns: [
      /\bmachine\b/,
      /\bconvert\b/,
      /\bprove\s+it\b/,
      /\bneural\s+snap\b/,
      /\bto\s+fuel\b/,
    ],
  },
  {
    cmd: 'status',
    // After machine rules so "to fuel" / "convert" win first
    patterns: [/\bstatus\b/, /\bfuel\b/, /\benergy\b/, /\bhow\s+am\s+i\b/, /\bnode\b/],
  },
  {
    cmd: 'academy',
    patterns: [
      /\bacademy\b/,
      /\bfirst\s+spark\b/,
      /\battention\b/,
      /\blearn\b/,
      /\blab\b/,
      /\bsession\b/,
    ],
  },
  {
    cmd: 'club',
    patterns: [/\bclub\b/, /\boath\b/, /\bculture\s+club\b/],
  },
  {
    cmd: 'spread',
    patterns: [/\bspread\b/, /\binvite\b/, /\bpass\s+it\s+on\b/],
  },
  {
    cmd: 'broadcast',
    patterns: [/\bbroadcast\b/, /\bshare\s+(post|link)\b/, /\bcopy\s+post\b/],
  },
  {
    cmd: 'map',
    patterns: [/\bmap\b/, /\bfacility\b/, /\bhome\b/, /\bschematic\b/],
  },
  {
    cmd: 'next',
    patterns: [/\bnext\b/, /\bcontinue\b/, /\bgo\s+on\b/],
  },
  {
    cmd: 'repeat',
    patterns: [/\brepeat\b/, /\bagain\b/, /\bsay\s+that\s+again\b/],
  },
  {
    cmd: 'stop',
    patterns: [/\bstop\b/, /\bsilence\b/, /\bquiet\b/, /\bshut\s+up\b/],
  },
  {
    cmd: 'start',
    patterns: [/\bstart\b/, /\bbegin\b/, /\bgo\b/],
  },
  {
    cmd: 'option_1',
    patterns: [/\b(one|1|first|option\s*1|a)\b/],
  },
  {
    cmd: 'option_2',
    patterns: [/\b(two|2|second|option\s*2|b)\b/],
  },
  {
    cmd: 'option_3',
    patterns: [/\b(three|3|third|option\s*3|c)\b/],
  },
];

export function parseHearingCommand(transcript: string): HearingCommand {
  const t = transcript.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return 'unknown';

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(t)) return rule.cmd;
    }
  }
  return 'unknown';
}
