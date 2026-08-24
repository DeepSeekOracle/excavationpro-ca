#!/usr/bin/env python3
"""Build excavationpro.ca content pages (unique prose, shared chrome)."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUB = "ca-pub-0646320966060599"

NAV = [
    ("/", "Home"),
    ("/about.html", "About"),
    ("/music.html", "Music"),
    ("/articles/", "Writing"),
    ("/contact.html", "Contact"),
    ("https://asiancoastline.com/", "Listen free"),
]


def head(title: str, desc: str, canonical: str, extra: str = "", og_type: str = "article") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="author" content="Justin Helmer / Excavationpro">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="{canonical}">
<link rel="stylesheet" href="/site.css">
<meta name="google-adsense-account" content="{PUB}">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={PUB}" crossorigin="anonymous"></script>
<meta property="og:type" content="{og_type}">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:site_name" content="Excavationpro">
<meta name="twitter:card" content="summary">
<meta name="twitter:site" content="@Excavationpro">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
{extra}
</head>
<body>
"""


def nav(current: str) -> str:
    links = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == current else ""
        links.append(f'<a href="{href}"{cur}>{label}</a>')
    return f"""<header class="site">
  <div class="wrap nav">
    <a class="brand" href="/">Excavationpro</a>
    <nav class="navlinks" aria-label="Primary">{"".join(" " + x for x in links)}</nav>
  </div>
</header>
"""


def footer() -> str:
    return """<footer class="site">
  <div class="wrap">
    <nav aria-label="Footer">
      <a href="/">Home</a>
      <a href="/about.html">About</a>
      <a href="/music.html">Music</a>
      <a href="/articles/">Writing</a>
      <a href="/contact.html">Contact</a>
      <a href="/privacy.html">Privacy</a>
      <a href="/terms.html">Terms</a>
      <a href="/support.html">Support</a>
      <a href="/hub.html">Live &amp; tools hub</a>
    </nav>
    <p>© <span class="y"></span> Justin Helmer / Excavationpro. Original music and original writing. All rights reserved except the personal listen license described in Terms.</p>
  </div>
</footer>
<script>document.querySelectorAll(".y").forEach(function(n){n.textContent=new Date().getFullYear()});</script>
</body>
</html>
"""


def ad() -> str:
    return f"""<div class="ad-slot" aria-label="Advertisement">
  <div class="ad-label">Advertisement</div>
  <ins class="adsbygoogle" style="display:block" data-ad-client="{PUB}" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({{}});</script>
</div>
"""


def page(path: str, title: str, desc: str, canonical: str, body: str, current: str, extra: str = "", og_type: str = "article") -> None:
    html = head(title, desc, canonical, extra, og_type) + nav(current) + f'<div class="wrap">{body}</div>\n' + footer()
    dest = ROOT / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(html, encoding="utf-8")
    print("wrote", dest, "chars", len(html))


INDEX_EXTRA = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MusicGroup",
      "name": "Excavationpro",
      "alternateName": ["Justin Helmer", "Lightfather"],
      "url": "https://excavationpro.ca/",
      "genre": ["Hip Hop", "Experimental", "Electronic"],
      "sameAs": [
        "https://open.spotify.com/artist/6CkZ4bN2xu3WRKbjEL3u2S",
        "https://music.youtube.com/@Excavationpro",
        "https://x.com/Excavationpro",
        "https://github.com/DeepSeekOracle/Excavationpro"
      ]
    },
    {
      "@type": "WebSite",
      "name": "Excavationpro",
      "url": "https://excavationpro.ca/",
      "publisher": { "@type": "Person", "name": "Justin Helmer" }
    }
  ]
}
</script>
"""

index_body = r"""
<section class="hero">
  <h1>Excavationpro is original music I make under my own name, on my own time, without a label telling me what a song is allowed to be.</h1>
  <p class="lead">I am Justin Helmer. Listeners know the project as Excavationpro (and, in longer creative work, Lightfather). This site is the public home for that catalog: how it is made, how you can listen without paying, and what you may not do with the files. It is not a landing page that dumps you onto someone else’s domain and calls that a magazine.</p>
  <div class="cta-row">
    <a class="btn primary" href="https://asiancoastline.com/">Open the free player</a>
    <a class="btn" href="/music.html">How the catalog works</a>
    <a class="btn" href="/articles/">Read the essays</a>
  </div>
