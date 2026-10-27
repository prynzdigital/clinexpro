import type { Localized } from "@/lib/i18n";
import { BUSINESS } from "./business";

// Privacy policy text. Written for the Data Protection Act 2017 (Mauritius) and
// the data this website actually collects. Have it reviewed by Clinex Pro's
// legal adviser before launch, and update LAST_UPDATED whenever it changes.

export const PRIVACY_LAST_UPDATED = "2026-10-25";

type Section = { id: string; title: Localized; body: Localized<string[]> };

const office = `${BUSINESS.legalName}, ${BUSINESS.street}, ${BUSINESS.locality}, Mauritius`;

export const PRIVACY_INTRO: Localized<string[]> = {
  en: [
    `This policy explains how ${BUSINESS.legalName} ("Clinex Pro", "we", "us") collects, uses and protects your personal data when you visit clinexpro.net, book a cleaning, request a quote or contact us.`,
    "We process personal data in line with the Data Protection Act 2017 of Mauritius. We only collect what we need to provide and manage our cleaning services, and we never sell your data.",
  ],
  fr: [
    `Cette politique explique comment ${BUSINESS.legalName} (« Clinex Pro », « nous ») collecte, utilise et protège vos données personnelles lorsque vous visitez clinexpro.net, réservez un nettoyage, demandez un devis ou nous contactez.`,
    "Nous traitons les données personnelles conformément au Data Protection Act 2017 de Maurice. Nous ne collectons que ce qui est nécessaire pour fournir et gérer nos services de nettoyage, et nous ne vendons jamais vos données.",
  ],
};

