# sources/ — входные срезы внешних данных

Сюда складываются замороженные срезы данных, которые мозг не может
пересобрать сам из репозитория dj1 (в отличие от `corpus/tracks.jsonl`,
который собирается из `data/tags-data.json`).

## PROMPTS_WITH_COMMENTS.csv

Срез переписок музыкальных чатов: каждый промт связан с репликой автора,
которая шла следом, и её вердиктом («да» / «нет» / «обсуждение»).

- **Откуда**: [chats-audit PR#2](https://github.com/bestdeejay-design/chats-audit/pull/2),
  ветка `feat/music-prompt-tools`, коммит `c4813aa` (2026-11-13)
- **Кто собрал**: `music/tools/corpus.py` + `comments_link.py` из этого PR
  (читают `music/<чат>/conversation.json`, 72 музыкальных чата)
- **Строк**: 4132 (3897 уникальных промтов)
- **Кто потребляет**: `brain/tools/build_feedback.py` →
  `corpus/author-feedback.jsonl` + `corpus/author-feedback.md`

### Как обновить срез

```bash
# свежий чекаут ветки PR и пересборка CSV инструментами из неё
git clone -b feat/music-prompt-tools https://github.com/bestdeejay-design/chats-audit.git /tmp/chats-audit
python3 /tmp/chats-audit/music/tools/comments_link.py            # пересборка music/*.csv
cp /tmp/chats-audit/music/PROMPTS_WITH_COMMENTS.csv brain/sources/

# и пересборка слоя обратной связи
python3 brain/tools/build_feedback.py
python3 brain/tools/build_datasets.py    # подтянуть author_feedback в кандидатов
```

После обновления среза обнови дату/коммит в этом README и в
`corpus/author-feedback.md` (заголовок пишет `build_feedback.py`).
