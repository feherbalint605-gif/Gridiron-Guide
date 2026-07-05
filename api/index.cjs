// Placeholder — overwritten by script/build.mjs during the Vercel build step.
module.exports = (req, res) => {
  res.status(503).json({ error: "Build in progress, please redeploy." });
};
// Vercel build step. This file must exist in the repo so Vercel detects the
// api/ directory as a serverless-function path during the pre-build scan.
// The build overwrites this with the self-contained bundle.