export const PRIVACY_SECTIONS: Section[] = [
  {
    id: "who-we-are",
    title: { en: "1. Who is responsible for your data", fr: "1. Qui est responsable de vos données" },
    body: {
      en: [
        `The controller of your personal data is ${office}. For any privacy question or request, email ${BUSINESS.email} or call ${BUSINESS.phone}.`,
      ],
      fr: [
        `Le responsable du traitement de vos données est ${office}. Pour toute question ou demande relative à vos données, écrivez à ${BUSINESS.email} ou appelez le ${BUSINESS.phone}.`,
      ],
    },
  },
  {
    id: "what-we-collect",
    title: { en: "2. What we collect", fr: "2. Les données que nous collectons" },
    body: {
      en: [
        "Contact details: your name, phone number, email address and, for businesses, your company name.",
        "Service details: the address of the property to be cleaned, your town, the service, size and extras you choose, your preferred date and time, how often you want us to come, and any notes you give us, such as access instructions.",
        "Booking and payment records: your booking reference, price estimate, deposit and payment status. We do not store card numbers on this website.",
        "Communications: messages you send us through our forms, by email, phone or WhatsApp.",
        "Technical data: like any website, our hosting provider records basic connection data (such as IP address, browser type and pages requested) to keep the site secure and working.",
      ],
      fr: [
        "Coordonnées : votre nom, numéro de téléphone, adresse e-mail et, pour les entreprises, le nom de la société.",
        "Détails de la prestation : l'adresse du lieu à nettoyer, votre ville, le service, la taille et les options choisis, la date et l'heure souhaitées, la fréquence, et les remarques que vous nous transmettez, comme les instructions d'accès.",
        "Réservations et paiements : votre référence de réservation, l'estimation, l'acompte et le statut du paiement. Nous ne conservons pas de numéros de carte sur ce site.",
        "Échanges : les messages que vous nous envoyez via nos formulaires, par e-mail, téléphone ou WhatsApp.",
        "Données techniques : comme pour tout site web, notre hébergeur enregistre des données de connexion de base (adresse IP, type de navigateur, pages consultées) pour assurer la sécurité et le bon fonctionnement du site.",
      ],
    },
  },
  {
    id: "how-we-use",
    title: { en: "3. How and why we use it", fr: "3. Comment et pourquoi nous les utilisons" },
    body: {
      en: [
        "To provide the service you asked for: pricing, scheduling, confirming and carrying out your cleaning, and contacting you about it. This is necessary to perform our contract with you or to take steps at your request before entering into it.",
        "To send confirmations, reminders and invoices, and to keep accounting records. Some records are kept because the law requires it.",
        "To answer business enquiries and arrange site visits, based on our legitimate interest in responding to people who contact us.",
        "To improve our service and keep our website secure, based on our legitimate interests.",
        "To send you offers or news, only if you have agreed to it. You can withdraw that consent at any time.",
      ],
      fr: [
        "Pour fournir le service demandé : prix, planification, confirmation et réalisation de votre nettoyage, et pour vous contacter à ce sujet. Ce traitement est nécessaire à l'exécution de notre contrat ou à des mesures précontractuelles prises à votre demande.",
        "Pour envoyer confirmations, rappels et factures, et tenir nos registres comptables. Certains documents sont conservés parce que la loi l'exige.",
        "Pour répondre aux demandes des entreprises et organiser des visites, sur la base de notre intérêt légitime à répondre aux personnes qui nous contactent.",
        "Pour améliorer nos services et sécuriser notre site, sur la base de nos intérêts légitimes.",
        "Pour vous envoyer des offres ou nouvelles, uniquement si vous l'avez accepté. Vous pouvez retirer ce consentement à tout moment.",
      ],
    },
  },
  {
    id: "sharing",
    title: { en: "4. Who we share it with", fr: "4. Avec qui nous les partageons" },
    body: {
      en: [
        "Our own staff who need it to deliver your service, such as the team assigned to your booking.",
        "Service providers who process data for us under contract: website hosting and database providers, email and messaging providers (including WhatsApp) and, once online payment is available, our payment provider. They may only use your data to provide their service to us.",
        "Public authorities, where the law requires us to.",
        "We never sell or rent your personal data.",
      ],
      fr: [
        "Nos employés qui en ont besoin pour réaliser votre prestation, comme l'équipe affectée à votre réservation.",
        "Nos prestataires qui traitent des données pour notre compte sous contrat : hébergement du site et de la base de données, services d'e-mail et de messagerie (dont WhatsApp) et, lorsque le paiement en ligne sera disponible, notre prestataire de paiement. Ils ne peuvent utiliser vos données que pour nous fournir leur service.",
        "Les autorités publiques, lorsque la loi nous y oblige.",
        "Nous ne vendons ni ne louons jamais vos données personnelles.",
      ],
    },
  },
  {
    id: "transfers",
    title: { en: "5. Transfers outside Mauritius", fr: "5. Transferts hors de Maurice" },
    body: {
      en: [
        "Some of our providers, such as our website hosting, store data on servers outside Mauritius. When that happens we use providers that offer appropriate safeguards for your data, as the Data Protection Act 2017 requires.",
      ],
      fr: [
        "Certains de nos prestataires, comme l'hébergement du site, stockent des données sur des serveurs situés hors de Maurice. Dans ce cas, nous faisons appel à des prestataires offrant des garanties appropriées pour vos données, comme l'exige le Data Protection Act 2017.",
      ],
    },
  },
  {
    id: "retention",
    title: { en: "6. How long we keep it", fr: "6. Durée de conservation" },
    body: {
      en: [
        "We keep booking, invoice and payment records for as long as Mauritian tax and accounting law requires. Other customer details are kept while you remain a customer and deleted or anonymised when they are no longer needed. Enquiries that do not lead to a booking are deleted after a reasonable period.",
      ],
      fr: [
        "Nous conservons les réservations, factures et paiements aussi longtemps que l'exige la législation fiscale et comptable mauricienne. Les autres données clients sont conservées tant que vous êtes client, puis supprimées ou anonymisées lorsqu'elles ne sont plus nécessaires. Les demandes qui n'aboutissent pas à une réservation sont supprimées après une période raisonnable.",
      ],
    },
  },
  {
    id: "security",
    title: { en: "7. How we protect it", fr: "7. Comment nous les protégeons" },
    body: {
      en: [
        "The website uses encrypted connections (HTTPS). Access to customer data is limited to authorised staff with personal logins, and access instructions you give us (such as key or gate codes) are only shared with the team assigned to your booking.",
      ],
      fr: [
        "Le site utilise des connexions chiffrées (HTTPS). L'accès aux données clients est réservé au personnel autorisé disposant d'identifiants personnels, et les instructions d'accès que vous nous donnez (clés, codes de portail) ne sont partagées qu'avec l'équipe affectée à votre réservation.",
      ],
    },
  },
  {
    id: "cookies",
    title: { en: "8. Cookies and similar technologies", fr: "8. Cookies et technologies similaires" },
    body: {
      en: [
        "Some things the website needs to work: a secure sign-in cookie for our staff dashboard and staff app, and small settings stored in your browser (for example, if you dismiss the app install banner, or your cookie choice).",
        "Measurement, only if you accept: we use Google Analytics (through Google Tag Manager) to count visits and see which pages and adverts lead to bookings and enquiries. It sets cookies and sends Google technical details such as pages viewed, device type, approximate location and a booking reference with its value. We never send your name, email or phone number. If you decline, these tools are not loaded at all. You can change your choice at any time with “Cookie settings” at the bottom of every page.",
        "Our video is only loaded from YouTube's privacy-enhanced service when you press play.",
      ],
      fr: [
        "Ce dont le site a besoin pour fonctionner : un cookie de connexion sécurisé pour l'espace de notre personnel et l'application du personnel, et de petits réglages enregistrés dans votre navigateur (par exemple si vous fermez la bannière d'installation de l'application, ou votre choix concernant les cookies).",
        "Mesure d'audience, uniquement si vous acceptez : nous utilisons Google Analytics (via Google Tag Manager) pour compter les visites et savoir quelles pages et publicités mènent à des réservations et demandes. Ces outils déposent des cookies et transmettent à Google des informations techniques comme les pages vues, le type d'appareil, une localisation approximative et une référence de réservation avec son montant. Nous n'envoyons jamais votre nom, votre e-mail ni votre téléphone. Si vous refusez, ces outils ne sont pas chargés du tout. Vous pouvez changer d'avis à tout moment avec « Paramètres des cookies » en bas de chaque page.",
        "Notre vidéo n'est chargée depuis le service à confidentialité renforcée de YouTube que lorsque vous appuyez sur lecture.",
      ],
    },
  },
  {
    id: "your-rights",
    title: { en: "9. Your rights", fr: "9. Vos droits" },
    body: {
      en: [
        "Under the Data Protection Act 2017 you can ask us to: give you access to the personal data we hold about you; correct data that is inaccurate or incomplete; delete your data or restrict its use where there is no good reason for us to keep it; and stop using it for direct marketing. You can also object to certain processing and withdraw any consent you have given.",
        `To make a request, email ${BUSINESS.email}. We may ask you to confirm your identity and will reply within the time the law requires.`,
        "If you are not satisfied with our answer, you can complain to the Data Protection Office of Mauritius.",
      ],
      fr: [
        "En vertu du Data Protection Act 2017, vous pouvez nous demander : d'accéder aux données personnelles que nous détenons sur vous ; de corriger des données inexactes ou incomplètes ; de supprimer vos données ou d'en limiter l'utilisation lorsque nous n'avons pas de raison valable de les conserver ; et de cesser de les utiliser à des fins de prospection. Vous pouvez aussi vous opposer à certains traitements et retirer tout consentement donné.",
        `Pour faire une demande, écrivez à ${BUSINESS.email}. Nous pourrons vous demander de confirmer votre identité et répondrons dans les délais prévus par la loi.`,
        "Si notre réponse ne vous satisfait pas, vous pouvez déposer une plainte auprès du Data Protection Office de Maurice.",
      ],
    },
  },
  {
    id: "children",
    title: { en: "10. Children", fr: "10. Enfants" },
    body: {
      en: ["Our services are booked by adults. We do not knowingly collect personal data from children."],
      fr: ["Nos services sont réservés par des adultes. Nous ne collectons pas sciemment de données personnelles concernant des enfants."],
    },
  },
  {
    id: "changes",
    title: { en: "11. Changes to this policy", fr: "11. Modifications de cette politique" },
    body: {
      en: ["We may update this policy from time to time. The date at the top shows when it last changed. Significant changes will be highlighted on our website."],
      fr: ["Nous pouvons mettre à jour cette politique. La date en haut de page indique sa dernière modification. Les changements importants seront signalés sur notre site."],
    },
  },
];
