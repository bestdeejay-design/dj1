#!/usr/bin/env python3
"""build_corpus.py — сборка корпуса треков из data/tags-data.json.

Источник (single source of truth): data/tags-data.json в корне dj1
(выгрузка из api.dj1.ru, срез указан в поле generatedAt).

Выход: brain/corpus/tracks.jsonl — по одной JSON-записи на трек:
  id, name, model, duration, plays, favorites, score,
  sound (полный промт), lyrics_len,
  parsed: { bpm, genres[], instruments[], mood[], character[], era[],
            vocal{gender,styles[]}, lyrics_language, negative[] },
  orig_tags: {категория: [теги]} — инвертированная старая таксономия dj1.

Лирику НЕ дублируем (она уже в data/tags-data.json по id) — только длину.

Запуск:  python3 brain/tools/build_corpus.py
"""
import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "data", "tags-data.json")
DST = os.path.join(ROOT, "brain", "corpus", "tracks.jsonl")

# ---------------------------------------------------------------- vocabularies

GENRES = [
    # multi-word first (longest match wins)
    "progressive house", "electro swing", "psychedelic soul", "northern soul",
    "neo soul", "soulful house", "minimal techno", "detroit techno",
    "acid techno", "hard techno", "deep techno", "tech house", "deep house",
    "bass house", "future house", "tropical house", "afro house",
    "acid house", "tribal house", "jazzy house", "garage house",
    "progressive trance", "uplifting trance", "tech trance", "psytrance",
    "dark trance", "eurodance", "italo disco", "nu disco", "synth pop",
    "dream pop", "indie pop", "dance pop", "electropop", "hyperpop",
    "future pop", "french pop", "city pop", "synthwave", "retrowave",
    "vaporwave", "chillwave", "coldwave", "new wave", "post-punk",
    "post-rock", "math rock", "indie rock", "garage rock", "punk rock",
    "hard rock", "classic rock", "blues rock", "folk rock", "space rock",
    "psychedelic rock", "progressive rock", "krautrock", "art rock",
    "glam rock", "stadium rock", "heavy metal", "thrash metal",
    "doom metal", "black metal", "death metal", "metalcore", "nu metal",
    "grunge", "shoegaze", "drum and bass", "liquid dnb", "neurofunk",
    "breakbeat", "big beat", "jazz fusion", "jazz hop",
    "smooth jazz", "cool jazz", "bebop", "bossa nova", "lounge lo-fi",
    "lo-fi hip hop", "boom bap", "cloud rap", "jazz rap", "trap house",
    "phonk", "memphis rap", "gangsta rap", "horrorcore", "conscious rap",
    "uk garage", "future garage", "2-step garage", "speed garage",
    "future bass", "melodic dubstep", "big room", "hardstyle", "russian rock",
    "soviet rock", "russian folk", "nordic folk", "acid jazz",
    "dark ambient", "psych folk", "singer-songwriter",
    "power ballad", "epic trance", "afrobeat",
    "amapiano", "reggaeton", "dancehall", "rocksteady", "dub reggae",
    "chillhop", "jazzhop", "trip-hop", "downtempo", "chillout", "ambient",
    "industrial", "ebm", "idm", "glitch", "electro",
    "electronica", "electronic", "club", "techno", "house", "trance", "dubstep", "drill",
    "grime", "trap", "hip hop", "hip-hop", "r&b", "funk", "disco",
    "boogie", "soul", "motown", "gospel", "jazz", "swing", "blues",
    "country", "folk", "bluegrass", "reggae", "dub", "ska", "rock",
    "pop", "rap", "edm", "hardcore", "classical", "neoclassical",
    "baroque", "opera", "chanson", "romance", "lounge", "lo-fi", "lofi",
    "ballad", "waltz", "tango", "flamenco", "fado", "march", "anthem",
    "tribal", "ethnic", "oriental", "cinematic orchestra",
    "orchestral", "soundtrack", "score",
]

INSTRUMENTS = [
    "electric guitar", "acoustic guitar", "slide guitar", "wah-wah guitar",
    "bass guitar", "fender bass", "upright bass", "double bass", "sub bass",
    "808", "909", "hammond organ", "hammond", "leslie", "rhodes",
    "wurlitzer", "wurli", "grand piano", "piano", "organ", "synth bass",
    "analog synth", "moog", "arpeggio", "arp", "pads", "strings", "cello",
    "violin", "viola", "brass", "trumpet", "saxophone", "sax", "trombone",
    "french horn", "flute", "clarinet", "harmonica", "harp", "mandolin",
    "banjo", "accordion", "kalimba", "marimba", "vibraphone", "xylophone",
    "glockenspiel", "celesta", "theremin", "mellotron", "vinyl crackle",
    "tape hiss", "turntable", "scratch", "cowbell", "tambourine", "shaker",
    "bongos", "congas", "djembe", "tabla", "sitar", "oud", "duduk", "koto",
    "shamisen", "erhu", "bagpipes", "hi-hat", "hihat", "ride cymbal",
    "crash cymbal", "snare", "kick", "clap", "percussion", "drums",
    "synth", "guitar", "bass", "keys", "bell", "chimes",
]

