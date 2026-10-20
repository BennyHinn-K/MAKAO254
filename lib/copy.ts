export type HeroVariant = {
  eyebrow: string;
  headline: [string, string];
  subheading: string;
};

export const heroVariants: { A: HeroVariant; B: HeroVariant } = {
  A: {
    eyebrow: 'A softer way to stay in Kenya',
    headline: ['Come home', 'to Kenya.'],
    subheading: "Curated homes for the way you want to feel — from Nairobi's skyline to the coast's first light.",
  },
  B: {
    eyebrow: "Kenya's most considered stays",
    headline: ['Stay somewhere', 'that feels like yours.'],
    subheading: 'Luxury Nairobi apartments, Maasai Mara lodges, Diani beach villas and highland retreats — hosted, verified, booked directly.',
  },
};

export function getHeroVariant(searchParams?: { v?: string }): HeroVariant {
  const v = searchParams?.v?.toLowerCase();
  if (v === 'b') return heroVariants.B;
  return heroVariants.A;
}
