// Shared types for Simedo. Add domain types here as the schema grows.

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
  likeCount: number;
  followerCount: number;
  followingCount: number;
};

export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";
export type CompressionMethod =
  | "none"
  | "downsample"
  | "pca"
  | "downsample_and_pca";
export type DataOrigin =
  | "original"
  | "reupload_with_permission"
  | "public_repository";
export type VerificationLevel =
  | "none"
  | "email_verified"
  | "manually_verified";

export type SimulationProvenance = {
  software: string | null;
  softwareVersion: string | null;
  forceFieldFull: string | null;
  waterModel: string | null;
  temperatureK: number | null;
  pressureBar: number | null;
  ph: number | null;
  ionicStrengthMm: number | null;
  lengthNs: number | null;
  simulationLab: string | null;
  simulationInstitution: string | null;
  correspondingAuthor: string | null;
  correspondingAuthorEmail: string | null;
  dataOrigin: DataOrigin;
  originalSourceUrl: string | null;
  sourceDoi: string | null;
  uploaderVerification: VerificationLevel;
};

export type SimulationTrajectory = {
  rawUrl: string | null;
  rawSizeMb: number | null;
  compressedUrl: string | null;
  compressedSizeMb: number | null;
  framesOriginal: number | null;
  framesStreamed: number | null;
  compressionMethod: CompressionMethod | null;
  processingStatus: ProcessingStatus;
  processingError: string | null;
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

  // Provenance + compression metadata (Phase 5: uploads)
  provenance: SimulationProvenance;
  trajectory: SimulationTrajectory;
};