MOOD = [
    "hypnotic", "cinematic", "dark", "ethereal", "dreamy", "melancholic",
    "melancholy", "warm", "euphoric", "nostalgic", "sensual", "cold",
    "aggressive", "energetic", "relaxing", "uplifting", "mysterious",
    "mystical", "epic", "heroic", "sad", "happy", "playful", "romantic",
    "seductive", "introspective", "meditative", "haunting", "gritty",
    "smooth", "cosmic", "futuristic", "retro", "summery", "nocturnal",
    "urban", "pastoral", "emotional", "atmospheric", "groovy", "surreal",
    "psychedelic", "contemplative", "brooding",
    "desolate", "triumphant", "menacing", "serene", "joyful", "yearning",
]

CHARACTER = [
    "analog warmth", "analog", "tape-saturated", "tape saturation", "tape",
    "vinyl", "lo-fi", "lofi", "hi-fi", "vintage production", "vintage",
    "modern production", "polished", "raw", "live", "basement studio",
    "worn", "dusty", "grainy", "soft", "punchy", "tight", "liquid",
    "wet", "dry", "wide", "compressed", "saturated",
    "reverb-heavy", "tape echo", "space echo", "spring reverb",
    "close-mic", "room sound", "binaural", "stereo",
]

VOCAL_PATTERNS = [
    ("male baritone", [r"\bmale baritone\b", r"\bbaritone\b"]),
    ("male tenor", [r"\bmale tenor\b", r"\btenor\b"]),
    ("male vocals", [r"\bmale vocals?\b", r"\bmale voices?\b",
                     r"\bmale singer\b",
                     r"\bmale (?:lead|backing|harmony) vocals?\b",
                     r"\bmale (?:falsetto|whisper|spoken|rap)\b"]),
    ("female vocals", [r"\bfemale vocals?\b", r"\bfemale voices?\b",
                       r"\bfemale singer\b",
                       r"\bfemale (?:lead|backing|harmony) vocals?\b",
                       r"\bfemale (?:falsetto|whisper|spoken|rap|vocal)\b",
                       r"\bsoprano\b", r"\balto\b", r"\bmezzo\b"]),
    ("choir", [r"\bchoir\b", r"\bchoral\b"]),
    ("whisper", [r"\bwhisper\b"]),
    ("spoken word", [r"spoken word", r"spoken-sung", r"spoken sung",
                     r"spoken rap", r"\bnarration\b", r"\bnarrated\b"]),
    ("rap", [r"\brap\b", r"\brapping\b", r"\bflow\b"]),
    ("backing vocals", [r"\bbacking vocals?\b", r"\bbackups?\b",
                        r"\bharmonies\b"]),
    ("falsetto", [r"\bfalsetto\b"]),
    ("vocal", [r"\bvocals?\b", r"\bvoices?\b", r"\bsinging\b", r"\bsung\b"]),
]

VOCAL_NONE = ["instrumental", "no vocals", "no vocal", "no lyrics",
              "without vocals"]

# negative constraints: "no X", "without X"
NEG_RE = re.compile(r"\b(?:no|without)\s+([a-z][a-z\- ]{1,28}?)(?=[,.]|$)",
                    re.IGNORECASE)
BPM_RE = re.compile(r"\b(\d{2,3})\s*bpm\b", re.IGNORECASE)
ERA_RE = re.compile(
    r"\b(19[0-9]0s|20[0-2]0s|[5-9]0s|60s|2000s|2010s|2020s)\b")

FR_WORDS = {"je", "tu", "toi", "nous", "vous", "dans", "avec", "pour",
            "amour", "nuit", "coeur", "cœur", "rêves", "être", "c'est",
            "mais", "tout", "rien", "sans", "vie", "chanson", "belle"}
DE_WORDS = {"ich", "dich", "mich", "nicht", "und", "der", "die", "das",
            "mit", "für", "nacht", "liebe", "herz", "schön"}
ES_WORDS = {"que", "para", "corazón", "corazon", "noche", "amor", "vida",
            "mi", "tu", "eres", "mundo", "canción", "cancion", "bella"}
RU_SAMPLE = "абвгдежзиклмнопрстуфхцчшщэюя"

GENRES_SORTED = sorted(set(GENRES), key=len, reverse=True)
INSTRUMENTS_SORTED = sorted(set(INSTRUMENTS), key=len, reverse=True)


