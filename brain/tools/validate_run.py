#!/usr/bin/env python3
"""validate_run.py — проверка прогона мозга по правилам knowledge/.

Проверяет каждый блок TITLE / LYRICS / PROMPT в run-файле:

PROMPT (правила knowledge/prompt-rules.md + model-acestep.md):
  - теги строчными, через запятую, без точки в конце;
  - 5–12 дескрипторов, длина <= 250 символов;
  - есть явный темп «N BPM»;
  - нет негативных формулировок (no X, без X) — только позитивные теги;
  - вокальным трекам нужен тег языка лирики (Russian lyrics и т.п.);
  - инструментальным — тег instrumental;
  - нет имён исполнителей/брендов (кроме канона корпуса: Hammond organ, BPM);
  - первый тег — жанр, а не вокал/темп.

LYRICS (правила knowledge/song-structure.md):
  - есть метки секций в квадратных скобках;
  - припев повторяется явно минимум 2 раза (для вокальных треков);
  - нет шаблонных повторов (x2)/(x3);
  - у вокальных треков достаточно строк (>= 8).

Выход: отчёт в консоль + раздел «Результат валидации» в конце run-файла.

Запуск:  python3 brain/tools/validate_run.py brain/runs/<файл>.md
"""
import re
import sys
import os

MAX_TAGS_CHARS = 250
LANG_TAGS = ("Russian lyrics", "English lyrics", "French lyrics",
             "Spanish lyrics", "German lyrics", "Portuguese lyrics",
             "Italian lyrics", "Japanese lyrics", "Korean lyrics",
             "Chinese lyrics")
# Канон корпуса: допустимые слова с заглавной буквы — теги языка лирики
# (knowledge/prompt-rules.md §2: «Russian lyrics»), Hammond organ как
# устоявшееся название инструмента и города (это не исполнители и не бренды)
ALLOWED_CAPS = {"BPM", "Hammond", "Russian", "English", "French", "Spanish",
                "German", "Portuguese", "Italian", "Japanese", "Korean",
                "Chinese", "Paris", "London", "Berlin", "Moscow", "Tokyo",
                "Amsterdam", "Lisbon", "Havana", "Memphis", "Detroit"}
SECTION_RE = re.compile(r"^\[(Intro|Verse|Pre-Chorus|Chorus|Couplet|Refrain|"
                        r"Bridge|Pont|Break|Drop|Outro|Hook|Spoken|"
                        r"Instrumental)[^\]]*\]\s*$", re.M)


def parse_run(text):
    """Достаёт тройки из fenced-блоков с TITLE/LYRICS/PROMPT."""
    tracks = []
    blocks = re.findall(r"```[^\n]*\n(.*?)```", text, re.DOTALL)
    for b in blocks:
        m = re.search(r"^TITLE\n(.+?)\n\nLYRICS\n(.*?)\n\nPROMPT\n(.+?)\s*$",
                      b, re.DOTALL)
        if m:
            tracks.append({"title": m.group(1).strip(),
                           "lyrics": m.group(2).strip(),
                           "prompt": m.group(3).strip()})
    return tracks


