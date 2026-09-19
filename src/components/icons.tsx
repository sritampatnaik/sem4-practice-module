"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Atom01Icon,
  Attachment01Icon,
  BookOpen01Icon,
  Brain01Icon,
  BubbleChatIcon,
  CalculatorIcon,
  Cancel01Icon,
  Cards01Icon,
  ChartHistogramIcon,
  ChatAdd01Icon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  FlipLeftIcon,
  Globe02Icon,
  Layers01Icon,
  LockPasswordIcon,
  Login01Icon,
  Logout01Icon,
  Mail01Icon,
  Mic01Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  QuestionIcon,
  Quiz05Icon,
  ReloadIcon,
  ReplyIcon,
  Search01Icon,
  School01Icon,
  SentIcon,
  SparklesIcon,
  StopIcon,
  StudentIcon,
  TeachingIcon,
  TestTube01Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Tick02Icon,
  UserAdd01Icon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";

/** One Hugeicons stroke-rounded set for the tutor. Do not add a second library. */
export const icons = {
  chat: BubbleChatIcon,
  newChat: ChatAdd01Icon,
  reply: ReplyIcon,
  quiz: Quiz05Icon,
  testing: Quiz05Icon,
  flashcards: Cards01Icon,
  flip: FlipLeftIcon,
  math: CalculatorIcon,
  physics: Atom01Icon,
  chemistry: TestTube01Icon,
  syllabus: BookOpen01Icon,
  tutor: TeachingIcon,
  school: School01Icon,
  evals: ChartHistogramIcon,
  datasets: Layers01Icon,
  evaluators: CheckListIcon,
  student: StudentIcon,
  signedIn: UserCircle02Icon,
  guest: StudentIcon,
  signIn: Login01Icon,
  signOut: Logout01Icon,
  createAccount: UserAdd01Icon,
  mail: Mail01Icon,
  password: LockPasswordIcon,
  think: Brain01Icon,
  sparkle: SparklesIcon,
  orchestration: SparklesIcon,
  write: PencilEdit01Icon,
  run: SentIcon,
  read: BookOpen01Icon,
  search: Search01Icon,
  attach: Attachment01Icon,
  layers: Layers01Icon,
  globe: Globe02Icon,
  plus: PlusSignIcon,
  more: MoreHorizontalIcon,
  mic: Mic01Icon,
  send: ArrowUp01Icon,
  stop: StopIcon,
  tick: Tick02Icon,
  check: CheckmarkCircle02Icon,
  cancel: Cancel01Icon,
  question: QuestionIcon,
  arrowUp: ArrowUp01Icon,
  arrowDown: ArrowDown01Icon,
  arrowLeft: ArrowLeft01Icon,
  arrowRight: ArrowRight01Icon,
  copy: Copy01Icon,
  reload: ReloadIcon,
  thumbsUp: ThumbsUpIcon,
  thumbsDown: ThumbsDownIcon,
  history: Clock01Icon,
} as const;

export type MetsIconName = keyof typeof icons;

export function Icon({
  icon,
  size = 16,
  strokeWidth = 1.8,
  className,
  title,
}: {
  icon: IconSvgElement | MetsIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
}) {
  const glyph = typeof icon === "string" ? icons[icon] : icon;
  return (
    <HugeiconsIcon
      icon={glyph}
      size={size}
      color="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    />
  );
}
