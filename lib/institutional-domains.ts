// Institutional domain check for the academic verification flow.
//
// Three buckets:
//   1. Academic-TLD suffixes that we trust outright (.edu, .ac.uk, .gov, …).
//   2. A large explicit allowlist of named institutions whose domains don't
//      match those suffixes (or that we list explicitly so a future reader
//      can grep their lab name and find it).
//   3. A blocklist of consumer email providers — these never qualify for
//      manual review either; we just suggest emailing verify@simedo.work.
//
// Anything that doesn't match #1 or #2 fails validation, but we hand back
// `canRequestReview: true` (unless on the blocklist) so the UI can offer a
// manual-review escape hatch.

const ACADEMIC_TLD_SUFFIXES = [
  // Academia
  ".edu",
  ".ac.uk",
  ".ac.jp",
  ".ac.za",
  ".ac.kr",
  ".ac.th",
  ".ac.ir",
  ".ac.at",
  ".ac.nz",
  ".ac.il",
  ".ac.in",
  ".edu.au",
  ".edu.cn",
  ".edu.sg",
  ".edu.tr",
  // National labs + government science
  ".gov",
  ".gc.ca",
  ".gouv.fr",
  ".gob.es",
  ".gob.mx",
] as const;

// Named institutions — most of these would also match a TLD suffix above
// (e.g. harvard.edu hits .edu), but listing them explicitly keeps the
// allowlist greppable for any institution name that's been called out.
const INSTITUTION_ALLOWLIST = new Set<string>([
  // ----- Finland -----
  "helsinki.fi",
  "aalto.fi",
  "oulu.fi",
  "jyu.fi",
  "utu.fi",
  "abo.fi",
  "tut.fi",
  "lut.fi",
  "vtt.fi",
  // ----- Sweden -----
  "kth.se",
  "lu.se",
  "uu.se",
  "chalmers.se",
  "ki.se",
  "su.se",
  "lnu.se",
  "gu.se",
  "slu.se",
  "mdh.se",
  "hh.se",
  "scilifelab.se",
  // ----- Norway / Iceland -----
  "uio.no",
  "ntnu.no",
  "hi.is",
  "ru.is",
  // ----- Denmark -----
  "ku.dk",
  "dtu.dk",
  "sdu.dk",
  // ----- Netherlands / Belgium -----
  "tudelft.nl",
  "uva.nl",
  "vu.nl",
  "ru.nl",
  "leidenuniv.nl",
  "rug.nl",
  "utwente.nl",
  "wur.nl",
  "ulb.be",
  "kuleuven.be",
  "vub.be",
  "ugent.be",
  "unamur.be",
  // ----- Germany -----
  "tum.de",
  "lmu.de",
  "kit.edu",
  "rwth-aachen.de",
  "uni-heidelberg.de",
  "uni-bonn.de",
  "uni-koeln.de",
  "uni-frankfurt.de",
  "uni-leipzig.de",
  "uni-stuttgart.de",
  "uni-goettingen.de",
  "charite.de",
  "dkfz.de",
  "helmholtz.de",
  "fz-juelich.de",
  "leibniz-fmp.de",
  "mpg.de",
  "mpi-cbg.de",
  // ----- France -----
  "cnrs.fr",
  "inria.fr",
  "ens.fr",
  "ens-lyon.fr",
  "polytechnique.fr",
  "sorbonne-universite.fr",
  "sorbonne.fr",
  "univ-amu.fr",
  "univ-lyon1.fr",
  // ----- Switzerland -----
  "epfl.ch",
  "ethz.ch",
  "unige.ch",
  "fmi.ch",
  "unil.ch",
  "unibas.ch",
  "cern.ch",
  // ----- Austria -----
  "uni-vienna.ac.at",
  "univie.ac.at",
  "oeaw.ac.at",
  "ist.ac.at",
  // ----- Italy -----
  "polimi.it",
  "unimi.it",
  "unibo.it",
  "uniroma1.it",
  "unipd.it",
  "unitn.it",
  "sissa.it",
  "sns.it",
  // ----- Spain / Portugal -----
  "bsc.es",
  "csic.es",
  "uam.es",
  // ----- Baltics / CEE / Poland -----
  "uw.edu.pl",
  "agh.edu.pl",
  "polsl.pl",
  "su.lt",
  "vu.lt",
  // ----- UK -----
  "ic.ac.uk",
  "kcl.ac.uk",
  "ucl.ac.uk",
  "manchester.ac.uk",
  "edinburgh.ac.uk",
  "ed.ac.uk",
  "gla.ac.uk",
  "leeds.ac.uk",
  "bristol.ac.uk",
  "sheffield.ac.uk",
  "warwick.ac.uk",
  "southampton.ac.uk",
  "ox.ac.uk",
  "oxford.ac.uk",
  "cam.ac.uk",
  "qmul.ac.uk",
  "lse.ac.uk",
  "ebi.ac.uk",
  "sanger.ac.uk",
  // ----- EMBL -----
  "embl.de",
  "embl.org",
  // ----- Israel -----
  "weizmann.ac.il",
  "technion.ac.il",
  "tau.ac.il",
  "biu.ac.il",
  "huji.ac.il",
  "post.bgu.ac.il",
  // ----- Japan -----
  "riken.jp",
  "tit.ac.jp",
  "titech.ac.jp",
  "u-tokyo.ac.jp",
  "kyoto-u.ac.jp",
  "osaka-u.ac.jp",
  "nagoya-u.ac.jp",
  "tohoku.ac.jp",
  "kyushu-u.ac.jp",
  "hokudai.ac.jp",
  // ----- China / Hong Kong / Taiwan -----
  "pku.edu.cn",
  "tsinghua.edu.cn",
  "fudan.edu.cn",
  "sjtu.edu.cn",
  "zju.edu.cn",
  "ustc.edu.cn",
  "sustech.edu.cn",
  "hku.hk",
  "ust.hk",
  "cuhk.edu.hk",
  "polyu.edu.hk",
  "ntu.edu.tw",
  "ntnu.edu.tw",
  "sinica.edu.tw",
  // ----- Korea -----
  "snu.ac.kr",
  "kaist.ac.kr",
  "postech.ac.kr",
  "yonsei.ac.kr",
  "korea.ac.kr",
  "ist.ac.kr",
  "postech.edu",
  // ----- Singapore -----
  "nus.edu.sg",
  "ntu.edu.sg",
  "smu.edu.sg",
  // ----- Australia / NZ -----
  "unsw.edu.au",
  "sydney.edu.au",
  "monash.edu",
  "anu.edu.au",
  "melbourne.edu.au",
  "uq.edu.au",
  "adelaide.edu.au",
  "uwa.edu.au",
  // ----- Canada -----
  "mcgill.ca",
  "utoronto.ca",
  "ubc.ca",
  "mcmaster.ca",
  "waterloo.ca",
  "uvic.ca",
  "sfu.ca",
  "ualberta.ca",
  "queensu.ca",
  "uwo.ca",
  "concordia.ca",
  "polymtl.ca",
  "polytechnique.ca",
  "ucalgary.ca",
  // ----- USA — explicit highlights (also covered by .edu / .gov) -----
  "harvard.edu",
  "mit.edu",
  "stanford.edu",
  "princeton.edu",
  "yale.edu",
  "columbia.edu",
  "uchicago.edu",
  "caltech.edu",
  "berkeley.edu",
  "ucla.edu",
  "ucsd.edu",
  "ucsf.edu",
  "ucdavis.edu",
  "umich.edu",
  "wisc.edu",
  "illinois.edu",
  "cornell.edu",
  "upenn.edu",
  "duke.edu",
  "jhu.edu",
  "unc.edu",
  "gatech.edu",
  "nyu.edu",
  "bu.edu",
  "northeastern.edu",
  "neu.edu",
  "brown.edu",
  "dartmouth.edu",
  "virginia.edu",
  "vt.edu",
  "purdue.edu",
  "msu.edu",
  "osu.edu",
  "ufl.edu",
  "utexas.edu",
  "tamu.edu",
  "asu.edu",
  "colorado.edu",
  "washington.edu",
  "oregonstate.edu",
  "slac.stanford.edu",
  "niddk.nih.gov",
  "nih.gov",
  "nist.gov",
  "lanl.gov",
  "ornl.gov",
  "sandia.gov",
  "llnl.gov",
  "anl.gov",
  "bnl.gov",
  "fnal.gov",
  // ----- Latin America -----
  "usp.br",
  "unicamp.br",
  "ufrj.br",
  "ufmg.br",
  "ufsc.br",
  "ufsm.br",
  "unam.mx",
  "cinvestav.mx",
  "ipn.mx",
  "cicese.mx",
  "ucb.cl",
  "uchile.cl",
  "puc.cl",
  "ucr.ac.cr",
  "ucsg.edu.ec",
]);

