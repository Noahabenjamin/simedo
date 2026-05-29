// Short, factually conservative descriptions of each protein family that has
// at least one simulation in the catalog. One paragraph each.

export const familyDescriptions: Record<string, string> = {
  Globins:
    "Globins are a family of oxygen-binding proteins built around a heme cofactor. They include hemoglobin, myoglobin, and neuroglobin, and are responsible for transporting and storing O₂ across nearly every vertebrate species.",

  GPCRs:
    "G-protein-coupled receptors (GPCRs) are seven-transmembrane signaling proteins that sense ligands at the cell surface and relay the signal across the membrane through heterotrimeric G proteins. They are the targets of roughly a third of approved drugs.",

  Kinases:
    "Protein kinases catalyze the transfer of a phosphate group from ATP onto specific residues of substrate proteins. They are central regulators of nearly every signaling pathway in eukaryotic cells.",

  Immunoglobulins:
    "Immunoglobulins (antibodies) are Y-shaped proteins of the adaptive immune system. Each antibody has two heavy and two light chains and recognizes its target through the variable Fab regions at the tips of the arms.",

  "CRISPR-Cas9":
    "Cas9 is the RNA-guided DNA endonuclease at the heart of CRISPR genome editing. Loaded with a single-guide RNA, it scans for complementary DNA and cleaves both strands at a defined site.",

  Histones:
    "Histones are small, basic proteins that compact eukaryotic DNA into chromatin. Two copies each of H2A, H2B, H3, and H4 assemble into an octamer around which ~147 base pairs of DNA wrap to form a nucleosome.",

  Aquaporins:
    "Aquaporins are integral membrane proteins that form selective channels allowing rapid passage of water (and sometimes small solutes) across cell membranes. They are present in nearly every form of life.",

  "Coronavirus spike":
    "The spike glycoprotein of coronaviruses is a trimeric class-I fusion protein on the viral surface. It binds host receptors via its receptor-binding domain, then refolds dramatically to drive membrane fusion.",

  Lysozymes:
    "Lysozymes are small enzymes that cleave the peptidoglycan layer of bacterial cell walls. Hen egg-white lysozyme was the second protein and first enzyme to have its structure solved.",

  "Kunitz inhibitors":
    "Kunitz-type domains are compact ~60-residue inhibitors of serine proteases. BPTI is the founding member and one of the most thoroughly studied small proteins in biophysics.",

  Ubiquitin:
    "Ubiquitin is a 76-residue regulatory protein covalently attached to substrate proteins to mark them for degradation, trafficking, or other fates. Its β-grasp fold is one of the most studied in protein biophysics.",
};

export function getFamilyDescription(family: string): string | undefined {
  return familyDescriptions[family];
}
