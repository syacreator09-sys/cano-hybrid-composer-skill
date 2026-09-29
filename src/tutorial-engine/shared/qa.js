export const DEFAULT_QA_GATES = Object.freeze({
  requireExactFrameCount: true,
  maxExactAdjacentDuplicates: 0,
  requireSafeAreaPass: true,
  requireTransitionInspection: true,
  requireDeterministicRenderAtFrame: true,
  rejectPrimaryMotionLoops: true,
  visualMasterBeforeAudio: true
});
