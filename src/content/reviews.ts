// Real customer reviews only. The home-page rating badge stays hidden until
// `rating` and `count` are filled in from a verifiable source (Google, Facebook).
export const REVIEWS: {
  rating: number | null;
  count: number;
  source: string;
  sourceUrl?: string;
  /** Initials of a few reviewers, shown as avatars beside the stars. */
  initials: string[];
} = {
  rating: null,
  count: 0,
  source: "Google",
  initials: [],
};