def check_prompt(prompt, instrumental):
    errors, notes = [], []
    tags = [t.strip() for t in prompt.split(",") if t.strip()]
    if prompt != prompt.strip():
        errors.append("лишние пробелы по краям")
    if prompt.endswith("."):
        errors.append("точка в конце (теги пишутся без точки)")
    if prompt.lower() != prompt and \
            not all(w in ALLOWED_CAPS for w in re.findall(r"[A-ZА-ЯЁ][a-zа-яё]*", prompt)):
        bad = [w for w in re.findall(r"[A-ZА-ЯЁ]\w*", prompt)
               if w not in ALLOWED_CAPS]
        if bad:
            errors.append(f"заглавные буквы в тегах: {', '.join(sorted(set(bad)))}")
    if not 5 <= len(tags) <= 15:
        errors.append(f"дескрипторов {len(tags)} (норма 5–10 ключевых,"
                      " максимум 15 как в эталоне knowledge/prompt-rules.md §7)")
    if len(prompt) > MAX_TAGS_CHARS:
        errors.append(f"длина {len(prompt)} > {MAX_TAGS_CHARS}")
    if not re.search(r"\b\d{2,3} BPM\b", prompt):
        errors.append("нет явного темпа «N BPM»")
    # негативы запрещены: no X / без X (кроме канона 808)
    if re.search(r"(?<!\d)\bno\b|(?<![\w])без\b|don't|never add", prompt, re.I):
        errors.append("негативная формулировка — перефразировать позитивно")
    if instrumental:
        if "instrumental" not in prompt.lower():
            errors.append("инструментальному треку не хватает тега instrumental")
        for lang in LANG_TAGS:
            if lang.lower() in prompt.lower():
                errors.append(f"тег языка {lang} у инструментального трека лишний")
    else:
        if not any(lang.lower() in prompt.lower() for lang in LANG_TAGS):
            errors.append("вокальному треку нужен тег языка лирики "
                          "(Russian lyrics и т.п.)")
    # порядок: жанр первым, не вокал/темп
    first = tags[0].lower() if tags else ""
    if re.match(r"^(male|female|\d)", first):
        errors.append(f"первый тег «{tags[0]}» — первым должен идти жанр")
    return errors, notes


def check_lyrics(lyrics, instrumental):
    errors = []
    sections = SECTION_RE.findall(lyrics)
    if not sections:
        errors.append("нет меток секций в квадратных скобках")
    if instrumental:
        if "[Instrumental]" not in lyrics:
            errors.append("инструментальный трек — ожидался блок [Instrumental]")
        return errors
    if re.search(r"\(\s*x\s*\d", lyrics, re.I):
        errors.append("шаблонный повтор (xN) — повторять строки явно")
    chorus = len(re.findall(r"^\[(Chorus|Refrain)", lyrics, re.M))
    if chorus < 2:
        errors.append(f"припев встречается {chorus} раз (минимум 2)")
    lines = [l for l in lyrics.splitlines()
             if l.strip() and not l.strip().startswith("[")]
    if len(lines) < 8:
        errors.append(f"строк текста {len(lines)} (для вокала нужно >= 8)")
    if not any(s.startswith(("Intro", "Verse", "Couplet")) for s in sections):
        errors.append("нет куплета/интро")
    return errors


def validate(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    tracks = parse_run(text)
    if not tracks:
        print("!! тройки TITLE/LYRICS/PROMPT не найдены")
        return 1, ""
    lines, failures = [], 0
    for i, t in enumerate(tracks, 1):
        instrumental = "[Instrumental]" in t["lyrics"]
        p_err, _ = check_prompt(t["prompt"], instrumental)
        l_err = check_lyrics(t["lyrics"], instrumental)
        status = "OK" if not (p_err + l_err) else "FAIL"
        if p_err + l_err:
            failures += 1
        lines.append(f"| {i} | {t['title']} | {status} | "
                     f"{'; '.join(p_err + l_err) or 'все правила соблюдены'} |")
    report = [
        "## Результат валидации",
        "",
        f"Проверено тройек: **{len(tracks)}** · нарушений: **{failures}** · "
        f"валидатор: `brain/tools/validate_run.py` · дата: 2026-11-14",
        "",
        "| # | Трек | Статус | Замечания |",
        "|---|---|---|---|",
        *lines,
        "",
    ]
    body = "\n".join(report)
    print(body)
    # перезаписываем раздел в конце run-файла (идемпотентно)
    out = re.sub(r"## Результат валидации[\s\S]*$", body, text)
    if "## Результат валидации" not in text:
        out = text.rstrip("\n") + "\n\n---\n\n" + body
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    return failures, body


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("запуск: python3 brain/tools/validate_run.py <run-файл>")
    failures, _ = validate(sys.argv[1])
    sys.exit(1 if failures else 0)