const CONSUMER_BLOCKLIST = new Set<string>([
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
  "aol.com",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "fastmail.com",
  "tutanota.com",
  "zoho.com",
  "hey.com",
]);

export type DomainCheck =
  | { valid: true; domain: string }
  | {
      valid: false;
      domain: string;
      reason: string;
      canRequestReview: boolean;
    };

export function validateInstitutionalDomain(email: string): DomainCheck {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 0 || at === trimmed.length - 1) {
    return {
      valid: false,
      domain: "",
      reason: "Enter a complete email address.",
      canRequestReview: false,
    };
  }
  const domain = trimmed.slice(at + 1);

  if (CONSUMER_BLOCKLIST.has(domain)) {
    return {
      valid: false,
      domain,
      reason:
        "Please use your professional or institutional email if you have one, or contact us at verify@simedo.work if you'd like manual review.",
      canRequestReview: false,
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
      "We don't automatically recognize this domain yet. Request manual review below and we'll get back to you within 2–3 days.",
    canRequestReview: true,
  };
}

// Public for the verification badge so the profile can show a friendly
// institution name even before display_name is set.
export function institutionFromDomain(domain: string): string {
  const stripped = domain.replace(/^www\./, "");
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
  const second = stripped.split(".")[0] ?? stripped;
  return second
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
