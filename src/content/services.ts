import type { Localized } from "@/lib/i18n";

export type ServiceContent = {
  slug: string;
  category: "home" | "business";
  /** true → instant price + online booking; false → enquiry and site visit. */
  bookable: boolean;
  icon: "home" | "sparkle" | "person" | "sofa" | "water" | "office" | "hotel";
  name: Localized;
  tagline: Localized;
  intro: Localized;
  includes: Localized<string[]>;
  faq: Localized<{ q: string; a: string }[]>;
  /** Room-by-room breakdown (from clinexpro.net), shown on the service page. */
  rooms?: { icon: "home" | "sparkle" | "sofa" | "water" | "person"; title: Localized; body: Localized }[];
};

export const SERVICES: ServiceContent[] = [
  {
    slug: "home-cleaning",
    category: "home",
    bookable: true,
    icon: "home",
    name: { en: "Home cleaning", fr: "Ménage à domicile" },
    tagline: {
      en: "A spotless home every week, fortnight or month.",
      fr: "Une maison impeccable chaque semaine, quinzaine ou mois.",
    },
    intro: {
      en: "Our trained cleaners take care of the kitchen, bathrooms, bedrooms and living areas so you get your time back. Book once, or set up a recurring plan and save up to 15%.",
      fr: "Nos agents formés s'occupent de la cuisine, des salles de bain, des chambres et des pièces de vie pour vous libérer du temps. Réservez une fois, ou choisissez un forfait régulier et économisez jusqu'à 15 %.",
    },
    includes: {
      en: [
        "Kitchen surfaces, sink and appliance exteriors",
        "Bathrooms scrubbed and disinfected",
        "Dusting, vacuuming and mopping throughout",
        "Beds made and rooms tidied",
        "Eco-friendly, family-safe products",
      ],
      fr: [
        "Plans de travail, évier et extérieur des appareils",
        "Salles de bain récurées et désinfectées",
        "Dépoussiérage, aspiration et lavage des sols",
        "Lits faits et pièces rangées",
        "Produits écologiques, sans danger pour la famille",
      ],
    },
    faq: {
      en: [
        { q: "Do I need to be home?", a: "No. Many clients leave a key or access code; we note it securely on your booking." },
        { q: "Do you bring the products and equipment?", a: "Yes. Our team arrives with eco-friendly products and professional equipment." },
      ],
      fr: [
        { q: "Dois-je être présent ?", a: "Non. Beaucoup de clients laissent une clé ou un code d'accès, que nous notons de façon sécurisée." },
        { q: "Apportez-vous les produits et le matériel ?", a: "Oui. Notre équipe arrive avec des produits écologiques et du matériel professionnel." },
      ],
    },
    rooms: [
      {
        icon: "sparkle",
        title: { en: "Kitchen", fr: "Cuisine" },
        body: {
          en: "We sanitise surfaces, clean appliances, degrease stovetops and wipe down cabinets, leaving your kitchen spotless and sparkling.",
          fr: "Nous désinfectons les surfaces, nettoyons les appareils, dégraissons les plaques et essuyons les placards pour une cuisine impeccable.",
        },
      },
      {
        icon: "water",
        title: { en: "Bathroom", fr: "Salle de bain" },
        body: {
          en: "Every corner, from scrubbing tiles and disinfecting surfaces to polishing mirrors and fixtures.",
          fr: "Chaque recoin : carrelage récuré, surfaces désinfectées, miroirs et robinetterie lustrés.",
        },
      },
      {
        icon: "home",
        title: { en: "Living room", fr: "Salon" },
        body: {
          en: "Dusting, vacuuming and polishing surfaces so your living space is clean, comfortable and inviting.",
          fr: "Dépoussiérage, aspiration et lustrage pour un salon propre, confortable et accueillant.",
        },
      },
      {
        icon: "sparkle",
        title: { en: "Windows", fr: "Vitres" },
        body: {
          en: "Inside and out, removing smudges, dust and grime for a streak-free, crystal-clear view.",
          fr: "Intérieur et extérieur : traces, poussière et saleté éliminées pour une vue nette, sans traces.",
        },
      },
      {
        icon: "sofa",
        title: { en: "Sofa & carpet", fr: "Canapé et tapis" },
        body: {
          en: "Lifting out stains, dirt and allergens to bring back their original colour, softness and freshness.",
          fr: "Taches, saleté et allergènes éliminés pour retrouver couleur, douceur et fraîcheur.",
        },
      },
      {
        icon: "person",
        title: { en: "Bedroom", fr: "Chambre" },
        body: {
          en: "Dusting, vacuuming and tidying, with extra attention under beds and behind furniture.",
          fr: "Dépoussiérage, aspiration et rangement, avec une attention particulière sous les lits et derrière les meubles.",
        },
      },
    ],
  },
  {
    slug: "deep-cleaning",
    category: "home",
    bookable: true,
    icon: "sparkle",
    name: { en: "Deep cleaning", fr: "Grand nettoyage" },
    tagline: {
      en: "Every nook and cranny, top to bottom.",
      fr: "Chaque recoin, de fond en comble.",
    },
    intro: {
      en: "Ideal before or after a move, after renovation, or as a seasonal reset. We go beyond routine cleaning: behind furniture, inside cupboards, grout, skirting boards and fittings.",
      fr: "Idéal avant ou après un déménagement, après des travaux ou pour un grand nettoyage de saison. Nous allons au-delà du ménage courant : derrière les meubles, dans les placards, les joints, les plinthes et les luminaires.",
    },
    includes: {
      en: [
        "Everything in home cleaning",
        "Inside cupboards and drawers",
        "Tile grout, limescale and mould treatment",
        "Skirting boards, doors, switches and light fittings",
        "Behind and under movable furniture",
      ],
      fr: [
        "Tout le ménage à domicile",
        "Intérieur des placards et tiroirs",
        "Joints, calcaire et traitement des moisissures",
        "Plinthes, portes, interrupteurs et luminaires",
        "Derrière et sous les meubles déplaçables",
      ],
    },
    faq: {
      en: [
        { q: "How long does a deep clean take?", a: "Usually 5 to 8 hours for a 2–3 bedroom home with a team of two or three." },
        { q: "Can you clean an empty property after moving out?", a: "Yes. End-of-tenancy and move-in cleans are among our most-booked jobs." },
      ],
      fr: [
        { q: "Combien de temps dure un grand nettoyage ?", a: "En général 5 à 8 heures pour une maison de 2 à 3 chambres, avec une équipe de deux ou trois." },
        { q: "Nettoyez-vous un logement vide après un déménagement ?", a: "Oui. Les nettoyages de fin de bail et d'emménagement font partie de nos prestations les plus demandées." },
      ],
    },
  },
  {
    slug: "maid-service",
    category: "home",
    bookable: true,
    icon: "person",
    name: { en: "Maid service", fr: "Service de femme de ménage" },
    tagline: {
      en: "A dedicated housekeeper, by the hour.",
      fr: "Une aide ménagère dédiée, à l'heure.",
    },
    intro: {
      en: "A regular, vetted housekeeper for daily chores: cleaning, laundry, ironing and tidying. You choose the hours; we handle scheduling, cover and quality checks.",
      fr: "Une aide ménagère régulière et vérifiée pour les tâches du quotidien : ménage, linge, repassage et rangement. Vous choisissez les heures ; nous gérons le planning, les remplacements et le contrôle qualité.",
    },
    includes: {
      en: [
        "Same housekeeper each visit where possible",
        "General cleaning and tidying",
        "Laundry and ironing on request",
        "Replacement cover during holidays or sickness",
      ],
      fr: [
        "La même personne à chaque visite dans la mesure du possible",
        "Ménage et rangement",
        "Linge et repassage sur demande",
        "Remplacement pendant les congés ou maladies",
      ],
    },
    faq: {
      en: [
        { q: "Are your housekeepers vetted?", a: "Yes. Every team member is background-checked, trained and employed by Clinex Pro." },
        { q: "What is the minimum booking?", a: "Three hours per visit." },
      ],
      fr: [
        { q: "Vos aides ménagères sont-elles vérifiées ?", a: "Oui. Chaque membre de l'équipe est vérifié, formé et employé par Clinex Pro." },
        { q: "Quelle est la durée minimale ?", a: "Trois heures par visite." },
      ],
    },
  },
  {
    slug: "sofa-carpet",
    category: "home",
    bookable: true,
    icon: "sofa",
    name: { en: "Sofa, carpet & mattress cleaning", fr: "Nettoyage canapés, tapis et matelas" },
    tagline: {
      en: "Lift stains, dust mites and odours.",
      fr: "Taches, acariens et odeurs éliminés.",
    },
    intro: {
      en: "Specialist products and extraction machines clean deep into the fabric, removing stains, allergens and odours while protecting colours and fibres.",
      fr: "Des produits spécialisés et des machines d'extraction nettoient en profondeur, éliminant taches, allergènes et odeurs tout en protégeant les couleurs et les fibres.",
    },
    includes: {
      en: [
        "Fabric test before treatment",
        "Hot-water extraction or dry cleaning to suit the fabric",
        "Stain and odour treatment",
        "Fast-drying finish",
      ],
      fr: [
        "Test du tissu avant traitement",
        "Injection-extraction ou nettoyage à sec selon le tissu",
        "Traitement des taches et des odeurs",
        "Séchage rapide",
      ],
    },
    faq: {
      en: [{ q: "How long until I can use my sofa?", a: "Usually 4 to 6 hours, depending on fabric and ventilation." }],
      fr: [{ q: "Quand puis-je réutiliser mon canapé ?", a: "En général après 4 à 6 heures, selon le tissu et l'aération." }],
    },
  },
  {
    slug: "pressure-washing",
    category: "home",
    bookable: true,
    icon: "water",
    name: { en: "Pressure washing", fr: "Nettoyage haute pression" },
    tagline: {
      en: "Driveways, patios, walls and pool decks like new.",
      fr: "Allées, terrasses, murs et plages de piscine comme neufs.",
    },
    intro: {
      en: "We remove moss, mould, algae and grime from outdoor surfaces, restoring your property's kerb appeal and making walkways safer.",
      fr: "Nous éliminons mousse, moisissures, algues et saleté des surfaces extérieures, pour redonner de l'éclat à votre propriété et sécuriser les passages.",
    },
    includes: {
      en: [
        "Driveways, paths and patios",
        "Exterior walls and boundary walls",
        "Pool surrounds and decking",
        "Surface-safe pressure settings",
      ],
      fr: [
        "Allées, chemins et terrasses",
        "Murs extérieurs et murs d'enceinte",
        "Abords de piscine et decks",
        "Pression adaptée à chaque surface",
      ],
    },
    faq: {
      en: [{ q: "How do I measure the area?", a: "A rough estimate is fine. We confirm on arrival and adjust only if the area differs significantly." }],
      fr: [{ q: "Comment mesurer la surface ?", a: "Une estimation suffit. Nous confirmons sur place et n'ajustons que si l'écart est important." }],
    },
  },
  {
    slug: "office-cleaning",
    category: "business",
    bookable: false,
    icon: "office",
    name: { en: "Office & commercial cleaning", fr: "Nettoyage de bureaux et commerces" },
    tagline: {
      en: "A clean, healthy workplace your team and clients notice.",
      fr: "Un lieu de travail propre et sain, remarqué par vos équipes et vos clients.",
    },
    intro: {
      en: "Daily, weekly or after-hours cleaning for offices, shops, clinics and showrooms, with a dedicated supervisor and a cleaning plan built around your site.",
      fr: "Nettoyage quotidien, hebdomadaire ou en dehors des heures de bureau pour bureaux, commerces, cliniques et showrooms, avec un superviseur dédié et un plan adapté à votre site.",
    },
    includes: {
      en: [
        "Free site visit and tailored cleaning plan",
        "Workstations, meeting rooms, kitchens and washrooms",
        "Consumables restocking on request",
        "Dedicated supervisor and quality checks",
        "Monthly invoicing and service reports",
      ],
      fr: [
        "Visite gratuite et plan de nettoyage sur mesure",
        "Postes de travail, salles de réunion, cuisines et sanitaires",
        "Réapprovisionnement des consommables sur demande",
        "Superviseur dédié et contrôles qualité",
        "Facturation mensuelle et rapports de service",
      ],
    },
    faq: {
      en: [{ q: "Can you clean outside office hours?", a: "Yes. Early-morning, evening and weekend schedules are available." }],
      fr: [{ q: "Pouvez-vous intervenir en dehors des heures de bureau ?", a: "Oui. Nous proposons des créneaux tôt le matin, le soir et le week-end." }],
    },
  },
  {
    slug: "hotel-hospitality",
    category: "business",
    bookable: false,
    icon: "hotel",
    name: { en: "Hotel & hospitality", fr: "Hôtellerie et villas" },
    tagline: {
      en: "Guest-ready rooms, villas and common areas.",
      fr: "Chambres, villas et espaces communs prêts pour vos clients.",
    },
    intro: {
      en: "Housekeeping support for hotels, guest houses and holiday villas: room turnovers, deep cleans between seasons and extra staff for peak periods.",
      fr: "Renfort en entretien pour hôtels, maisons d'hôtes et villas de vacances : préparation des chambres, grands nettoyages entre les saisons et personnel supplémentaire en haute saison.",
    },
    includes: {
      en: [
        "Room and villa turnovers between guests",
        "Common areas, restaurants and pool zones",
        "Seasonal deep cleaning",
        "Flexible staffing for peak periods",
      ],
      fr: [
        "Préparation des chambres et villas entre les séjours",
        "Espaces communs, restaurants et abords de piscine",
        "Grand nettoyage saisonnier",
        "Personnel flexible en haute saison",
      ],
    },
    faq: {
      en: [{ q: "Do you work with holiday rental owners?", a: "Yes. We handle turnovers for villas and apartments across the island." }],
      fr: [{ q: "Travaillez-vous avec les propriétaires de locations saisonnières ?", a: "Oui. Nous assurons la remise en état de villas et appartements dans toute l'île." }],
    },
  },
];

export const getService = (slug: string) => SERVICES.find((s) => s.slug === slug);

/** Photo for each service, from Clinex Pro's own site (public/images/services). */
export const serviceImage = (slug: string) => `/images/services/${slug}.jpg`;
export const BOOKABLE_SERVICES = SERVICES.filter((s) => s.bookable);
