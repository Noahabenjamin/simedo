// Single source of truth for the docs sidebar — used by the sidebar
// component and by /docs page to render its overview cards. Adding a new
// page means adding it here and creating a route under `app/docs/`.

export type DocSection = {
  title: string;
  items: { title: string; href: string; blurb: string }[];
};

export const DOC_SECTIONS: DocSection[] = [
  {
    title: "Start here",
    items: [
      {
        title: "Getting started",
        href: "/docs/getting-started",
        blurb: "What Helix is and how to take your first look at a simulation.",
      },
    ],
  },
  {
    title: "Sharing your work",
    items: [
      {
        title: "Uploading a simulation",
        href: "/docs/uploading",
        blurb:
          "Step-by-step walkthrough of the upload form and the publishing flow.",
      },
      {
        title: "Supported formats",
        href: "/docs/formats",
        blurb:
          "Trajectory and topology formats the viewer can read, plus best practices.",
      },
    ],
  },
  {
    title: "Exploring simulations",
    items: [
      {
        title: "The AI guide",
        href: "/docs/ai-guide",
        blurb: "How the guide answers questions about what you're looking at.",
      },
      {
        title: "Embedding",
        href: "/docs/embedding",
        blurb: "Drop a Helix viewer into a paper, slide deck, or website.",
      },
    ],
  },
  {
    title: "Developers",
    items: [
      {
        title: "API (preview)",
        href: "/docs/api",
        blurb: "Programmatic access to public simulations. In design.",
      },
    ],
  },
];

export function findDocItem(href: string) {
  for (const section of DOC_SECTIONS) {
    for (const item of section.items) {
      if (item.href === href) return { section, item };
    }
  }
  return null;
}
