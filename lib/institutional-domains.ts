// Institutional domain check for the academic verification flow.
// Accepts a small set of national academic TLDs (.edu, .ac.uk, .gov, etc.)
// plus a hand-maintained allowlist of European / Asian research institutes
// that don't match those patterns. Blocks the obvious consumer providers up
// front so we don't waste a verification email on someone using gmail.

const ACADEMIC_TLD_SUFFIXES = [
  ".edu",
  ".ac.uk",
  ".ac.jp",
  ".edu.au",
  ".ac.nz",
  ".ac.il",
  ".edu.cn",
  ".ac.in",
  ".gov",
] as const;

// Research institutes that don't match the academic-TLD pattern. Lowercase.
const INSTITUTION_ALLOWLIST = new Set([
  // Finland
  "helsinki.fi",
  "aalto.fi",
  "oulu.fi",
  "jyu.fi",
  "utu.fi",
  "abo.fi",
  // Sweden
  "kth.se",
  "lu.se",
  "uu.se",
  "chalmers.se",
  "ki.se",
  // Norway
  "uio.no",
  "ntnu.no",
  // Denmark
  "ku.dk",
  "dtu.dk",
  "sdu.dk",
  // Netherlands
  "tudelft.nl",
  "uva.nl",
  "vu.nl",
  "ru.nl",
  // Germany
  "tum.de",
  "lmu.de",
  "kit.edu",
  "rwth-aachen.de",
  "uni-heidelberg.de",
  "mpg.de",
  "mpi-cbg.de",
  // France
  "cnrs.fr",
  "inria.fr",
  "ens.fr",
  "polytechnique.fr",
  "sorbonne-universite.fr",
  // Switzerland
  "epfl.ch",
  "ethz.ch",
  "unige.ch",
  "cern.ch",
  // EMBL / EBI / Sanger
  "embl.de",
  "embl.org",
  "ebi.ac.uk",
  "sanger.ac.uk",
  // Spain
  "bsc.es",
  "csic.es",
  "uam.es",
  // Israel
  "weizmann.ac.il",
  "technion.ac.il",
  // Japan
  "riken.jp",
]);

const CONSUMER_BLOCKLIST = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "proton.me",
  "protonmail.com",
  "icloud.com",
  "mail.com",
  "qq.com",
  "163.com",
  "yandex.ru",
  "mail.ru",
]);

export type DomainCheck =
  | { valid: true; domain: string }
  | { valid: false; domain: string; reason: string };

export function validateInstitutionalDomain(email: string): DomainCheck {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 0 || at === trimmed.length - 1) {
    return { valid: false, domain: "", reason: "Enter a complete email address." };
  }
  const domain = trimmed.slice(at + 1);

  if (CONSUMER_BLOCKLIST.has(domain)) {
    return {
      valid: false,
      domain,
      reason:
        "Personal email providers can't be verified. Please use your university or research-institute email.",
    };
  }

  if (INSTITUTION_ALLOWLIST.has(domain)) {
    return { valid: true, domain };
  }

  for (const suffix of ACADEMIC_TLD_SUFFIXES) {
    if (domain.endsWith(suffix)) {
      return { valid: true, domain };
    }
  }

  return {
    valid: false,
    domain,
    reason:
      "We accept .edu, .ac.uk, .gov, and major European / Asian research institutes. Email noah@simedo.work if your institute should be on the list.",
  };
}

// Public for the verification badge so the profile can show a friendly
// institution name even before display_name is set.
export function institutionFromDomain(domain: string): string {
  const stripped = domain.replace(/^www\./, "");
  // Map a handful of well-known domains to nicer labels; everything else
  // gets a TitleCased version of the second-level domain.
  const known: Record<string, string> = {
    "embl.de": "EMBL",
    "embl.org": "EMBL",
    "ebi.ac.uk": "EMBL-EBI",
    "sanger.ac.uk": "Wellcome Sanger Institute",
    "cern.ch": "CERN",
    "mpg.de": "Max Planck Society",
    "mpi-cbg.de": "Max Planck CBG",
    "epfl.ch": "EPFL",
    "ethz.ch": "ETH Zürich",
    "riken.jp": "RIKEN",
    "weizmann.ac.il": "Weizmann Institute",
    "technion.ac.il": "Technion",
    "cnrs.fr": "CNRS",
    "inria.fr": "Inria",
    "ku.dk": "University of Copenhagen",
    "dtu.dk": "Technical University of Denmark",
    "ki.se": "Karolinska Institutet",
    "kth.se": "KTH Royal Institute of Technology",
    "uio.no": "University of Oslo",
    "ntnu.no": "NTNU",
    "tudelft.nl": "TU Delft",
    "uva.nl": "University of Amsterdam",
    "tum.de": "TU Munich",
    "kit.edu": "KIT",
    "uni-heidelberg.de": "Heidelberg University",
    "helsinki.fi": "University of Helsinki",
    "aalto.fi": "Aalto University",
    "bsc.es": "Barcelona Supercomputing Center",
  };
  if (known[stripped]) return known[stripped];

  // Fall back: take the second-level domain, capitalize each piece.
  const second = stripped.split(".")[0] ?? stripped;
  return second
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