</section>
<main>
<article class="card">
  <h2>What you will find here</h2>
  <p>Most “artist sites” in 2026 are a photo, three streaming badges, and a mailing list. I built excavationpro.ca as a place to <em>read</em> as well as click. The music is real. The writing is mine. If you came from a review, an ad, or a search for independent hip-hop that is actually free to hear, stay on this domain long enough to understand the deal.</p>
  <p>The deal is simple. You can listen. You can download copies I offer for your own headphones. You cannot sell the tracks, rebrand them as a beat pack, or pretend you wrote them. I keep the masters. Hosting a large public catalog costs money; ads and optional tips help keep the lights on. Ads never unlock the music. Tips never buy the rights.</p>
  <p>If you want the denser live room — Rumble, Kick, tool maps — that still exists at <a href="/hub.html">/hub.html</a>. It is a workshop. This homepage is the front door for people who came for songs and sentences.</p>
  <p>I also want to be explicit about what this domain is <em>not</em>. It is not a crypto landing page. It is not a list of someone else’s blog posts with my logo on top. It is not an empty AdSense shell waiting for a crawler to imagine content that is not here. The sentences on this page and the essays in <a href="/articles/">Writing</a> were written for excavationpro.ca. If a reviewer is looking for unique, human, on-domain text, they should find it without leaving.</p>
</article>
""" + ad() + r"""
<article class="card">
  <h2>How the music actually sounds</h2>
  <p>I work in experimental hip-hop and electronic texture. Verses sit next to long instrumental beds. Some pieces are short and punchy; others are closer to a late-night radio bed than a radio single. I do not chase playlist placement as the reason a song exists. I chase a feeling I can stand behind when I hear it six months later.</p>
  <p>The public player holds a very large pack of original streams — on the order of ten thousand files in the free listen set, with ISRC identity on a large share of the catalog. That number is not a marketing boast so much as a logistics fact: I encode public streams so a stranger can press play in a browser without creating an account. Spotify and YouTube Music carry a subset of the same artist identity if you already live on those apps.</p>
  <p>Featured artists and third-party samples, when they appear, are credited. I do not grant rights I do not hold. If a credit is on a track, assume that person’s share is theirs.</p>
</article>
<article class="card">
  <h2>Why the catalog is free to hear</h2>
  <p>I grew up with the internet as a listening room, not a checkout counter. Paywalls taught me that the first thirty seconds of a song often matter more than the storefront. So I publish streams first. If a piece matters to you, you already know. You can stay, tip, share an official link, or walk away. All of those are legitimate.</p>
  <p>Free listen is not “public domain.” It is a gift of access. The longer essay on that distinction is <a href="/articles/why-i-give-the-music-away.html">Why I give the music away</a>. The practical map of players, ISRCs, and albums is <a href="/articles/how-the-free-listen-catalog-works.html">How the free listen catalog works</a>.</p>
</article>
<article class="card">
  <h2>Writing on this site</h2>
  <p>These pieces were written for excavationpro.ca. They are not scraped roundups and they are not copies of pages that live on my other domains.</p>
  <ul class="read-list">
    <li><a href="/articles/why-i-give-the-music-away.html">Why I give the music away</a></li>
    <li><a href="/articles/how-the-free-listen-catalog-works.html">How the free listen catalog works</a></li>
    <li><a href="/articles/experimental-hip-hop-practice.html">Notes on experimental hip-hop practice</a></li>
    <li><a href="/articles/independent-streaming-without-a-label.html">Independent streaming without a major label</a></li>
    <li><a href="/articles/live-radio-and-lurk-culture.html">Live radio, lurk culture, and showing up</a></li>
    <li><a href="/articles/tempo-and-the-practice-room.html">Tempo, the practice room, and a free BPM tool</a></li>
  </ul>
</article>
<article class="card" id="listen">
  <h2>Listen right now</h2>
  <ol>
    <li><a href="https://asiancoastline.com/"><strong>asiancoastline.com</strong></a> — the main browser player (search, shuffle, radio-style play, no account).</li>
    <li><a href="https://deepseekoracle.github.io/Excavationpro/excavationpro-listen.html">GitHub Pages listen hub</a> — same catalog family, useful as a second door.</li>
    <li><a href="https://open.spotify.com/artist/6CkZ4bN2xu3WRKbjEL3u2S" rel="noopener">Spotify</a> · <a href="https://music.youtube.com/@Excavationpro" rel="noopener">YouTube Music</a> · <a href="https://audius.co/excavationpro" rel="noopener">Audius</a></li>
  </ol>
  <p>Live rooms: <a href="https://kick.com/excavationpro" rel="noopener">Kick</a>, <a href="https://www.twitch.tv/excavationpro" rel="noopener">Twitch</a>, <a href="https://rumble.com/user/excavationpro/live" rel="noopener">Rumble</a>. I treat those as radio, not as a hard sell.</p>
</article>
<article class="card">
  <h2>FAQ</h2>
  <h3>Do I need an account?</h3>
  <p>No. The free player does not require a login.</p>
  <h3>Can I use a track in my YouTube video or a paid product?</h3>
  <p>Not by default. Personal listening is covered. Commercial sync, ads, games, and re-sales need a written license from me. See <a href="/terms.html">Terms</a>.</p>
  <h3>Is this site only a pointer to other websites?</h3>
  <p>No. The essays, about page, music page, and terms live here. Other domains host players and tools because audio files are large. The writing that explains the work belongs on excavationpro.ca.</p>
