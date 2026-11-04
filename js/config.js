/* =====================================================================
   ATG CaliFit – SITE CONFIGURATION
   ---------------------------------------------------------------------
   Edit business details here. Nothing else needs to change.
   Fields marked AWAITING CONFIRMATION are intentionally empty: the
   matching UI stays hidden until a real, verified value is added.
   ===================================================================== */
const SITE_CONFIG = {
  brandName: "ATG CaliFit",
  tagline: "STRENGTH • SKILLS • COMMUNITY",
  category: "Calisthenics & Performance Training",
  address: "Near 7th Heaven Society, Next to Prakash Tingre Sports Ground, Pune, Maharashtra 411015, India",
  addressLines: [
    "Near 7th Heaven Society,",
    "Next to Prakash Tingre Sports Ground,",
    "Pune, Maharashtra 411015, India."
  ],
  instagram: "https://www.instagram.com/atg.cali.fit/",
  instagramHandle: "@atg.cali.fit",
  website: "https://atgcalifit.in/",

  whatsappNumber: "",        // e.g. "919XXXXXXXXX" – country code, no + or spaces. AWAITING CONFIRMATION
  whatsappMessage: "Hi ATG CaliFit! I'd like to know more about your calisthenics training.",
  phone: "",                 // e.g. "+91 9XXXX XXXXX". AWAITING CONFIRMATION
  email: "",                 // AWAITING CONFIRMATION

  // Form submission endpoint (Formspree / Web3Forms / your own API).
  // Receives a JSON POST. AWAITING CONFIRMATION
  formEndpoint: "",

  // Hero background video. Drop the supplied workout clip into
  // assets/videos/ and set the path, e.g. "assets/videos/hero-workout.mp4".
  // Leave empty to use the hero image only.
  heroVideo: "",

  // AWAITING CONFIRMATION – the block stays hidden while null.
  // Example: [{ label: "Morning batch", value: "6:00 – 7:30 AM" }]
  classTimings: null,
  // Example: [{ label: "Monthly", value: "₹X,XXX" }]
  pricing: null,

  challenge: [
    "5 Pull-ups",
    "20 Push-ups",
    "1 Min Dead Hang",
    "30 Squats",
    "1 Min Plank"
  ]
};
