/** Feature switches are deliberately local and deterministic for the demo. */
export const features = {
  graphify: true,
  liveGithub: false,
  decisionReceipts: false,
  gemini: true,
} as const;

export type FeatureName = keyof typeof features;
