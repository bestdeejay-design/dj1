# DJ1 Brain — мозг и движок с данными для создания музыки

Единое рабочее место: знания о промтах и лирике, корпус личного опыта
(8202 трека с полными промтами и лирикой), слой обратной связи автора
из чатов, курируемые библиотеки и датасеты для файнтюна генеративной
модели **ACE-Step**.

## Зачем

Помогать создавать хорошие композиции и лирику, опираясь на накопленный
личный опыт: правила формулируют «как писать промты», корпус отвечает
«что уже сработало» (score = plays + 10 x favorites), обратная связь —
«что автор сам одобрил, а что переделывал», библиотеки дают эталоны,
датасеты переносят стиль в веса модели (LoRA).

## Карта

| Папка | Что внутри | Как обновляется |
|---|---|---|
| `knowledge/` | Правила промтов, воркфлоу, структура песни, таксономия стилей, паспорт ACE-Step | Вручную (редактируется, версия в git) |
| `sources/` | Замороженные срезы внешних данных: `PROMPTS_WITH_COMMENTS.csv` (вердикты автора из чатов, PR chats-audit#2) | Вручную (см. `sources/README.md`) |
| `corpus/` | `tracks.jsonl` — 8202 трека с разобранными промтами; `author-feedback.jsonl` — вердикты автора по промтам с кросс-матчем на треки; `stats.md`, `author-feedback.md` — статистика | `build_corpus.py`, `build_feedback.py` + `stats.py` |
| `libraries/` | Промты по жанрам/настроению, витрина лучшей лирики | `python3 brain/tools/build_libraries.py` |
| `datasets/` | `lora-candidates.jsonl` (топ-500 с полем `author_feedback`) + чек-лист LoRA-датасета | `python3 brain/tools/build_datasets.py` |
| `runs/` | Прогоны конвейера: запрос → тройка TITLE/LYRICS/PROMPT + результат валидации | Мозгом (LLM по knowledge/); проверка — `validate_run.py` |
| `tools/` | Скрипты конвейера (6 шт., идемпотентны) | Правки при развитии |

Полный прогон после обновления выгрузки `data/tags-data.json`:

```bash
python3 brain/tools/build_corpus.py
python3 brain/tools/build_feedback.py
python3 brain/tools/stats.py
python3 brain/tools/build_libraries.py
python3 brain/tools/build_datasets.py
```

## Конвейер

```
Пользовательский запрос
        |
        v
LLM + brain (knowledge + corpus + libraries)   <- этот репозиторий
        |  TITLE / LYRICS / PROMPT (теги ACE-Step)
        v
ACE-Step (+ LoRA на личном стиле) -> трек -> продакшн (dj1/dajet)
        |
        v
plays/favorites -> data/tags-data.json (выгрузка api.dj1.ru)
        |
        v
пересборка корпуса -> мозг знает уже больше
```

## Линия данных (lineage)

| Слой | Репозитории | Статус |
|---|---|---|
| Оригиналы (сырьё) | `qwen-chats`, `deepseek-chats` | Read-only, не редактируются |
| Артефакты классификации | `chats`, `chats-job`, `chats-audit` | Заморожены (история) |
| **Рабочий мозг** | **`dj1/brain/` (здесь)** | Живое, развивается |
| Продакшн | `dj1` (плеер), `dajet` (галерея, dj1.ru) | Живут своей жизнью |

Промты и правила исторически выросли из музыкальных чатов
(chats-audit/music: 72 чата, PROMPTS_LIBRARY 2,4 МБ, LYRICS_LIBRARY
1,5 МБ) и базы знаний из 73 чатов; здесь они вычищены и привязаны
к реальному корпусу треков. Вердикты автора («да/нет» по промтам)
пришли оттуда же — срезом PR
[chats-audit#2](https://github.com/bestdeejay-design/chats-audit/pull/2)
(ветка `feat/music-prompt-tools`), см. `sources/README.md`.

## Источник данных корпуса

`data/tags-data.json` (корень dj1) — выгрузка из приватного бэкенда
api.dj1.ru (срез указан в поле `generatedAt`). Там же лежит полная
лирика каждого трека (по id — см. `corpus/tracks.jsonl`); мозг её
не дублирует.

## Что читать в первую очередь

1. `knowledge/model-acestep.md` — формат входа модели, LoRA, отличие от FUZZ
2. `knowledge/prompt-rules.md` — как писать промты (с примером перекладки FUZZ → ACE-Step)
3. `corpus/stats.md` — что реально сработало (жанры, настроение, BPM, топ-треки)
4. `corpus/author-feedback.md` — что автор сам одобрил в чатах и что из этого дошло до продакшна
5. `libraries/prompts-by-genre.md` — эталонные промты по жанрам
6. `runs/2026-11-14-run-01.md` — первый прогон: 8 готовых троек TITLE/LYRICS/PROMPT
7. `datasets/README.md` — чек-лист сбора LoRA-датасета
