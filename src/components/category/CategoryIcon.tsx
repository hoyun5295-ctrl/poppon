import {
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Home,
  Smartphone,
  Plane,
  Film,
  BookOpen,
  HeartPulse,
  PawPrint,
  Car,
  CreditCard,
  Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  fashion: Shirt,
  beauty: Sparkles,
  food: UtensilsCrossed,
  living: Home,
  digital: Smartphone,
  travel: Plane,
  culture: Film,
  kids: BookOpen,
  health: HeartPulse,
  pets: PawPrint,
  auto: Car,
  finance: CreditCard,
};

interface CategoryIconProps {
  slug: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function CategoryIcon({
  slug,
  size = 18,
  color = 'currentColor',
  strokeWidth = 2,
  className,
}: CategoryIconProps) {
  const IconComp = ICON_MAP[slug] || Tag;
  return <IconComp size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}