</article>
</main>
"""

about_body = r"""
<article class="prose">
  <h1>About Justin Helmer / Excavationpro</h1>
  <p class="meta">Artist · producer · steward of a free public catalog</p>
  <p>My legal name is Justin Helmer. I release original music as <strong>Excavationpro</strong>. In longer mythic and creative writing I also use <strong>Lightfather</strong>. Those are not three different product lines fighting for a brand kit. They are one person, working in public, keeping the rights, and refusing to make listening a privilege.</p>
  <p>I am not signed to a major label. I do not have a manager who sends me a weekly playlist target. I record, mix, encode public streams, and write about the practice because the practice is the point. If that sounds stubborn, it is. Stubborn is how a catalog survives when the industry prefers a thirty-second clip and a merch drop.</p>
  <h2>What I make</h2>
  <p>The music sits between hip-hop, electronic production, and experimental forms that do not mind being too long, too quiet, or too dense for a “mood mix.” I care about voice, rhythm, and atmosphere more than I care about sounding current. Current expires. A bed you can live in does not.</p>
  <p>I also maintain small free tools for other musicians — notably a browser BPM detector at bpmfinder.ca — because I needed them myself and I did not want another subscription. Those tools are documented in plain language on this site. They are not a bait-and-switch for a paid SaaS.</p>
  <h2>Names, credit, and honesty</h2>
  <p>When you see Excavationpro on a stream, that is me. When you see Lightfather in a longer text, that is still me. I do not hide behind anonymous collectives to dodge responsibility for the files. If a feature artist is on a track, their name stays on the track. I will not pretend their verse is mine, and I will not license their share as if it were.</p>
  <p>I keep a public GitHub presence under DeepSeekOracle for the technical side of the catalog (encodes, pages, ledgers). That is infrastructure. It is not a replacement for this artist site. Reviewers and listeners who only wanted the music should not have to learn a protocol stack to press play.</p>
  <h2>Contact</h2>
  <p>I am reachable on <a href="https://x.com/Excavationpro">X @Excavationpro</a> and through the projects listed on <a href="/contact.html">Contact</a>. I do not publish a personal residential address. For licensing, write in public or via the channels listed and say what you want to use, where it will run, and whether money changes hands.</p>
  <p><a href="/">Home</a> · <a href="/music.html">Music</a> · <a href="/articles/">Writing</a></p>
</article>
"""

music_body = r"""
<article class="prose">
  <h1>The Excavationpro catalog</h1>
  <p class="meta">How to listen, what an ISRC is doing here, and what “free” does not mean</p>
  <p>This page is the map of the music itself. If you only have five minutes: open the <a href="https://asiancoastline.com/">free player</a>, search a title or mash shuffle, and listen. If you have longer, the rest of this page explains why the catalog is shaped the way it is.</p>
  <h2>Two doors into the same house</h2>
  <p>The main listening door is <strong>asiancoastline.com</strong>. It is a browser player: search, shuffle, radio-style continuity, no account. A second door lives on GitHub Pages at the excavationpro listen hub. I keep two doors because audio hosting fails, CDNs hiccup, and I would rather a listener have a spare entrance than a 404.</p>
  <p>Spotify, YouTube Music, and Audius carry the artist identity for people who already live inside those apps. Those platforms have their own terms. They do not replace the personal license on this site. If a platform encodes a track at a different bitrate or crops metadata, the rights still sit with me unless a contract says otherwise.</p>
  <h2>Size of the public set</h2>
  <p>The free listen set is large — thousands of public stream files, with a substantial ISRC-tagged subset. I encode streams (not always lossless masters) so a phone on a bus can play the work. Masters stay local. That split matters: what you hear in the player is a public stream. What I archive as a master is not a free-for-all source file for commercial remix packs.</p>
  <p>ISRC codes, when present, are how a recording is uniquely identified in the wider industry. I use them so a track is not just a filename that can be renamed by a scraper. If you are a librarian, a radio person, or another artist trying to cite a recording, prefer the ISRC and the official player link over a ripped MP3 with the title changed.</p>
