# Probe public M3U candidates. HTTPS 200, >=3 https rows, jmp2.uk < 50%.
import urllib.request, ssl

ctx = ssl.create_default_context()
CANDS = [
    ("cineverse", "https://www.apsattv.com/cineverse.m3u", "fast"),
    ("zeasn", "https://www.apsattv.com/zeasn.m3u", "fast"),
    ("rok", "https://www.apsattv.com/rok.m3u", "fast"),
    ("vidaa", "https://www.apsattv.com/vidaa.m3u", "fast"),
    ("whale", "https://www.apsattv.com/whaletvplus_all.m3u", "fast"),
    ("ssung_uk", "https://www.apsattv.com/ssungeng.m3u", "fast"),
    ("ssung_au", "https://www.apsattv.com/ssungaus.m3u", "fast"),
    ("ssung_ca", "https://www.apsattv.com/ssungcan.m3u", "fast"),
    ("ssung_it", "https://www.apsattv.com/ssungita.m3u", "fast"),
    ("ssung_es", "https://www.apsattv.com/ssungspa.m3u", "fast"),
    ("ssung_fr", "https://www.apsattv.com/ssungfra.m3u", "fast"),
    ("ssung_br", "https://www.apsattv.com/ssungbra.m3u", "fast"),
    ("ssung_nz", "https://www.apsattv.com/ssungnz.m3u", "fast"),
    ("ssung_sg", "https://www.apsattv.com/ssungsg.m3u", "fast"),
    ("ssung_ph", "https://www.apsattv.com/ssungph.m3u", "fast"),
    ("ssung_th", "https://www.apsattv.com/ssungth.m3u", "fast"),
    ("bumble", "https://www.apsattv.com/bumblebeetv.m3u", "fast"),
    ("tablo", "https://www.apsattv.com/tablo.m3u", "fast"),
    ("src_distro", "https://iptv-org.github.io/iptv/sources/us_distro.m3u", "fast"),
    ("src_amagi", "https://iptv-org.github.io/iptv/sources/us_amagi.m3u", "fast"),
    ("src_ukrak", "https://iptv-org.github.io/iptv/sources/uk_rakuten.m3u", "fast"),
    ("src_uksams", "https://iptv-org.github.io/iptv/sources/uk_samsung.m3u", "fast"),
    ("src_cgtn", "https://iptv-org.github.io/iptv/sources/cn_cgtn.m3u", "lists"),
    ("src_cctv", "https://iptv-org.github.io/iptv/sources/cn_cctv.m3u", "lists"),
    ("src_stingray", "https://iptv-org.github.io/iptv/sources/ca_stingray.m3u", "lists"),
    ("src_3abn", "https://iptv-org.github.io/iptv/sources/us_3abn.m3u", "lists"),
    ("src_abcnews", "https://iptv-org.github.io/iptv/sources/us_abcnews.m3u", "lists"),
    ("src_cbsn", "https://iptv-org.github.io/iptv/sources/us_cbsn.m3u", "lists"),
    ("anim", "https://iptv-org.github.io/iptv/categories/animation.m3u", "topics"),
    ("classic", "https://iptv-org.github.io/iptv/categories/classic.m3u", "topics"),
    ("comedy", "https://iptv-org.github.io/iptv/categories/comedy.m3u", "topics"),
    ("series", "https://iptv-org.github.io/iptv/categories/series.m3u", "topics"),
    ("interactive", "https://iptv-org.github.io/iptv/categories/interactive.m3u", "topics"),
    ("at", "https://iptv-org.github.io/iptv/countries/at.m3u", "places"),
    ("ch", "https://iptv-org.github.io/iptv/countries/ch.m3u", "places"),
    ("dk", "https://iptv-org.github.io/iptv/countries/dk.m3u", "places"),
    ("no", "https://iptv-org.github.io/iptv/countries/no.m3u", "places"),
    ("se", "https://iptv-org.github.io/iptv/countries/se.m3u", "places"),
    ("uy", "https://iptv-org.github.io/iptv/countries/uy.m3u", "places"),
    ("ec", "https://iptv-org.github.io/iptv/countries/ec.m3u", "places"),
    ("py", "https://iptv-org.github.io/iptv/countries/py.m3u", "places"),
    ("am", "https://iptv-org.github.io/iptv/countries/am.m3u", "places"),
    ("by", "https://iptv-org.github.io/iptv/countries/by.m3u", "places"),
    ("sn", "https://iptv-org.github.io/iptv/countries/sn.m3u", "places"),
    ("cm", "https://iptv-org.github.io/iptv/countries/cm.m3u", "places"),
    ("ci", "https://iptv-org.github.io/iptv/countries/ci.m3u", "places"),
    ("ao", "https://iptv-org.github.io/iptv/countries/ao.m3u", "places"),
    ("mz", "https://iptv-org.github.io/iptv/countries/mz.m3u", "places"),
    ("zw", "https://iptv-org.github.io/iptv/countries/zw.m3u", "places"),
    ("ftv_ph", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_philippines.m3u8", "lists"),
    ("ftv_kr", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_south_korea.m3u8", "lists"),
    ("ftv_sg", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_singapore.m3u8", "lists"),
    ("ftv_ua", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_ukraine.m3u8", "lists"),
    ("ftv_rs", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_serbia.m3u8", "lists"),
    ("ftv_ch", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_switzerland.m3u8", "lists"),
    ("ftv_nz", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_new_zealand.m3u8", "lists"),
    ("ftv_za", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_south_africa.m3u8", "lists"),
    ("ftv_co", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_colombia.m3u8", "lists"),
    ("ftv_pe", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_peru.m3u8", "lists"),
    ("ftv_pk", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_pakistan.m3u8", "lists"),
    ("ftv_id", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_indonesia.m3u8", "lists"),
    ("ftv_my", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_malaysia.m3u8", "lists"),
    ("ftv_ma", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_morocco.m3u8", "lists"),
    ("mjh_plex", "https://i.mjh.nz/Plex/us.m3u8", "fast"),
    ("mjh_sams", "https://i.mjh.nz/SamsungTVPlus/us.m3u8", "fast"),
    ("mjh_pluto", "https://i.mjh.nz/PlutoTV/us.m3u8", "fast"),
    ("mjh_stirr", "https://i.mjh.nz/Stirr/all.m3u8", "fast"),
    ("roku_bcc", "https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/main/playlists/roku_all.m3u", "fast"),
    ("pluto_bcc", "https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/main/playlists/plutotv_us.m3u", "fast"),
    ("sams_bcc", "https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/main/playlists/samsungtvplus_us.m3u", "fast"),
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
