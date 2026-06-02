// Shared types for Helix. Add domain types here as the schema grows.

export type SimulationCategory =
  | "protein"
  | "dna"
  | "rna"
  | "membrane"
  | "drug-complex"
  | "enzyme"
  | "antibody"
  | "receptor";

export type ExperimentType =
  | "equilibrium MD"
  | "steered MD"
  | "free energy"
  | "binding"
  | "folding";

export type SimulationAuthor = {
  name: string;
  username: string;
  avatarUrl: string;
};

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  institution: string | null;
  orcid: string | null;
  avatarUrl: string;
  isVerifiedAcademic: boolean;
  isSeed: boolean;
  createdAt: string;
  simulationCount: number;
  followerCount: number;
  followingCount: number;
};

export type Simulation = {
  id: string;
  title: string;
  description: string;
  pdbCode: string;
  pdbUrl: string;
  trajectoryUrl: string | null;
  hasTrajectory: boolean;
  thumbnailUrl: string;
  author: SimulationAuthor;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];

  // Categorization
  category: SimulationCategory;
  proteinFamily?: string;
  organism?: string;
  experimentType: ExperimentType;
  resolution?: number; // Å, used for the family-page average-resolution stat
  relatedSimulations?: string[];
};