def match_vocabulary(text, vocab_sorted):
    found = []
    for item in vocab_sorted:
        pat = r"\b" + re.escape(item) + r"\b"
        if re.search(pat, text, re.IGNORECASE):
            found.append(item)
    return found


def strip_negatives(text):
    """Убирает негативные указания ('no falsetto') до сопоставления стилей,
    чтобы запрет не считался использованием."""
    return NEG_RE.sub(" ", text)


def parse_vocal(text):
    clean = strip_negatives(text)
    low = " " + clean.lower() + " "
    styles = []
    for style, pats in VOCAL_PATTERNS:
        if any(re.search(p, low) for p in pats):
            styles.append(style)
    has_male = any(s in styles for s in
                   ("male baritone", "male tenor", "male vocals"))
    has_female = "female vocals" in styles
    none_kw = any(v in low for v in VOCAL_NONE)
    if none_kw and not styles:
        gender = "none"
    elif has_male and has_female:
        gender = "mixed"
    elif has_male:
        gender = "male"
    elif has_female:
        gender = "female"
    elif styles:
        gender = "unspecified"
    else:
        gender = "unknown"
    return {"gender": gender, "styles": styles}


def detect_language(lyrics):
    if not lyrics:
        return "unknown"
    text = lyrics[:4000].lower()
    cyr = sum(1 for c in text if c in RU_SAMPLE)
    lat = sum(1 for c in text if "a" <= c <= "z")
    total = cyr + lat
    if total == 0:
        return "unknown"
    cyr_ratio = cyr / total
    if cyr_ratio > 0.85:
        return "ru"
    if 0.15 < cyr_ratio <= 0.85:
        return "mixed"
    words = re.findall(r"[a-zàâçéèêëîïôùûüßñáíóú]+", text)
    if not words:
        return "unknown"
    fr = sum(1 for w in words if w in FR_WORDS)
    de = sum(1 for w in words if w in DE_WORDS)
    es = sum(1 for w in words if w in ES_WORDS)
    best = max(fr, de, es)
    if best >= 3 and best / len(words) > 0.03:
        return "fr" if best == fr else ("de" if best == de else "es")
    return "en"


def parse_era(text):
    return [m.group(1).lower() for m in ERA_RE.finditer(text)]


def parse_negative(text):
    return [m.group(0).strip().lower() for m in NEG_RE.finditer(text)]


def build_orig_tags(data):
    """Инвертирует categories.{cat}.tags.{tag}.tracks -> id -> {cat: [tags]}"""
    per_track = defaultdict(lambda: defaultdict(list))
    for cat, cdata in (data.get("categories") or {}).items():
        for tag, tdata in (cdata.get("tags") or {}).items():
            for tid in tdata.get("tracks", []):
                per_track[tid][cat].append(tag)
    return per_track


def main():
    if not os.path.exists(SRC):
        sys.exit(f"нет источника: {SRC}")
    with open(SRC, encoding="utf-8") as f:
        data = json.load(f)
    tracks = data.get("tracks", {})
    per_track = build_orig_tags(data)
    os.makedirs(os.path.dirname(DST), exist_ok=True)

    n = 0
    with open(DST, "w", encoding="utf-8") as out:
        for tid, t in tracks.items():
            sound = (t.get("sound") or "").strip()
            lyrics = t.get("lyrics") or ""
            bpm_m = BPM_RE.search(sound)
            record = {
                "id": tid,
                "name": t.get("name") or "",
                "model": t.get("model"),
                "duration": t.get("duration"),
                "plays": t.get("plays") or 0,
                "favorites": t.get("favorites") or 0,
                "score": (t.get("plays") or 0) + 10 * (t.get("favorites") or 0),
                "sound": sound,
                "lyrics_len": len(lyrics),
                "parsed": {
                    "bpm": int(bpm_m.group(1)) if bpm_m else None,
                    "genres": match_vocabulary(sound, GENRES_SORTED),
                    "instruments": match_vocabulary(sound, INSTRUMENTS_SORTED),
                    "mood": match_vocabulary(sound, MOOD),
                    "character": match_vocabulary(sound, CHARACTER),
                    "era": parse_era(sound),
                    "vocal": parse_vocal(sound),
                    "lyrics_language": detect_language(lyrics),
                    "negative": parse_negative(sound),
                },
                "orig_tags": dict(per_track.get(tid, {})),
            }
            out.write(json.dumps(record, ensure_ascii=False) + "\n")
            n += 1
    print(f"OK: {n} записей -> {os.path.relpath(DST, ROOT)}")
    print(f"срез источника: {data.get('generatedAt')}")


if __name__ == "__main__":
    main()