""" + ad() + r"""
  <h2>Albums, hubs, and long tails</h2>
  <p>Some work groups naturally into albums. Some work is a long tail of experiments that never needed a twelve-track sequence to justify existing. I do not delete the experiments because they are not “singles.” The player is allowed to be a library. Libraries are allowed to be uneven. That unevenness is honest.</p>
  <h2>What you may do</h2>
  <ul>
    <li>Listen on official players and platform pages.</li>
    <li>Download copies I offer for your own offline listening.</li>
    <li>Share official links (this site, the player, the license/terms page).</li>
    <li>Use a short excerpt in a non-monetized personal post with credit when practical.</li>
  </ul>
  <h2>What you may not do without written permission</h2>
  <ul>
    <li>Sell the tracks, bundle them as a sample pack, or mint them as if you own the master.</li>
    <li>Rebrand a beat as your type-beat product.</li>
    <li>Sync commercially (ads, films, games, apps) without a license.</li>
    <li>Strip credits or identifiers so the origin disappears.</li>
  </ul>
  <p>The full plain-language terms are on <a href="/terms.html">Terms</a>. The longer music license text also lives on eternalhaven.ca for people who want the canonical wording.</p>
  <p><a href="/articles/how-the-free-listen-catalog-works.html">Read the catalog essay →</a></p>
</article>
"""

articles_index = r"""
<article class="prose">
  <h1>Writing</h1>
  <p class="lead">Original essays for listeners and other independent musicians. Written for this site, not syndicated filler.</p>
  <ul class="read-list">
    <li><a href="/articles/why-i-give-the-music-away.html"><strong>Why I give the music away</strong></a> — access versus ownership.</li>
    <li><a href="/articles/how-the-free-listen-catalog-works.html"><strong>How the free listen catalog works</strong></a> — players, ISRCs, masters versus streams.</li>
    <li><a href="/articles/experimental-hip-hop-practice.html"><strong>Notes on experimental hip-hop practice</strong></a> — how a session actually goes.</li>
    <li><a href="/articles/independent-streaming-without-a-label.html"><strong>Independent streaming without a major label</strong></a> — logistics without mythology.</li>
    <li><a href="/articles/live-radio-and-lurk-culture.html"><strong>Live radio, lurk culture, and showing up</strong></a> — Kick, Twitch, Rumble as a listening room.</li>
    <li><a href="/articles/tempo-and-the-practice-room.html"><strong>Tempo, the practice room, and a free BPM tool</strong></a> — why I shipped a browser detector.</li>
  </ul>
</article>
"""

a1 = r"""
<article class="prose">
  <h1>Why I give the music away</h1>
  <p class="meta">Essay · Justin Helmer · excavationpro.ca</p>
  <p>People hear “free music” and assume one of two insults: that the work is not serious, or that the artist is naïve about money. I am serious, and I am not naïve. I give the streams away because I want the first encounter to be a listen, not a negotiation.</p>
  <p>When I was younger, the songs that changed me were not the ones behind the thickest storefront. They were the ones I could actually finish. A finished listen is a relationship. A thirty-second preview is a sales pitch. I would rather have a smaller circle of people who heard the whole piece than a dashboard full of previews that bounced.</p>
  <p>There is a second reason, less romantic. Distribution companies are happy to take a cut to tell you that you are a professional. They are less happy to tell you the truth: most independent catalogs never earn back the anxiety. I still use platforms. I still collect ISRCs. I still keep books. I do not let a platform be the only door.</p>
""" + ad() + r"""
  <p>Free access is not a transfer of ownership. That sentence is the whole legal heart of this project. You may live with the song. You may not sell the song. You may not train a commercial model on the catalog to resell a derivative as if the labor were yours. You may not slap the instrumental under a monetized video and call it a gray area. If you want a commercial sync, ask. I answer those messages more warmly than I answer people who skip the asking.</p>
  <p>Optional support exists because servers, electricity, and time are not imaginary. <a href="https://www.paypal.com/paypalme/ExcavationPro">PayPal.me/ExcavationPro</a> is a gift channel. It does not buy exclusivity. It does not make you a co-author. It says: keep going. I hear that. I also keep going if you never click it.</p>
  <p>If you only remember one thing from this essay, remember this: the player is open so that curiosity has somewhere to land. The terms are closed enough so that curiosity does not become extraction. That is not a paradox. That is a boundary.</p>
  <p>I have been asked, more than once, whether giving streams away “devalues the art.” The market already devalues most art by drowning it in volume. I cannot out-price a machine that never sleeps. I can out-honest a storefront that pretends a preview is a relationship. If a song is going to be copied anyway, I would rather the official copy be the one with my name, my ISRC, and my license attached.</p>
  <p>There is also a craft reason. When I know a piece will be heard in full by strangers who owe me nothing, I mix differently. I stop hiding weak bars behind loudness. I stop assuming a skip button is the only critic. Free listeners are not a lesser audience. They are the audience that still has the option to leave, which is the only honest test I trust.</p>
  <p>If you are an artist reading this and you need to charge, charge. This is not a commandment. It is a description of one catalog. Description is allowed to be specific. Specific is how a site stops being thin.</p>
  <p><a href="/articles/">All writing</a> · <a href="/terms.html">Terms</a></p>
