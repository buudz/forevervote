import { NextResponse } from "next/server";

const SOURCE_REPO = "https://github.com/buudz/forevervote";

export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || null;
  const branch = process.env.VERCEL_GIT_COMMIT_REF || null;
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || null;

  return NextResponse.json({
    source: SOURCE_REPO,
    commit,
    commitUrl: commit ? `${SOURCE_REPO}/commit/${commit}` : null,
    branch,
    environment
  }, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300"
    }
  });
}
