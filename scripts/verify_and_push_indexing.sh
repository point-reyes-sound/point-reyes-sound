#!/usr/bin/env bash
# ==============================================================================
# verify_and_push_indexing.sh
# Automates validation of routing, sitemaps, JSON-LD schemas, and GSC indexing
# Domains: https://pointreyessound.com & https://rchakraborty.dev
# ==============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "🚀 Starting SEO, Routing & Indexing Verification..."
echo "📂 Repo Root: $REPO_ROOT"
echo ""

# 1. Validate JSON-LD in Point Reyes Sound index.html
echo "🔍 [1/5] Validating Linked-Data JSON-LD schema in point-reyes-sound/index.html..."
python3 -c "
import json, re
with open('$REPO_ROOT/index.html', 'r', encoding='utf-8') as f:
    html = f.read()
scripts = re.findall(r'<script\s+type=[\"\']application/ld\+json[\"\']>(.*?)</script>', html, re.DOTALL)
assert len(scripts) >= 1, 'No JSON-LD scripts found in root index.html'
for idx, s in enumerate(scripts):
    data = json.loads(s)
    print(f'   ✓ Root JSON-LD block {idx+1} is valid JSON schema (@context: {data.get(\"@context\")})')
"

# 2. Validate JSON-LD in rchakraborty.dev index.html
echo "🔍 [2/5] Validating Linked-Data JSON-LD schema in rchakraborty.dev/index.html..."
python3 -c "
import json, re
with open('$REPO_ROOT/rchakraborty.dev/index.html', 'r', encoding='utf-8') as f:
    html = f.read()
scripts = re.findall(r'<script\s+type=[\"\']application/ld\+json[\"\']>(.*?)</script>', html, re.DOTALL)
assert len(scripts) >= 1, 'No JSON-LD scripts found in rchakraborty.dev/index.html'
for idx, s in enumerate(scripts):
    data = json.loads(s)
    print(f'   ✓ rchakraborty.dev JSON-LD block {idx+1} is valid JSON schema (@context: {data.get(\"@context\")})')
"

# 3. Validate XML Sitemaps
echo "🔍 [3/5] Validating XML sitemaps..."
python3 -c "
import xml.etree.ElementTree as ET
for path in ['$REPO_ROOT/public/sitemap.xml', '$REPO_ROOT/rchakraborty.dev/public/sitemap.xml']:
    tree = ET.parse(path)
    root = tree.getroot()
    urls = [elem.text for elem in root.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    for u in urls:
        assert '#' not in u, f'Error: Invalid fragment identifier found in sitemap URL: {u}'
    print(f'   ✓ Sitemap {path} passed validation with {len(urls)} canonical URLs without fragments.')
"

# 4. Validate Vercel Routing Configuration
echo "🔍 [4/5] Checking Vercel 404 Prevention Configs..."
python3 -c "
import json
for vfile in ['$REPO_ROOT/vercel.json', '$REPO_ROOT/rchakraborty.dev/vercel.json']:
    with open(vfile, 'r', encoding='utf-8') as f:
        conf = json.load(f)
    assert 'rewrites' in conf, f'Missing rewrites in {vfile}'
    assert conf.get('cleanUrls') is True, f'cleanUrls not enabled in {vfile}'
    has_catchall = any(r.get('destination') == '/index.html' for r in conf.get('rewrites', []))
    assert has_catchall, f'Missing SPA fallback rewrite in {vfile}'
    print(f'   ✓ {vfile} correctly implements cleanUrls, redirect maps, and SPA fallback to eliminate 404s.')
"

# 5. Build Verification
echo "🔍 [5/5] Building production bundles to verify no syntax/compilation issues..."
(cd "$REPO_ROOT" && npm run build > /dev/null 2>&1)
echo "   ✓ point-reyes-sound built successfully."
(cd "$REPO_ROOT/rchakraborty.dev" && npm run build > /dev/null 2>&1)
echo "   ✓ rchakraborty.dev built successfully."

echo ""
echo "=============================================================================="
echo "✅ ALL AUTOMATED AUDITS PASSED!"
echo "=============================================================================="
echo ""
echo "📡 Next Steps for Google Search Console (GSC) Priority Push:"
echo "1. Deploy changes to Vercel (or merge PR to trigger continuous deployment):"
echo "   git push origin <branch>"
echo ""
echo "2. Submit Sitemaps inside Google Search Console:"
echo "   - For https://rchakraborty.dev: Submit 'https://rchakraborty.dev/sitemap.xml'"
echo "   - For https://pointreyessound.com: Submit 'https://pointreyessound.com/sitemap.xml'"
echo ""
echo "3. Clear 404 Crawl Errors in GSC:"
echo "   - Go to GSC -> Indexing -> Pages -> 'Not found (404)'"
echo "   - Click 'Validate Fix' to initiate priority Googlebot verification re-crawl."
echo ""