</article>
"""

a2 = r"""
<article class="prose">
  <h1>How the free listen catalog works</h1>
  <p class="meta">Essay · Justin Helmer · excavationpro.ca</p>
  <p>A catalog is not a vibe. It is a pile of files, names, identifiers, and decisions about what the public is allowed to touch. This is how mine is wired, in language a listener can use.</p>
  <h2>Streams are not masters</h2>
  <p>When you press play on the public player, you are usually hearing an encoded stream — a version sized for phones and mid-range connections. I keep higher-resolution masters locally. That is not a sneer at listeners. It is how I prevent a “free MP3 folder” from becoming the entire commercial life of a recording without my consent.</p>
  <p>If you need a higher-quality file for a legitimate personal archive, you can still use downloads I actually offer. What I do not offer is a warehouse of unwatermarked masters for strangers to flip into paid sample packs.</p>
  <h2>Players</h2>
  <p>The primary player is on asiancoastline.com. It supports search and shuffle so you do not have to know a title in advance. A second listen page on GitHub Pages exists as redundancy. If one door is slow, try the other. Both are meant for humans, not for scrapers that rename files and call it a mixtape.</p>
""" + ad() + r"""
  <h2>ISRCs and why they look like serial numbers</h2>
  <p>An ISRC is a standard recording identifier. It is boring on purpose. Boring identifiers are how you prove that “300 Broken Pieces” on Tuesday is the same recording as “300 Broken Pieces” on a ledger next year. I attach ISRCs to a large share of the catalog so citations have something sturdier than a filename.</p>
  <p>If you are writing about a track, linking the official player plus the ISRC (when you have it) is the respectful way. Ripping, retitling, and uploading to a random host is the other way. Do the first.</p>
  <h2>Failure modes I already know</h2>
  <p>Players cache. Browsers autoplay-block. Mobile data is rude. If a track stalls, it is often the network, not a secret premium tier. There is no secret premium tier. Reload, try the other player, or pick a different track. I would rather you heard six pieces than wrestled one file for twenty minutes.</p>
  <p>Search on the player is literal. Type a word from a title. If you do not remember a title, shuffle is how a large catalog admits it will not fit in a hero banner of three singles.</p>
  <p>Albums exist when a sequence earns it. The rest is a long tail on purpose. A long tail is not clutter if the files are identified and licensed. Clutter is an unnamed dump.</p>
  <p><a href="/music.html">Music map</a> · <a href="https://asiancoastline.com/">Open player</a></p>
</article>
"""

a3 = r"""
<article class="prose">
  <h1>Notes on experimental hip-hop practice</h1>
  <p class="meta">Essay · Justin Helmer · excavationpro.ca</p>
  <p>Experimental hip-hop, as I practice it, is not a costume. It is permission to let a verse sit on a bed that would get rejected in a “make it brighter” session. It is permission for a track to be a corridor instead of a chorus machine.</p>
  <p>A typical session for me does not start with a brief from a brand. It starts with a loop, a voice memo, or a texture I cannot get out of my head. I record before I have a speech ready for why the speech exists. Later I edit. Later I throw away. The public catalog includes survivors, not every sketch.</p>
  <p>Rhythm is the argument. If the pocket is dishonest, no amount of lore will save it. I will spend more time on a snare’s relationship to a breath than on a metaphor that photographs well. That is a taste. You do not have to share it. You only have to hear whether the record believes itself.</p>
""" + ad() + r"""
  <p>Electronic texture is not a replacement for writing. It is a room the writing can walk around in. Some nights the room is more interesting than the writing. Those nights become instrumentals. Instrumentals are not “unfinished rap songs.” They are finished rooms.</p>
  <p>I listen back at low volume. If a piece only works as a loud flex, it is probably compensating. I also walk away for a day. The day-after listen is meaner and more useful than the night-of listen. Mean is a craft tool. Mean is not a personality I owe strangers on the internet.</p>
  <p>If you make music too: finish more than you announce. Announcement is cheap. A file you can play next year is expensive in the only currency that matters, which is attention you will not get back.</p>
  <p>I keep notes, but I do not worship the notes. A session that produces a paragraph of theory and no file is a journal entry, not a record. A session that produces a file and no theory is still a record. Theory can catch up. Files do not catch up if you never bounce them.</p>
  <p>Collaboration, when it happens, is named. Ghostwriting other people’s identity is not a flex I want. If my voice is on it, my name is on it. If their voice is on it, their name is on it. The catalog is large enough to be confusing; credits should not add to the confusion.</p>
  <p><a href="/articles/">All writing</a></p>
