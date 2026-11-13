#!/usr/bin/env python3
"""build_feedback.py — слой обратной связи автора: промты + вердикты из чатов.

Источник — срез `brain/sources/PROMPTS_WITH_COMMENTS.csv` (собран
инструментами из PR bestdeejay-design/chats-audit#2, ветка
feat/music-prompt-tools: каждый промт связан с репликой автора,
которая шла следом, и её вердиктом «да/нет»).

Вердикты PR шумные: реплики «Давай с чистого листа», «Смени тему»
матчатся словом «давай» и помечаются как одобрение. Здесь они
переэкзаменовываются:

  strong_yes  — точное «да»/похвала И без глаголов правки
  yes         — «да» без глаголов правки, но без явной похвалы
  iteration   — «да» + глаголы правки (смени/убери/переделай/…) —
                это итерация, а не одобрение
  no          — «нет» по реплике автора
  discussion  — длинная реплика без явного сигнала

Дополнительно:
  - дедупликация промтов (повторы с разными комментариями сливаются);
  - title_hint: короткая строка (<60 симв.) рядом с длинным промтом в той же
    реплике — почти всегда название трека;
  - кросс-матч с продакшн-корпусом (corpus/tracks.jsonl): точное совпадение
    промта с sound-полем трека + нечёткое (Жаккард >= 0.75).

Выход:
  brain/corpus/author-feedback.jsonl — по строке на уникальный промт
  brain/corpus/author-feedback.md    — дайджест для чтения

Запуск:  python3 brain/tools/build_feedback.py  [--csv ПУТЬ]
"""
import argparse
import csv
import json
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_CSV = os.path.join(ROOT, "brain", "sources", "PROMPTS_WITH_COMMENTS.csv")
TRACKS = os.path.join(ROOT, "brain", "corpus", "tracks.jsonl")
OUT_JSONL = os.path.join(ROOT, "brain", "corpus", "author-feedback.jsonl")
OUT_MD = os.path.join(ROOT, "brain", "corpus", "author-feedback.md")

# рабочая полоса длин: короче 60 симв. — в основном названия песен, а не промты
MIN_CHARS, MAX_CHARS = 60, 900
FUZZY_THR = 0.75          # порог Жаккарда для нечёткого матча с продакшном
MIN_TOKENS = 8            # ниже — нечёткий матч не считается

# глаголы правки/перезапуска/нового запроса в комментарии автора
CHANGE_RE = re.compile(
    r"смени|переделай|перепиши|убер[иё]|удали|измени|поменя|верн[иём]|добав|"
    r"напишем|напиши|напишешь|чистого листа|заново|потерял|потеря|не то|не так|"
    r"ещё раз|еще раз|попробуем|попробуй|предложи|создаем|создай|опиши|"
    r"давай попробуем|давай сделаем|сделаем|"
    r"лучше\s+(начать|начинать|сделать|убрать|добавить|брать|оставить|писать)",
    re.IGNORECASE)
# явная похвала / закрепление
STRONG_YES_RE = re.compile(
    r"\b(супер|отлично|зач[её]т|годно|огонь|топ|круто|красава|класс|идеально|"
    r"красиво|в точку|понравилось|нравится|закрепи|шаблон|бер[её]м|"
    r"оставляем|финальный|финал)\b", re.IGNORECASE)
# уступка «похвала, НО …» — смешанная оценка, не сильное одобрение
BUT_RE = re.compile(r"\b(но|однако|хотя|только)\b", re.IGNORECASE)
EXACT_YES = {"да", "даа", "ага", "угу", "ок", "окей", "хорошо", "супер",
             "отлично", "зачет", "топ", "класс", "круто", "годно"}

CLASS_ORDER = ["strong_yes", "yes", "no", "iteration", "discussion"]


def norm(s):
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def first_word(comment):
    head = (comment or "").lower().split("\n")[0].strip(" .!,")
    return head.split()[0] if head else ""


def classify(row):
    """Переэкзаменовка вердикта PR -> класс слоя обратной связи."""
    v, comment, why = row["verdict"], row["comment"] or "", row["why"] or ""
    if v == "нет":
        return "no"
    if v == "да":
        if CHANGE_RE.search(comment):
            return "iteration"
        strong = why == "точное совпадение" or first_word(comment) in EXACT_YES \
            or STRONG_YES_RE.search(comment)
        if strong and BUT_RE.search(comment):
            return "yes"        # похвала с оговоркой — смешанная оценка
        if strong:
            return "strong_yes"
        return "yes"
    return "discussion"


def load_rows(path):
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f, delimiter=";"))
    for r in rows:
        r["chars"] = int(r["chars"] or 0)
    return rows


