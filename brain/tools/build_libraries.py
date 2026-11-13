#!/usr/bin/env python3
"""build_libraries.py — курируемые библиотеки промтов и лирики из корпуса.

Выход:
  brain/libraries/prompts-by-genre.md   — топ-промты по жанрам
  brain/libraries/prompts-by-mood.md    — топ-промты по настроению
  brain/libraries/lyrics/showcase-top-tracks.md — топ-25: промт + полная лирика
  brain/libraries/README.md             — как устроены библиотеки

Лирика подтягивается из data/tags-data.json по id (не дублируется в корпусе).

Запуск:  python3 brain/tools/build_libraries.py
"""
import json
import os
from collections import defaultdict

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
CORPUS = os.path.join(ROOT, "brain", "corpus", "tracks.jsonl")
SRC_TAGS = os.path.join(ROOT, "data", "tags-data.json")
LIB = os.path.join(ROOT, "brain", "libraries")

GENRE_LIMIT = 12
GENRE_TOP = 8
MOOD_LIMIT = 10
MOOD_TOP = 5
SHOWCASE_TOP = 25


def esc(text):
    return text.replace("|", "\\|").replace("\n", " ")


def main():
    with open(SRC_TAGS, encoding="utf-8") as f:
        lyrics_by_id = {
            tid: t.get("lyrics") or "" for tid, t in json.load(f)["tracks"].items()
        }
    records = []
    with open(CORPUS, encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line))

    # ------------------------------------------------ prompts-by-genre
    by_genre = defaultdict(list)
    for r in records:
        for g in r["parsed"]["genres"]:
            by_genre[g].append(r)
    genre_counts = sorted(((g, len(rs)) for g, rs in by_genre.items()),
                          key=lambda kv: -kv[1])
    lines = [
        "# Библиотека промтов по жанрам",
        "",
        "> Автогенерация: `python3 brain/tools/build_libraries.py`.",
        f"> Корпус: {len(records)} треков. Отобраны топ-{GENRE_LIMIT} жанров "
        f"по численности, в каждом — топ-{GENRE_TOP} треков по score "
        "(plays + 10 x favorites). Полный поиск — по "
        "`brain/corpus/tracks.jsonl`.",
        "",
    ]
    for g, cnt in genre_counts[:GENRE_LIMIT]:
        top = sorted(by_genre[g], key=lambda r: -r["score"])[:GENRE_TOP]
        lines += [f"## {g} ({cnt} треков)", "",
                  "| Трек | Score | BPM | Вокал | Промт |", "|---|---|---|---|---|"]
        for r in top:
            bpm = r["parsed"]["bpm"] or "—"
            voc = r["parsed"]["vocal"]["gender"]
            if r["parsed"]["vocal"]["styles"]:
                voc += f" ({', '.join(r['parsed']['vocal']['styles'][:2])})"
            lines.append(
                f"| {esc(r['name'])} | {r['score']} | {bpm} | {voc} "
                f"| `{esc(r['sound'][:400])}` |")
        lines.append("")
    with open(os.path.join(LIB, "prompts-by-genre.md"), "w",
              encoding="utf-8") as f:
        f.write("\n".join(lines))

    # ------------------------------------------------ prompts-by-mood
    by_mood = defaultdict(list)
    for r in records:
        for m in r["parsed"]["mood"]:
            by_mood[m].append(r)
    mood_counts = sorted(((m, len(rs)) for m, rs in by_mood.items()),
                         key=lambda kv: -kv[1])
    lines = [
        "# Библиотека промтов по настроению",
        "",
        "> Автогенерация: `python3 brain/tools/build_libraries.py`.",
        f"> Топ-{MOOD_LIMIT} настроений, в каждом — топ-{MOOD_TOP} треков "
        "по score.",
        "",
    ]
    for m, cnt in mood_counts[:MOOD_LIMIT]:
        top = sorted(by_mood[m], key=lambda r: -r["score"])[:MOOD_TOP]
        lines += [f"## {m} ({cnt} треков)", "",
                  "| Трек | Score | Жанры | Промт |", "|---|---|---|---|"]
        for r in top:
            g = ", ".join(r["parsed"]["genres"][:3]) or "—"
            lines.append(
                f"| {esc(r['name'])} | {r['score']} | {esc(g)} "
                f"| `{esc(r['sound'][:400])}` |")
        lines.append("")
    with open(os.path.join(LIB, "prompts-by-mood.md"), "w",
              encoding="utf-8") as f:
        f.write("\n".join(lines))

    # ------------------------------------------------ lyrics showcase
    best = sorted(records, key=lambda r: -r["score"])[:SHOWCASE_TOP]
    lines = [
        "# Витрина лирики: топ-" + str(SHOWCASE_TOP) + " треков",
        "",
        "> Автогенерация: `python3 brain/tools/build_libraries.py`.",
        "> Лучшие треки корпуса по score (plays + 10 x favorites):",
        "> полный промт + полная лирика. Остальная лирика — в "
        "`data/tags-data.json` по id трека.",
        "",
    ]
    for i, r in enumerate(best, 1):
        lyr = lyrics_by_id.get(r["id"], "")
        lines += [
            f"## {i}. {r['name']} — score {r['score']} "
            f"(plays {r['plays']}, избр. {r['favorites']})",
            "",
            f"- id: `{r['id']}`",
            f"- модель: {r['model'] or '—'} | BPM: {r['parsed']['bpm'] or '—'} "
            f"| жанры: {', '.join(r['parsed']['genres']) or '—'} | "
            f"язык лирики: {r['parsed']['lyrics_language']}",
            "",
            "**PROMPT**",
            "",
            "```",
            r["sound"],
            "```",
            "",
            "**LYRICS**",
            "",
            "```",
            lyr,
            "```",
            "",
        ]
    with open(os.path.join(LIB, "lyrics", "showcase-top-tracks.md"), "w",
              encoding="utf-8") as f:
        f.write("\n".join(lines))

    # ------------------------------------------------ README
    readme = f"""# Библиотеки

Курируемые выжимки из корпуса (`brain/corpus/tracks.jsonl`,
{len(records)} треков). Пересобираются автоматически:

```
python3 brain/tools/build_libraries.py
```

| Файл | Что внутри |
|---|---|
| `prompts-by-genre.md` | Топ-{GENRE_LIMIT} жанров x топ-{GENRE_TOP} промтов по score |
| `prompts-by-mood.md` | Топ-{MOOD_LIMIT} настроений x топ-{MOOD_TOP} промтов по score |
| `lyrics/showcase-top-tracks.md` | Топ-{SHOWCASE_TOP} треков: полный промт + полная лирика |
| `lyrics/README.md` | Как искать лирику по всему корпусу |

Score = plays + 10 x favorites — грубый сигнал качества по поведению
слушателей. Вручную библиотеки не редактируем: правки вносят в корпус
(теги/разметка), затем пересобирают.
"""
    with open(os.path.join(LIB, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)
    lyr_readme = """# Лирика

Полная лирика всех треков корпуса живёт в `data/tags-data.json`
(поле `lyrics` каждой записи, ключ — id трека) и НЕ дублируется.

Как найти:
1. По жанру/настроению/BPM — фильтр по `brain/corpus/tracks.jsonl`
   (поля `parsed.*`), получите список id.
2. По тексту — grep по `data/tags-data.json`.
3. Готовая витрина лучших — `showcase-top-tracks.md` в этой папке.

Формат лирики для генерации (метки секций, адлибы, эффекты) —
`knowledge/song-structure.md` и `knowledge/prompt-rules.md`.
"""
    with open(os.path.join(LIB, "lyrics", "README.md"), "w",
              encoding="utf-8") as f:
        f.write(lyr_readme)

    print("OK: prompts-by-genre.md, prompts-by-mood.md, "
          "lyrics/showcase-top-tracks.md, README.md")


if __name__ == "__main__":
    main()