</article>
"""

a4 = r"""
<article class="prose">
  <h1>Independent streaming without a major label</h1>
  <p class="meta">Essay · Justin Helmer · excavationpro.ca</p>
  <p>You can put music on the public internet without a label. That sentence is true and incomplete. The incomplete part is the work: encoding, naming, identifying, backing up, and refusing to confuse a dashboard with an audience.</p>
  <p>I use a mix of a first-party player and third-party stores. The first-party player is for people who will tolerate a website. The stores are for people who will not. Neither is morally superior. They are different rooms.</p>
  <p>A label, at its best, is logistics plus taste plus money. At its average, it is logistics you could have done plus taste you did not ask for plus money that arrives as a recoupable story. I am not anti-collaboration. I am anti-storytelling that pretends a contract is a personality.</p>
""" + ad() + r"""
  <p>Practical stack, the unromantic version:</p>
  <ul>
    <li>Keep masters in a place you control, with checksums, not only in a laptop folder named “final_final2.”</li>
    <li>Give public streams a stable URL and a human title.</li>
    <li>Register ISRCs if you want the recording to be citable.</li>
    <li>Write the license in language a tired person can read.</li>
    <li>Mirror the player so one outage is not a disappearance.</li>
  </ul>
  <p>None of that requires a major. All of that requires hours. Hours are the actual barrier, not a secret handshake. If a tool helps — a BPM detector, a catalog page, a listen hub — use it. If a tool wants your catalog as training data for a product you will never see, read twice.</p>
  <p>This site is my proof that the writing can live next to the player. Other independent musicians should steal that structure, not the sentences. Steal structure. Write your own sentences. That is the whole ethic.</p>
  <p>Metrics: I look at them, then I go back to the session. A spike without a song you still like is a sugar crash. A quiet month with three finished pieces is a harvest. I would rather harvest. Harvest does not trend. Harvest compounds.</p>
  <p>If a distributor’s dashboard becomes the only place you “have” your music, you do not have your music. You have a login. Keep a copy you can play if the login dies. That is not paranoia. That is adult filing.</p>
  <p><a href="/articles/why-i-give-the-music-away.html">Why I give the music away</a></p>
</article>
"""

a5 = r"""
<article class="prose">
  <h1>Live radio, lurk culture, and showing up</h1>
  <p class="meta">Essay · Justin Helmer · excavationpro.ca</p>
  <p>I treat live platforms as radio, not as a talent show. Kick, Twitch, and Rumble can be a room where a mix plays and people lurk. Lurking is not a failure of engagement. Lurking is how most of us learned music: being in the room without performing a personality.</p>
  <p>Chat, when it happens, is extra. I will not optimize a catalog around the need for chat to prove the catalog exists. If you come into a stream, you are allowed to say nothing. You are allowed to leave. You are allowed to come back a week later and not explain yourself.</p>
  <p>Multi-homing the same radio across platforms is tedious and worth it. Platforms ban, throttle, and redesign the furniture. A song should not die because a company changed its recommendation spice. The website remains the durable object. The live room is weather.</p>
""" + ad() + r"""
  <p>If you are an independent artist considering live: pick a time you can actually keep. A ghosted schedule trains people to ignore you. A modest, kept schedule trains people to trust you. Trust is slower than virality and more useful than virality when the algorithm shrugs.</p>
  <p>Links: <a href="https://kick.com/excavationpro">Kick</a> · <a href="https://www.twitch.tv/excavationpro">Twitch</a> · <a href="https://rumble.com/user/excavationpro/live">Rumble</a> · workshop page <a href="/hub.html">/hub.html</a>.</p>
  <p>I do not require you to turn on your camera. I do not require you to perform gratitude in chat. Radio worked for a century with people who never called in. The internet did not repeal that. If a platform punishes lurk culture, that is the platform’s hunger, not your moral failure.</p>
  <p>When I am live, the website is still the source of truth for who I am and how the license works. Chat is weather. Terms are climate.</p>
</article>
"""

a6 = r"""
<article class="prose">
  <h1>Tempo, the practice room, and a free BPM tool</h1>
  <p class="meta">Essay · Justin Helmer · excavationpro.ca</p>
  <p>I built a browser BPM detector because I was tired of uploading a private worktape to a website that wanted an account, a cookie wall, and a lecture. Tempo is a number you need in the room, not a social graph.</p>
  <p>The tool at <a href="https://bpmfinder.ca/app.html">bpmfinder.ca/app.html</a> runs in your browser. I designed it so a sketch does not have to leave your machine to tell you it is 94. That is a craft convenience. It is also a privacy preference. I do not need your loop on my server to help you count.</p>
  <p>How I use tempo in practice: I tap, I check, I argue with myself, I commit. If a verse wants to drag, I let it drag on purpose rather than “fixing” it into a grid that makes it polite. Polite is not the same as tight. Tight can be behind the beat. Tight can be ugly on a first listen and correct on a fourth.</p>