def build_feedback(rows):
    """Дедупликация + классы + title_hint (группировка соседних строк по реплике)."""
    # title_hint: в одной реплике ассистента часто идут fenced-блок
    # «название» + fenced-блок «промт» — у них общий комментарий
    groups = []
    for i, r in enumerate(rows):
        if groups and groups[-1][0]["chat"] == r["chat"] \
                and (groups[-1][0]["comment"] or "") == (r["comment"] or ""):
            groups[-1].append(r)
        else:
            groups.append([r])
    hints = {}   # id(row) -> название
    for g in groups:
        shorts = [r for r in g if r["chars"] < MIN_CHARS and r["chars"] >= 4]
        longs = [r for r in g if r["chars"] >= MIN_CHARS]
        if len(shorts) == 1 and longs:
            title = shorts[0]["prompt"].strip().strip("`*#-> ")
            for r in longs:
                hints[id(r)] = title

    out, seen = {}, {}
    for r in rows:
        key = norm(r["prompt"])
        if not key:
            continue
        cls = classify(r)
        if key in seen:
            rec = seen[key]
            if r["comment"] and r["comment"] not in rec["comments"]:
                rec["comments"].append(r["comment"])
            if r["chat"] not in rec["chats"]:
                rec["chats"].append(r["chat"])
            # класс сильнее «ранга» выше по CLASS_ORDER побеждает
            if CLASS_ORDER.index(cls) < CLASS_ORDER.index(rec["verdict_class"]):
                rec["verdict_class"] = cls
                rec["verdict_raw"] = r["verdict"]
                rec["why"] = r["why"]
        else:
            rec = {
                "prompt": r["prompt"].strip(),
                "chars": r["chars"],
                "verdict_class": cls,
                "verdict_raw": r["verdict"],
                "why": r["why"],
                "title_hint": hints.get(id(r)),
                "chats": [r["chat"]],
                "comments": [r["comment"]] if r["comment"] else [],
                "production": [],
            }
            seen[key] = rec
            out[key] = rec
    return list(out.values())


def match_production(feed, tracks):
    """Точный и нечёткий (Жаккард) матч промтов с sound-полем продакшна."""
    by_prompt = {}
    for t in tracks:
        p = norm(t.get("sound") or "")
        if p:
            by_prompt.setdefault(p, []).append(t)

    tok = lambda s: set(re.findall(r"[a-zа-яё0-9]+", s))
    index = defaultdict(list)          # токен -> индексы продакшн-промтов
    prod_tok = []
    for p, ts in by_prompt.items():
        i = len(prod_tok)
        prod_tok.append((tok(p), p, ts))
        for w in prod_tok[-1][0]:
            index[w].append(i)

    def add_match(rec, t, j):
        rec["production"].append({
            "id": t["id"], "name": t["name"], "plays": t["plays"],
            "favorites": t["favorites"], "jaccard": round(j, 3)})

    for rec in feed:
        p = norm(rec["prompt"])
        if p in by_prompt:                        # точное совпадение
            for t in by_prompt[p]:
                add_match(rec, t, 1.0)
            continue
        rt = tok(p)
        if len(rt) < MIN_TOKENS:
            continue
        shared = Counter()
        for w in rt:
            for i in index.get(w, ()):
                shared[i] += 1
        best_j, best_i = 0.0, -1
        for i, inter in shared.items():
            pt, _, _ = prod_tok[i]
            j = inter / (len(rt) + len(pt) - inter)
            if j > best_j:
                best_j, best_i = j, i
        if best_j >= FUZZY_THR:
            for t in prod_tok[best_i][2]:
                add_match(rec, t, best_j)


