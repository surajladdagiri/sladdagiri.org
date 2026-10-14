// SLEAP iOS demo screenshots, served straight from the sleap-ios repo on
// GitHub (raw.githubusercontent.com allows cross-origin reads, so they also work
// as WebGL textures in the 3D phone). To self-host instead, copy the four files
// from the repo's Demos/ folder into public/ and set SLEAP_BASE to
// `${import.meta.env.BASE_URL}`.
export const SLEAP_BASE = "https://raw.githubusercontent.com/surajladdagiri/sleap-ios/main/Demos/";

export const SLEAP_SHOTS = [
  { src: `${SLEAP_BASE}home.PNG`, alt: "SLEAP iOS home screen", caption: "Home" },
  { src: `${SLEAP_BASE}render.PNG`, alt: "Renderer test: saved predictions drawn over the reference frame", caption: "Renderer test" },
  { src: `${SLEAP_BASE}inference.PNG`, alt: "Prediction test: on-device inference on the reference frame", caption: "Prediction test" },
  { src: `${SLEAP_BASE}video.PNG`, alt: "Video test: frame-by-frame inference with skeleton overlays and FPS", caption: "Video test" },
];

export const SLEAP_REPO = "https://github.com/surajladdagiri/sleap-ios";
export const SLEAP_TESTFLIGHT = "https://testflight.apple.com/join/tQRBwW7R";
export const SLEAP_NOTEBOOK = "https://github.com/surajladdagiri/sleap-ios/blob/main/python/training_demo_jupyter.ipynb";