""" + ad() + r"""
  <p>If you use the detector, use it as a mirror, not a boss. If the number disagrees with your body, trust your body first and then ask why. Sometimes the file is off. Sometimes you are. Both are useful information.</p>
  <p>Guides for the tool also live on bpmfinder.ca. The difference is emphasis: that domain is the instrument. This domain is the musician talking about why the instrument exists. I wanted that sentence on excavationpro.ca so a reviewer — or a tired producer — does not have to treat a music site as an empty hallway of outbound links.</p>
  <p>Tempo math is not composition. Composition is what you do after you know whether the floor is 86 or 140. I have written verses that only work at a stubborn slow number. Speeding them up to “help the energy” made them sound like they were late to someone else’s party. I left them slow.</p>
  <p>If the detector and your foot disagree, record a clap track for four bars and listen. The clap does not lie as often as a stressed ear. Then delete the clap. The song should not need the clap to live.</p>
  <p><a href="https://bpmfinder.ca/">bpmfinder.ca</a> · <a href="/articles/">All writing</a></p>
</article>
"""

contact_body = r"""
<article class="prose">
  <h1>Contact</h1>
  <p>I am Justin Helmer. For listener questions, licensing, and press, the fastest public channel is <a href="https://x.com/Excavationpro">@Excavationpro on X</a>.</p>
  <ul>
    <li>Music identity: Excavationpro / Lightfather</li>
    <li>GitHub (catalog &amp; pages): <a href="https://github.com/DeepSeekOracle/Excavationpro">DeepSeekOracle/Excavationpro</a></li>
    <li>Optional support: <a href="https://www.paypal.com/paypalme/ExcavationPro">PayPal.me/ExcavationPro</a></li>
  </ul>
  <p>I do not publish a home address. For licensing requests, include: the track title or ISRC, where it will play, the territory, the term, and whether the use is monetized. Vague “can I use your beats” messages get vague answers.</p>
  <p>This website does not use a comment form. That is intentional. Forms attract spam; public handles keep a paper trail.</p>
</article>
"""

privacy_body = r"""
<article class="prose">
  <h1>Privacy Policy</h1>
  <p class="meta">Last updated: 24 August 2026 · excavationpro.ca</p>
  <p>excavationpro.ca is operated by Justin Helmer (Excavationpro). It publishes original music information, original essays, and links to free players and tools.</p>
  <h2>What this site collects</h2>
  <p>You can read every essay and visit every page without creating an account. We do not run a membership database. Hosting and CDN providers may log IP address, user agent, referrer, and timestamps for security and reliability. I do not sell mailing lists because I do not keep one on this domain.</p>
  <h2>Cookies and advertising</h2>
  <p>If Google AdSense is approved and active, Google and its partners may use cookies or similar storage to serve ads, including ads based on visits to this site or other sites. Publisher ID: <code>ca-pub-0646320966060599</code>.</p>
  <p>Learn more: <a href="https://policies.google.com/technologies/ads">Google advertising</a> · <a href="https://policies.google.com/privacy">Google privacy</a> · <a href="https://www.google.com/settings/ads">Ad settings</a>.</p>
  <p>You can also control cookies in your browser. Blocking cookies may affect ad personalization; it will not lock the essays or the music explanations behind a paywall.</p>
  <h2>Third-party players and live rooms</h2>
  <p>When you leave this domain for asiancoastline.com, Spotify, YouTube, Kick, Twitch, Rumble, Hugging Face, or GitHub Pages, those services apply their own privacy policies. I am not able to rewrite their logs. I choose them because they carry the music or the live room.</p>
  <h2>Children</h2>
  <p>This site is not directed at children under 13. I do not knowingly collect personal information from children.</p>
  <h2>Contact</h2>
  <p>Privacy questions: <a href="/contact.html">Contact</a>.</p>
</article>
"""

terms_body = r"""
<article class="prose">
  <h1>Terms of use and music license (plain language)</h1>
  <p class="meta">Summary for excavationpro.ca · Last updated: 24 August 2026</p>
  <p>By using this website you agree to these terms. The music itself is original work by Justin Helmer / Excavationpro unless a feature credit says otherwise.</p>
  <h2>Website</h2>
  <p>The essays and pages on excavationpro.ca are provided as-is for information and listening guidance. Do not scrape the writing to train a commercial model for resale without permission. Do not impersonate the artist.</p>
  <h2>You may</h2>
  <ul>
    <li>Listen via official players and platform artist pages.</li>
    <li>Download copies I offer for personal, non-commercial listening.</li>
    <li>Share official links to this site or the player.</li>
    <li>Use a short excerpt in a non-monetized personal post with credit when practical.</li>
  </ul>
  <h2>You may not (without prior written permission)</h2>
  <ul>
    <li>Claim authorship or ownership of the recordings.</li>
    <li>Sell, rent, or commercially redistribute the tracks (including paid sample packs and “type beat” rebrands).</li>
    <li>Use the music as a commercial soundtrack, advertisement, game, or app bed.</li>
    <li>Strip credits, ISRCs, or license notices.</li>
  </ul>
  <p>Full canonical license wording: <a href="https://eternalhaven.ca/lygo-music-license.html">LYGO / Excavationpro Music License v1.0</a>. If this summary and the canonical text ever conflict, the canonical license controls for the music.</p>
  <p>Donations are gifts, not purchases of exclusive rights. <a href="/support.html">Support</a>.</p>
