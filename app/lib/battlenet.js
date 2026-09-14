const DEFAULT_REGION = "eu";
const PROFILE_NAMESPACES = ["profile-eu", "profile-classic-eu", "profile-classic1x-eu"];

function getRegion() {
  return (process.env.BATTLENET_REGION || DEFAULT_REGION).toLowerCase();
}

function getClientId() {
  const value = process.env.BATTLENET_CLIENT_ID;
  if (!value) {
    throw new Error("BATTLENET_CLIENT_ID is not configured");
  }
  return value;
}

function getClientSecret() {
  const value = process.env.BATTLENET_CLIENT_SECRET;
  if (!value) {
    throw new Error("BATTLENET_CLIENT_SECRET is not configured");
  }
  return value;
}

export function getBattleNetRedirectUri(request) {
  if (process.env.BATTLENET_REDIRECT_URI) {
    return process.env.BATTLENET_REDIRECT_URI;
  }

  return new URL("/api/auth/callback/battlenet", request.url).toString();
}

export function getBattleNetAuthorizeUrl({ request, state }) {
  const region = getRegion();
  const url = new URL(`https://${region}.battle.net/oauth/authorize`);

  url.searchParams.set("client_id", getClientId());
  url.searchParams.set("redirect_uri", getBattleNetRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid wow.profile");
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeBattleNetCode({ request, code }) {
  const region = getRegion();
  const tokenUrl = `https://${region}.battle.net/oauth/token`;
  const credentials = Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getBattleNetRedirectUri(request)
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw new Error(`Battle.net token exchange failed with status ${response.status}`);
  }

  return data;
}

async function fetchJsonWithBearer(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function fetchBattleNetUserInfo(accessToken) {
  const region = getRegion();
  const { response, data } = await fetchJsonWithBearer(`https://${region}.battle.net/oauth/userinfo`, accessToken);

  if (!response.ok) {
    throw new Error(`Battle.net userinfo failed with status ${response.status}`);
  }

  return {
    id: String(data.id || data.sub || ""),
    battletag: data.battletag || "Unknown BattleTag"
  };
}

function summarizeProfileResponse(namespace, response, data) {
  const wowAccounts = Array.isArray(data.wow_accounts) ? data.wow_accounts : [];
  const characterCount = wowAccounts.reduce((total, account) => {
    return total + (Array.isArray(account.characters) ? account.characters.length : 0);
  }, 0);

  return {
    namespace,
    ok: response.ok,
    status: response.status,
    wowAccountCount: wowAccounts.length,
    characterCount,
    errorCode: response.ok ? null : data.code || data.type || null,
    errorDetail: response.ok ? null : data.detail || data.reason || null
  };
}

export async function fetchWowProfileChecks(accessToken) {
  const region = getRegion();
  const locale = process.env.BATTLENET_LOCALE || "en_GB";

  const checks = await Promise.all(PROFILE_NAMESPACES.map(async (namespace) => {
    const url = new URL(`https://${region}.api.blizzard.com/profile/user/wow`);
    url.searchParams.set("namespace", namespace);
    url.searchParams.set("locale", locale);

    try {
      const { response, data } = await fetchJsonWithBearer(url, accessToken);
      return summarizeProfileResponse(namespace, response, data);
    } catch (error) {
      return {
        namespace,
        ok: false,
        status: 0,
        wowAccountCount: 0,
        characterCount: 0,
        errorCode: "FETCH_FAILED",
        errorDetail: error.message
      };
    }
  }));

  return {
    region,
    locale,
    checks,
    hasAnyWowProfile: checks.some((check) => check.ok && check.characterCount > 0),
    hasClassicProfile: checks.some((check) => check.ok && check.namespace !== `profile-${region}` && check.characterCount > 0)
  };
}
