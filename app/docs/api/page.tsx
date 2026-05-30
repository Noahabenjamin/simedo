import {
  DocCallout,
  DocCode,
  DocH2,
  DocInline,
  DocPage,
} from "@/components/docs/doc-page";

export const metadata = { title: "API (preview)" };

export default function Page() {
  return (
    <DocPage
      eyebrow="Developers"
      title="API (preview)"
      lede="Programmatic access to public Helix simulations. This page sketches the shape we're designing toward — endpoints are not stable yet and will change before launch."
      href="/docs/api"
    >
      <DocCallout title="Not yet shipped" tone="warn">
        These endpoints are a design preview. Nothing on this page is live
        in production. We&apos;ll cut a 0.1 once the auth flow and rate
        limiter are in place — sign up at <DocInline>/contact</DocInline> to
        get the early-access link.
      </DocCallout>

      <DocH2>Base URL</DocH2>
      <p>
        All endpoints live under <DocInline>https://api.simedo.work/v1</DocInline>.
        Requests must include an API key in the{" "}
        <DocInline>Authorization</DocInline> header:
      </p>
      <DocCode>{`Authorization: Bearer hlx_live_<your-key>`}</DocCode>
      <p>
        API keys are issued per user and scoped to public-read by default.
        Write scopes (upload, edit, delete) require a separate confirmation
        flow.
      </p>

      <DocH2>List simulations</DocH2>
      <DocCode>{`GET /v1/simulations
  ?category=protein
  &tag=gromacs
  &sort=recent
  &cursor=<opaque>`}</DocCode>
      <p>
        Returns a paginated list of public simulations matching the filter.
        Each entry has <DocInline>id</DocInline>, <DocInline>name</DocInline>,
        <DocInline>uploader</DocInline>, <DocInline>nAtoms</DocInline>,
        <DocInline>nFrames</DocInline>, <DocInline>publishedAt</DocInline>,
        and a <DocInline>links</DocInline> object pointing at the viewer,
        embed, and download URLs.
      </p>

      <DocH2>Get a simulation</DocH2>
      <DocCode>{`GET /v1/simulations/:id`}</DocCode>
      <p>
        Full metadata for a single simulation, including the parsed topology
        summary (chains, residue counts), tags, license, and the uploader&apos;s
        description.
      </p>

      <DocH2>Stream a trajectory</DocH2>
      <DocCode>{`GET /v1/simulations/:id/trajectory
  ?start=0
  &end=500
  &stride=5
  &format=xtc`}</DocCode>
      <p>
        Streams a trajectory slice in the requested format. Range parameters
        let you pull a window without downloading the whole file.
      </p>

      <DocH2>Rate limits</DocH2>
      <p>The planned defaults for read endpoints:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>60 requests per minute per IP, unauthenticated.</li>
        <li>1000 requests per minute per API key.</li>
        <li>5 trajectory downloads per minute per API key.</li>
      </ul>
      <p>
        Burst headroom and per-route quotas are still being tuned —
        comments welcome.
      </p>

      <DocH2>SDKs</DocH2>
      <p>
        A small Python SDK will ship alongside v1. It wraps the endpoints
        above and adds helpers for handing a Helix simulation directly to{" "}
        <DocInline>MDTraj</DocInline> or <DocInline>MDAnalysis</DocInline>:
      </p>
      <DocCode>{`from helix import client

c = client.from_env()
sim = c.simulations.get("sim_8x4n2")
traj = sim.as_mdtraj(stride=10)`}</DocCode>
    </DocPage>
  );
}