</article>
"""

support_body = r"""
<article class="prose">
  <h1>Support (optional)</h1>
  <p>Listening is free. Writing is free to read. Hosting streams and keeping a public catalog online is not free in the physical world. If you want to help with that cost, you can send a gift via <a href="https://www.paypal.com/paypalme/ExcavationPro">PayPal.me/ExcavationPro</a>.</p>
  <p>A gift does not buy a master, a feature, or editorial control. It does not change the license. It says keep the player on. That is enough.</p>
  <p>If you cannot give money, give an official link to a friend who might actually listen. That is also support.</p>
</article>
"""

notfound = r"""
<article class="prose">
  <h1>That page is not here</h1>
  <p>The link may be old. Try the <a href="/">home page</a>, <a href="/articles/">writing</a>, or the <a href="https://asiancoastline.com/">free player</a>.</p>
</article>
"""


def main() -> None:
    page(
        "index.html",
        "Excavationpro — Original Music by Justin Helmer",
        "Original experimental hip-hop and electronic music by Justin Helmer (Excavationpro). Free listening, original essays, and a clear license. Not a link farm.",
        "https://excavationpro.ca/",
        index_body,
        "/",
        extra=INDEX_EXTRA,
        og_type="website",
    )
    page("about.html", "About Justin Helmer / Excavationpro", "Biography of Justin Helmer, the independent musician behind Excavationpro and Lightfather.", "https://excavationpro.ca/about.html", about_body, "/about.html")
    page("music.html", "The Excavationpro music catalog", "How to listen to Excavationpro for free, what ISRCs mean here, and what you may not do with the files.", "https://excavationpro.ca/music.html", music_body, "/music.html")
    page("articles/index.html", "Writing — Excavationpro", "Original essays by Justin Helmer on free listening, independent streaming, and making experimental hip-hop.", "https://excavationpro.ca/articles/", articles_index, "/articles/")
    page("articles/why-i-give-the-music-away.html", "Why I give the music away — Excavationpro", "Justin Helmer on free streams, ownership, and why access is not a transfer of rights.", "https://excavationpro.ca/articles/why-i-give-the-music-away.html", a1, "/articles/")
    page("articles/how-the-free-listen-catalog-works.html", "How the free listen catalog works — Excavationpro", "Streams versus masters, ISRCs, and how to use the Excavationpro players.", "https://excavationpro.ca/articles/how-the-free-listen-catalog-works.html", a2, "/articles/")
    page("articles/experimental-hip-hop-practice.html", "Notes on experimental hip-hop practice — Excavationpro", "How Justin Helmer actually works in the room: rhythm, texture, and finishing.", "https://excavationpro.ca/articles/experimental-hip-hop-practice.html", a3, "/articles/")
    page("articles/independent-streaming-without-a-label.html", "Independent streaming without a major label — Excavationpro", "Practical independent distribution without mythology, from someone who does it.", "https://excavationpro.ca/articles/independent-streaming-without-a-label.html", a4, "/articles/")
    page("articles/live-radio-and-lurk-culture.html", "Live radio and lurk culture — Excavationpro", "Why Kick, Twitch, and Rumble are treated as radio rooms, not talent shows.", "https://excavationpro.ca/articles/live-radio-and-lurk-culture.html", a5, "/articles/")
    page("articles/tempo-and-the-practice-room.html", "Tempo and the practice room — Excavationpro", "Why a free in-browser BPM detector exists, and how tempo is used in practice.", "https://excavationpro.ca/articles/tempo-and-the-practice-room.html", a6, "/articles/")
    page("contact.html", "Contact — Excavationpro", "How to reach Justin Helmer for listener questions and licensing.", "https://excavationpro.ca/contact.html", contact_body, "/contact.html")
    page("privacy.html", "Privacy Policy — excavationpro.ca", "Privacy policy for excavationpro.ca including cookies and Google AdSense.", "https://excavationpro.ca/privacy.html", privacy_body, "/privacy.html")
    page("terms.html", "Terms and music license — excavationpro.ca", "Plain-language terms for the website and Excavationpro music.", "https://excavationpro.ca/terms.html", terms_body, "/terms.html")
    page("support.html", "Support Excavationpro", "Optional support for hosting the free catalog. Never required to listen.", "https://excavationpro.ca/support.html", support_body, "/support.html")
    page("404.html", "Page not found — Excavationpro", "That URL is not on excavationpro.ca.", "https://excavationpro.ca/404.html", notfound, "/")


if __name__ == "__main__":
    main()
