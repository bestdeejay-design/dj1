#!/usr/bin/env python3
"""build_datasets.py — датасеты для обучения/файнтюна ACE-Step.

Выход:
  brain/datasets/lora-candidates.jsonl — топ-500 треков по score,
      каждый с caption (теги в формате ACE-Step), полной лирикой,
      ссылкой на аудио (api.dj1.ru) и мета-полями.
  brain/datasets/README.md — инструкция по сборке обучающего датасета.

Запуск:  python3 brain/tools/build_datasets.py
"""
import json
import os

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
CORPUS = os.path.join(ROOT, "brain", "corpus", "tracks.jsonl")
SRC_TAGS = os.path.join(ROOT, "data", "tags-data.json")
FEEDBACK = os.path.join(ROOT, "brain", "corpus", "author-feedback.jsonl")
DST_DIR = os.path.join(ROOT, "brain", "datasets")
TOP_N = 500

# ранги классов обратной связи (меньше — сильнее)
FB_RANK = {"strong_yes": 0, "yes": 1, "no": 2, "iteration": 3, "discussion": 4}


def load_feedback():
    """Обратная связь автора -> {track_id: (класс, комментарий, жаккард)}.

    Берём лучшие (по рангу) совпадения из corpus/author-feedback.jsonl
    (его перекрёстные ссылки на треки уже посчитал build_feedback.py).
    """
    if not os.path.exists(FEEDBACK):
        return {}
    by_track = {}
    with open(FEEDBACK, encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            cls = r["verdict_class"]
            comm = (r["comments"] or [""])[0].replace("\n", " ").strip()
            for m in r["production"]:
                cur = by_track.get(m["id"])
                if cur is None or FB_RANK[cls] < FB_RANK[cur[0]]:
                    by_track[m["id"]] = (cls, comm, m["jaccard"])
    return by_track


# соответствие языковых кодов и вокальных описаний для caption
VOCAL_CAPTION = {
    "male": "male vocals", "female": "female vocals",
    "mixed": "duet male and female vocals", "none": "instrumental",
    "unspecified": None, "unknown": None,
}


def build_caption(r):
    parts = []
    seen = set()
    g = r["parsed"]["genres"]
    if g:
        parts.append(", ".join(g[:3]))
        seen.update(g[:3])
    for i in r["parsed"]["instruments"][:5]:
        if i not in seen:
            parts.append(i)
            seen.add(i)
    v = VOCAL_CAPTION.get(r["parsed"]["vocal"]["gender"])
    if v:
        parts.append(v)
        seen.add(v)
    for s in r["parsed"]["vocal"]["styles"][:2]:
        if s in ("rap", "spoken word", "whisper", "choir", "falsetto") \
                and s not in seen:
            parts.append(s)
            seen.add(s)
    if r["parsed"]["bpm"]:
        parts.append(f"{r['parsed']['bpm']} BPM")
    for m in r["parsed"]["mood"][:3]:
        if m not in seen:
            parts.append(m)
            seen.add(m)
    if r["parsed"]["era"]:
        parts.append(r["parsed"]["era"][0])
    for c in r["parsed"]["character"][:3]:
        if c not in seen:
            parts.append(c)
            seen.add(c)
    if not parts:
        # фолбэк: нераспарсенный промт — берём его начало как caption
        head = r["sound"].strip().lower().rstrip(".")[:150]
        return head
    return ", ".join(parts)


def main():
    with open(SRC_TAGS, encoding="utf-8") as f:
        src = json.load(f)
        tracks_src = src["tracks"]
    records = []
    with open(CORPUS, encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line))
    top = sorted(records, key=lambda r: -r["score"])[:TOP_N]
    fb = load_feedback()

    os.makedirs(DST_DIR, exist_ok=True)
    n = n_fb = 0
    with open(os.path.join(DST_DIR, "lora-candidates.jsonl"), "w",
              encoding="utf-8") as out:
        for r in top:
            full = tracks_src.get(r["id"], {})
            rec = {
                "id": r["id"],
                "name": r["name"],
                "caption": build_caption(r),
                "sound_prompt_original": r["sound"],
                "lyrics": full.get("lyrics") or "",
                "audio_url": full.get("file"),
                "cover_url": full.get("cover"),
                "duration": r["duration"],
                "model": r["model"],
                "plays": r["plays"],
                "favorites": r["favorites"],
                "score": r["score"],
                "parsed": r["parsed"],
            }
            if r["id"] in fb:
                cls, comm, j = fb[r["id"]]
                rec["author_feedback"] = {
                    "verdict": cls, "comment": comm, "jaccard": j}
                n_fb += 1
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
            n += 1

    readme = f"""# Датасеты для ACE-Step

## lora-candidates.jsonl

Топ-{n} треков корпуса по score (plays + 10 x favorites) — кандидаты для
LoRA-файнтюна ACE-Step на личном стиле. Каждая запись:

| Поле | Что |
|---|---|
| `id`, `name` | Идентификатор и название трека |
| `caption` | Теги в формате ACE-Step: жанры, инструменты, вокал, BPM, настроение, эпоха, продакшн |
| `sound_prompt_original` | Исходный промт (как писали для FUZZ/Riffusion) |
| `lyrics` | Полная лирика |
| `audio_url` | Аудио на api.dj1.ru (приватный бэкенд) |
| `duration`, `model`, `plays`, `favorites`, `score` | Мета |
| `author_feedback` | Вердикт автора из чатов: `strong_yes` / `yes` / `no` / `iteration` + его реплика (не у всех; источник — `corpus/author-feedback.jsonl`) |
| `parsed` | Разобранные поля корпуса |

## Как собрать обучающий датасет (чек-лист)

1. **Скачать аудио** по `audio_url` (нужен доступ к api.dj1.ru) в
   `dataset/audio/`, имена файлов — по id.
2. **Отфильтровать по качеству**: score — грубый сигнал; поле
   `author_feedback.verdict == "strong_yes"` — промты, которые автор
   сам одобрил в чатах, таким кандидатам приоритет. Перед обучением
   выслушать кандидатов и убрать слабые. Рекомендуемый объём для
   LoRA — 20–50 сильных треков (для стилевого LoRA хватит и меньше;
   точные требования — в актуальном руководстве ACE-Step).
3. **Сегменты**: стандартно учат на фрагментах фиксированной длины
   (например, 45 секунд), обрезка — из полного трека.
4. **Captions**: поле `caption` уже готово; при необходимости обогатить
   вручную (тональность, деталь аранжировки).
5. **Конфиг обучения**: шаблон и параметры — в документации ACE-Step
   (`TRAIN_INSTRUCTION.md` / `LoRA_Training_Tutorial.md` в репозитории
   модели).
6. **Валидация**: после обучения сгенерировать тестовые треки с caption
   из витрины (`libraries/lyrics/showcase-top-tracks.md`) и сравнить
   с оригиналами.

## Важное

- Аудио и обложки на api.dj1.ru — приватные; убедись, что используешь
  только собственные композиции (все треки корпуса сгенерированы
  лично владельцем проекта).
- `caption` собран автоматически из промтов; негативные указания
  («no falsetto») в caption НЕ переносятся — для ACE-Step формулируй
  всё позитивно (см. `knowledge/prompt-rules.md`).
"""
    with open(os.path.join(DST_DIR, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)
    print(f"OK: {n} кандидатов -> lora-candidates.jsonl + README.md")
    if fb:
        print(f"    с авторской обратной связью: {n_fb}")


if __name__ == "__main__":
    main()
