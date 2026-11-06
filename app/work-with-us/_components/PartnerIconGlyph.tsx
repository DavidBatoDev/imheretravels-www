import { Building2, Megaphone, Users } from "lucide-react";
import type { PartnerIcon } from "@/data/workWithUs";

const ICONS = { users: Users, megaphone: Megaphone, building: Building2 } as const;

export default function PartnerIconGlyph({ icon, className }: { icon: PartnerIcon; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden="true" />;
}
