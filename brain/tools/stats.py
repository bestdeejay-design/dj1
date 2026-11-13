#!/usr/bin/env python3
"""stats.py — статистика корпуса brain/corpus/tracks.jsonl -> brain/corpus/stats.md

Запуск:  python3 brain/tools/stats.py
"""
import json
import os
from collections import Counter

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "brain", "corpus", "tracks.jsonl")
SRC_TAGS = os.path.join(ROOT, "data", "tags-data.json")
DST = os.path.join(ROOT, "brain", "corpus", "stats.md")

LANG_NAMES = {"ru": "русский", "en": "английский", "fr": "французский",
              "de": "немецкий", "es": "испанский", "mixed": "смешанный",
              "unknown": "не определён"}
MODEL_NAMES = {"FUZZ-2.0": "FUZZ-2.0", "FUZZ-2.0 Flash": "FUZZ-2.0 Flash",
               "FUZZ-1.1": "FUZZ-1.1", "FUZZ-1.1 Pro": "FUZZ-1.1 Pro",
               "FUZZ-1.0": "FUZZ-1.0", "FUZZ-1.0 Pro": "FUZZ-1.0 Pro",
               "FUZZ-0.8": "FUZZ-0.8", None: "без модели"}


def top_table(counter, limit, header):
    lines = [f"| {header} | Треков |", "|---|---|"]
    for name, cnt in counter.most_common(limit):
        lines.append(f"| {name} | {cnt} |")
    return "\n".join(lines)


def main():
    generated = "?"
    with open(SRC_TAGS, encoding="utf-8") as f:
        generated = (json.load(f).get("generatedAt") or "?")[:10]
    records = []
    with open(SRC, encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line))
    n = len(records)
    p = lambda x: f"{100 * x / n:.1f}%"

    models = Counter(r["model"] for r in records)
    langs = Counter(r["parsed"]["lyrics_language"] for r in records)
    genres = Counter(g for r in records for g in r["parsed"]["genres"])
    mood = Counter(m for r in records for m in r["parsed"]["mood"])
    instr = Counter(i for r in records for i in r["parsed"]["instruments"])
    character = Counter(c for r in records for c in r["parsed"]["character"])
    vocal_gender = Counter(r["parsed"]["vocal"]["gender"] for r in records)
    vocal_styles = Counter(s for r in records
                           for s in r["parsed"]["vocal"]["styles"])
    negatives = Counter(x for r in records for x in r["parsed"]["negative"])
    era = Counter(e for r in records for e in r["parsed"]["era"])

    with_bpm = sum(1 for r in records if r["parsed"]["bpm"])
    with_genre = sum(1 for r in records if r["parsed"]["genres"])
    with_lyrics = sum(1 for r in records if r["lyrics_len"] > 0)
    bpm_vals = sorted(r["parsed"]["bpm"] for r in records
                      if r["parsed"]["bpm"])
    buckets = Counter((v // 20) * 20 for v in bpm_vals)

    lang_rows = ["| Язык | Треков |", "|---|---|"]
    for l, c in langs.most_common():
        lang_rows.append(f"| {LANG_NAMES.get(l, l)} ({l}) | {c} |")

    sound_lens = sorted(len(r["sound"]) for r in records)
    med = sound_lens[n // 2]
    p90 = sound_lens[int(n * 0.9)]

    total_plays = sum(r["plays"] for r in records)
    total_fav = sum(r["favorites"] for r in records)
    best = sorted(records, key=lambda r: -r["score"])[:20]

    bpm_hist = ["| Диапазон BPM | Треков |", "|---|---|"]
    for b in sorted(buckets):
        bpm_hist.append(f"| {b}–{b + 19} | {buckets[b]} |")

    best_rows = ["| # | Трек | Score | Плей | Избр. | Модель | BPM | Жанры |",
                 "|---|---|---|---|---|---|---|---|"]
    for i, r in enumerate(best, 1):
        g = ", ".join(r["parsed"]["genres"][:3]) or "—"
        bpm = r["parsed"]["bpm"] or "—"
        best_rows.append(
            f"| {i} | {r['name']} | {r['score']} | {r['plays']} | "
            f"{r['favorites']} | {r['model'] or '—'} | {bpm} | {g} |")

    md = f"""# Статистика корпуса

> Автогенерация: `python3 brain/tools/stats.py`. Источник: `data/tags-data.json`
> (срез {generated}). Корпус: {n} треков с полными промтами и лирикой.

## Объём и покрытие

| Метрика | Значение |
|---|---|
| Всего треков в корпусе | {n} |
| С звук-промтом | {sum(1 for r in records if r['sound'])} (100%) |
| С лирикой (len > 0) | {with_lyrics} ({p(with_lyrics)}) |
| С распознанным BPM | {with_bpm} ({p(with_bpm)}) |
| С распознанным жанром | {with_genre} ({p(with_genre)}) |
| Суммарные прослушивания | {total_plays:,} |
| Суммарные избранные | {total_fav:,} |
| Медиана длины промта | {med} символов |
| p90 длины промта | {p90} символов |

## Модели генерации

{top_table(models, 10, 'Модель')}

## Жанры (парсер по словарю, топ-30)

{top_table(genres, 30, 'Жанр')}

## Настроение (топ-20)

{top_table(mood, 20, 'Настроение')}

## Инструменты (топ-20)

{top_table(instr, 20, 'Инструмент')}

## Характер/продакшн (топ-15)

{top_table(character, 15, 'Дескриптор')}

## Вокал

{top_table(vocal_gender, 10, 'Пол/тип вокала')}

Стили (топ-15):

{top_table(vocal_styles, 15, 'Стиль')}

## Язык лирики

{chr(10).join(lang_rows)}

## Эпоха (упоминания в промтах)

{top_table(era, 15, 'Эпоха')}

## Распределение BPM

{chr(10).join(bpm_hist)}

## Негативные указания в промтах (топ-15)

> Для ACE-Step их нужно перефразировать позитивно — см. knowledge/prompt-rules.md

{top_table(negatives, 15, 'Запрет')}

## Топ-20 треков по score (plays + 10 x favorites)

{chr(10).join(best_rows)}
"""
    with open(DST, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"OK -> {os.path.relpath(DST, ROOT)}")


if __name__ == "__main__":
    main()