def median(xs):
    xs = sorted(xs)
    return xs[len(xs) // 2] if xs else 0


def write_digest(feed, n_rows, path):
    band = [r for r in feed if MIN_CHARS <= r["chars"] <= MAX_CHARS]
    cnt = Counter(r["verdict_class"] for r in feed)
    cnt_band = Counter(r["verdict_class"] for r in band)

    def plays_of(cls):
        return [m["plays"] for r in band if r["verdict_class"] == cls
                for m in r["production"]]

    strong = [r for r in band if r["verdict_class"] == "strong_yes"]
    strong.sort(key=lambda r: -max((m["plays"] for m in r["production"]),
                                   default=0))
    lines = []
    a = lines.append
    a("# Обратная связь автора: промты и вердикты из чатов")
    a("")
    a("Слой «что автор сам одобрил, а что заставил переделывать». Источник —")
    a("переписки из музыкальных чатов (срез собран инструментами")
    a("[chats-audit PR#2](https://github.com/bestdeejay-design/chats-audit/pull/2),")
    a("ветка `feat/music-prompt-tools`, коммит `c4813aa`); мозг хранит срез в")
    a("`brain/sources/PROMPTS_WITH_COMMENTS.csv` и переэкзаменовывает вердикты.")
    a("")
    a("## Сводка")
    a("")
    a(f"- строк в срезе: {n_rows}; уникальных промтов: {len(feed)};")
    a(f"  из них в рабочей полосе {MIN_CHARS}–{MAX_CHARS} симв.: {len(band)}")
    a("- классы (все / полоса): "
      + "; ".join(f"`{c}` {cnt[c]} / {cnt_band[c]}" for c in CLASS_ORDER))
    a("- `iteration` — реплики вида «давай переделаем», которые PR пометил")
    a("  как одобрение; здесь они отделены от настоящего «да»")
    a("")
    a("## Кросс-матч с продакшном (corpus/tracks.jsonl)")
    a("")
    matched = {c: sum(1 for r in band if r["verdict_class"] == c
                      and r["production"]) for c in CLASS_ORDER}
    a("| Класс | Промтов в полосе | Совпало с продакшном | Медиана plays |")
    a("|---|---|---|---|")
    for c in CLASS_ORDER:
        a(f"| `{c}` | {cnt_band[c]} | {matched[c]} | {median(plays_of(c))} |")
    a("")
    a("Совпадение = точное равенство промта и `sound` трека либо Жаккард >= "
      f"{FUZZY_THR}.")
    a("")
    a("## Одобренное дошло до продакшна: топ по listens")
    a("")
    top = [r for r in strong if r["production"]][:15]
    a("| Трек | plays | fav | Жаккард | Из чата | Комментарий автора |")
    a("|---|---|---|---|---|---|")
    for r in top:
        m = max(r["production"], key=lambda m: int(m["plays"] or 0))
        comm = (r["comments"][0] if r["comments"] else "").replace("\n", " ")
        comm = (comm[:70] + "…") if len(comm) > 70 else comm
        chat = r["chats"][0]
        chat = (chat[:30] + "…") if len(chat) > 30 else chat
        a(f"| {m['name']} | {m['plays']} | {m['favorites']} | {m['jaccard']}"
          f" | {chat} | {comm} |")
    if not top:
        a("_(точных попаданий нет)_")
    a("")
    a("## Топ-12 сильных одобренных промтов (эталоны для генерации)")
    a("")
    for i, r in enumerate(strong[:12], 1):
        title = f"«{r['title_hint']}» — " if r["title_hint"] else ""
        a(f"### {i}. {title}{r['chars']} симв.")
        a("")
        a("```")
        a(r["prompt"])
        a("```")
        if r["comments"]:
            c = r["comments"][0].replace("\n", " ")
            a(f"> {c[:300]}")
        a("")
    a("## Как использовать")
    a("")
    a("- **LoRA-отбор**: `datasets/lora-candidates.jsonl` несёт поле")
    a("  `author_feedback` — приоритет кандидатам с `strong_yes`.")
    a("- **Промт-правила**: комментарии в `author-feedback.jsonl` — прямая")
    a("  речь автора о вкусе (что нравится, что терпеть не может);")
    a("  дополнения к `knowledge/prompt-rules.md` стоит формулировать")
    a("  по ним, а не по догадкам.")
    a("- **Негативы**: класс `no` + реплики автора — готовый список того,")
    a("  что НЕ переносить в промты.")
    a("")
    a("## Ограничения")
    a("")
    a("- Вердикт ставился по словам реплики, а не вручную; спорные случаи")
    a("  видны по полю `why`. Класс `iteration` отделяет правки от одобрений,")
    a("  но пограничные реплики всё равно есть — выборку `strong_yes` перед")
    a("  использованием стоит просмотреть глазами.")
    a(f"- Рабочая полоса {MIN_CHARS}–{MAX_CHARS} симв.: короче — в основном")
    a("  названия песен (они сохранены как `title_hint`).")
    a("- Кросс-матч односторонний: находится лучший продакшн-трек на промт;")
    a("  треки без связи с чатами (например, прямая генерация в FUZZ) в слой")
    a("  не попадают.")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--csv", default=SRC_CSV,
                    help="путь к PROMPTS_WITH_COMMENTS.csv (срез PR#2)")
    args = ap.parse_args()

    if not os.path.exists(args.csv):
        sys.exit(f"нет среза {args.csv} — положи его или укажи --csv")
    rows = load_rows(args.csv)
    feed = build_feedback(rows)

    tracks = []
    if os.path.exists(TRACKS):
        with open(TRACKS, encoding="utf-8") as f:
            tracks = [json.loads(l) for l in f]
        match_production(feed, tracks)
    else:
        print("!! tracks.jsonl не найден — без кросс-матча с продакшном")

    os.makedirs(os.path.dirname(OUT_JSONL), exist_ok=True)
    with open(OUT_JSONL, "w", encoding="utf-8") as f:
        for r in feed:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    write_digest(feed, len(rows), OUT_MD)

    cnt = Counter(r["verdict_class"] for r in feed)
    n_prod = sum(1 for r in feed if r["production"])
    print(f"OK: {len(feed)} уникальных промтов -> author-feedback.jsonl")
    print(f"    классы: {dict(cnt)}")
    print(f"    с матчем в продакшне: {n_prod}")
    print(f"    дайджест: author-feedback.md")


if __name__ == "__main__":
    main()
