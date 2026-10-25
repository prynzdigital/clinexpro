import type { Localized } from "@/lib/i18n";

// Customer testimonials as published on clinexpro.net (English originals;
// French versions are translations).
export const TESTIMONIALS: { name: string; role: Localized; quote: Localized }[] = [
  {
    name: "Mrs. Chaya Moorally",
    role: { en: "Human Resources", fr: "Ressources humaines" },
    quote: {
      en: "Clinex Pro has been a game-changer for our office space! They're reliable, professional, and thorough, leaving our workspace spotless every time. We're thrilled with the results.",
      fr: "Clinex Pro a tout changé pour nos bureaux ! Une équipe fiable, professionnelle et minutieuse, qui laisse notre espace de travail impeccable à chaque fois. Nous sommes ravis du résultat.",
    },
  },
  {
    name: "Samanta Pierre",
    role: { en: "Store Manager", fr: "Gérante de magasin" },
    quote: {
      en: "Our retail store looks amazing after each visit from Clinex Pro. The team is professional, friendly, and attentive to every little detail.",
      fr: "Notre magasin est superbe après chaque passage de Clinex Pro. L'équipe est professionnelle, sympathique et attentive au moindre détail.",
    },
  },
  {
    name: "Ashvin Ramchurn",
    role: { en: "Business Owner", fr: "Chef d'entreprise" },
    quote: {
      en: "I love coming home to a fresh and clean house. Clinex Pro paid attention to the smallest details, making our home feel cozy and inviting.",
      fr: "J'adore rentrer dans une maison fraîche et propre. Clinex Pro a soigné les moindres détails, rendant notre maison chaleureuse et accueillante.",
    },
  },
];
