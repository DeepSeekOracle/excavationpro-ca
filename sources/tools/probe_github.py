# GitHub-only public M3U probe. HTTPS 200, >=3 https rows, jmp2.uk < 50%.
import urllib.request, ssl

ctx = ssl.create_default_context()
CANDS = [
    ("src_cineverse", "https://iptv-org.github.io/iptv/sources/us_cineversetv.m3u", "fast"),
    ("src_plex", "https://iptv-org.github.io/iptv/sources/us_plex.m3u", "fast"),
    ("src_tubi", "https://iptv-org.github.io/iptv/sources/us_tubi.m3u", "fast"),
    ("src_klowd", "https://iptv-org.github.io/iptv/sources/us_klowdtv.m3u", "fast"),
    ("src_sofast", "https://iptv-org.github.io/iptv/sources/us_sofast.m3u", "fast"),
    ("src_freq", "https://iptv-org.github.io/iptv/sources/us_frequency.m3u", "fast"),
    ("src_30a", "https://iptv-org.github.io/iptv/sources/us_30a.m3u", "fast"),
    ("src_local", "https://iptv-org.github.io/iptv/sources/us_local.m3u", "lists"),
    ("src_derak", "https://iptv-org.github.io/iptv/sources/de_rakuten.m3u", "fast"),
    ("src_esrak", "https://iptv-org.github.io/iptv/sources/es_rakuten.m3u", "fast"),
    ("src_firak", "https://iptv-org.github.io/iptv/sources/fi_rakuten.m3u", "fast"),
    ("src_ukdistro", "https://iptv-org.github.io/iptv/sources/uk_distro.m3u", "fast"),
    ("src_ausams", "https://iptv-org.github.io/iptv/sources/au_samsung.m3u", "fast"),
    ("src_casams", "https://iptv-org.github.io/iptv/sources/ca_samsung.m3u", "fast"),
    ("src_desams", "https://iptv-org.github.io/iptv/sources/de_samsung.m3u", "fast"),
    ("src_essams", "https://iptv-org.github.io/iptv/sources/es_samsung.m3u", "fast"),
    ("src_frsams", "https://iptv-org.github.io/iptv/sources/fr_samsung.m3u", "fast"),
    ("src_itsams", "https://iptv-org.github.io/iptv/sources/it_samsung.m3u", "fast"),
    ("src_brsams", "https://iptv-org.github.io/iptv/sources/br_samsung.m3u", "fast"),
    ("src_atsams", "https://iptv-org.github.io/iptv/sources/at_samsung.m3u", "fast"),
    ("src_besams", "https://iptv-org.github.io/iptv/sources/be_samsung.m3u", "fast"),
    ("src_bfm", "https://iptv-org.github.io/iptv/sources/fr_bfm.m3u", "lists"),
    ("src_fashion", "https://iptv-org.github.io/iptv/sources/fr_fashiontv.m3u", "lists"),
    ("xumo_gh", "https://raw.githubusercontent.com/BuddyChewChew/xumo-playlist-generator/main/playlists/xumo_playlist.m3u", "fast"),
    ("plex_gb", "https://raw.githubusercontent.com/BuddyChewChew/plex/main/playlists/plex_gb.m3u", "fast"),
    ("plex_ca", "https://raw.githubusercontent.com/BuddyChewChew/plex/main/playlists/plex_ca.m3u", "fast"),
    ("plex_au", "https://raw.githubusercontent.com/BuddyChewChew/plex/main/playlists/plex_au.m3u", "fast"),
    ("localnow", "https://www.apsattv.com/localnow.m3u", "fast"),
    ("ftv_ad", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_andorra.m3u8", "lists"),
    ("ftv_am", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_armenia.m3u8", "lists"),
    ("ftv_az", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_azerbaijan.m3u8", "lists"),
    ("ftv_by", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_belarus.m3u8", "lists"),
    ("ftv_td", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_chad.m3u8", "lists"),
    ("ftv_cy", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_cyprus.m3u8", "lists"),
    ("ftv_do", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_dominican_republic.m3u8", "lists"),
    ("ftv_fo", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_faroe_islands.m3u8", "lists"),
    ("ftv_gl", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_greenland.m3u8", "lists"),
    ("ftv_iq", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_iraq.m3u8", "lists"),
    ("ftv_kz", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_kazakhstan.m3u8", "lists"),
    ("ftv_ke", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_kenya.m3u8", "lists"),
    ("ftv_kr", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_korea.m3u8", "lists"),
    ("ftv_xk", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_kosovo.m3u8", "lists"),
    ("ftv_lv", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_latvia.m3u8", "lists"),
    ("ftv_lb", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_lebanon.m3u8", "lists"),
    ("ftv_lt", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_lithuania.m3u8", "lists"),
    ("ftv_lu", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_luxembourg.m3u8", "lists"),
    ("ftv_mo", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_macau.m3u8", "lists"),
    ("ftv_mt", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_malta.m3u8", "lists"),
    ("ftv_md", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_moldova.m3u8", "lists"),
    ("ftv_mc", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_monaco.m3u8", "lists"),
    ("ftv_mn", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_mongolia.m3u8", "lists"),
    ("ftv_me", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_montenegro.m3u8", "lists"),
    ("ftv_ng", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_nigeria.m3u8", "lists"),
    ("ftv_mk", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_north_macedonia.m3u8", "lists"),
    ("ftv_py", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_paraguay.m3u8", "lists"),
    ("ftv_qa", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_qatar.m3u8", "lists"),
    ("ftv_ru", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_russia.m3u8", "lists"),
    ("ftv_sm", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_san_marino.m3u8", "lists"),
    ("ftv_si", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_slovenia.m3u8", "lists"),
    ("ftv_ve", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_venezuela.m3u8", "lists"),
    ("daily_a", "https://raw.githubusercontent.com/mymsnn/DailyIPTV/main/outputs/tier_a.m3u", "lists"),
    ("do", "https://iptv-org.github.io/iptv/countries/do.m3u", "places"),
    ("cu", "https://iptv-org.github.io/iptv/countries/cu.m3u", "places"),
    ("pa", "https://iptv-org.github.io/iptv/countries/pa.m3u", "places"),
    ("gt", "https://iptv-org.github.io/iptv/countries/gt.m3u", "places"),
    ("hn", "https://iptv-org.github.io/iptv/countries/hn.m3u", "places"),
    ("ni", "https://iptv-org.github.io/iptv/countries/ni.m3u", "places"),
    ("sv", "https://iptv-org.github.io/iptv/countries/sv.m3u", "places"),
    ("cr", "https://iptv-org.github.io/iptv/countries/cr.m3u", "places"),
    ("tt", "https://iptv-org.github.io/iptv/countries/tt.m3u", "places"),
    ("jm", "https://iptv-org.github.io/iptv/countries/jm.m3u", "places"),
]
ua = {"User-Agent": "Mozilla/5.0 LYGO-TV-probe"}
passed = []
for cid, url, tab in CANDS:
    try:
        req = urllib.request.Request(url, headers=ua)
        with urllib.request.urlopen(req, context=ctx, timeout=18) as r:
            code = r.status
            body = r.read(900000).decode("utf-8", "replace")
        lines = [ln.strip() for ln in body.splitlines() if ln.strip() and not ln.startswith("#")]
        https = sum(1 for ln in lines if ln.lower().startswith("https://"))
        http = sum(1 for ln in lines if ln.lower().startswith("http://"))
        jmp = sum(1 for ln in lines if "jmp2.uk" in ln.lower())
        inf = body.count("#EXTINF")
        jpct = (100.0 * jmp / https) if https else 100.0
        ok = code == 200 and https >= 3 and jpct < 50
        flag = "OK" if ok else "NO"
        print("%s %-14s HTTP%s inf=%4d https=%4d http=%3d jmp=%3d jmp%%=%5.1f %s" % (
            flag, cid, code, inf, https, http, jmp, jpct, tab))
        if ok:
            passed.append((cid, url, tab, https, inf))
    except Exception as e:
        print("NO %-14s ERR %s: %s" % (cid, type(e).__name__, e))
print("---PASS", len(passed))
for row in passed:
    print("PASS", row[0], row[2], row[3], row[1])
