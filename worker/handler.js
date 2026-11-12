const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra}});
export async function handleAircraft(request, ctx = {}) {
  const url = new URL(request.url);
  const raw = ['lat','lon','radius'].map(k => url.searchParams.get(k));
  const [lat, lon, radius] = raw.map(Number);
  if (raw.some(v => v === null || !v.trim()) || ![lat,lon,radius].every(Number.isFinite) || lat < -90 || lat > 90 || lon < -180 || lon > 180 || ![50,100,200].includes(radius)) return json({error:'invalid_location'}, 400);
  // Fix the upstream host and validate every path component. No API key is needed.
  const upstream = `https://api.adsb.lol/v2/point/${lat.toFixed(3)}/${lon.toFixed(3)}/${Math.ceil(radius / 1.852)}`;
  const cache = globalThis.caches?.default;
  const cacheKey = new Request(upstream);
  if(cache) { const hit = await cache.match(cacheKey); if(hit) return hit; }
  let timer;
  try {
    const controller = new AbortController(); timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(upstream, {headers:{Accept:'application/json'}, signal:controller.signal});
    if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After'));
      return json({error:'rate_limited'}, 429, {'Retry-After':String(Number.isFinite(retry) && retry > 0 ? Math.min(86400, retry) : 300)});
    }
    if (!res.ok) return json({error:'provider_unavailable'}, 502);
    const body = await res.json();
    if (!Array.isArray(body.ac)) return json({error:'invalid_provider_response'}, 502);
    // Only forward fields used by the radar; omit receiver information.
    const fields = ['hex','flight','r','t','lat','lon','alt_baro','alt_geom','gs','track','baro_rate','seen_pos','seen'];
    const aircraft = body.ac.slice(0,2000).map(a => Object.fromEntries(fields.filter(k => a[k] !== undefined).map(k => [k,a[k]])));
    const response = json({aircraft, updatedAt:Date.now(), source:'ADSB.lol'});
    response.headers.set('Cache-Control','public, max-age=60');
    if(cache) { const put=cache.put(cacheKey,response.clone()); if(ctx.waitUntil) ctx.waitUntil(put); else await put; }
    return response;
  } catch { return json({error:'provider_unavailable'}, 502); }
  finally { clearTimeout(timer); }
}
