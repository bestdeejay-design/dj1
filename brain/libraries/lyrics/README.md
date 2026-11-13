# Лирика

Полная лирика всех треков корпуса живёт в `data/tags-data.json`
(поле `lyrics` каждой записи, ключ — id трека) и НЕ дублируется.

Как найти:
1. По жанру/настроению/BPM — фильтр по `brain/corpus/tracks.jsonl`
   (поля `parsed.*`), получите список id.
2. По тексту — grep по `data/tags-data.json`.
3. Готовая витрина лучших — `showcase-top-tracks.md` в этой папке.

Формат лирики для генерации (метки секций, адлибы, эффекты) —
`knowledge/song-structure.md` и `knowledge/prompt-rules.md`.
