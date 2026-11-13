# Правила создания музыкальных промтов

> Наследие: chats-audit/music/MUSIC_PROMPT_RULES.md (правила из чата
> «Правила создания музыкальных промтов» + накопленный опыт).
> Адаптировано под ACE-Step: см. `model-acestep.md`.

## 1. Общие принципы

1. **Без имён исполнителей.**
   - Можно: «в стиле советского рока 80-х»
   - Нельзя: «как группа Земляне»
2. **Без названий брендов.**
   - Можно: «винтажные синтезаторы»
   - Нельзя: «синтезатор Yamaha DX7»
3. **Конкретика вместо общих фраз.**
   - Можно: «мощный бас, мелодичные гитары, аналоговые синты»
   - Нельзя: «крутой звук»
4. **Структура промта (порядок тегов ACE-Step):**
   - жанр + поджанр (tech house, psychedelic soul)
   - инструменты (bass, guitars, synths)
   - вокал (пол, стиль, язык лирики)
   - темп (120 BPM)
   - настроение (nostalgic, energetic)
   - эпоха/продакшн (80s vintage production, tape saturation)
5. **Ключевые слова:** 5–10 точных дескрипторов через запятую.

## 2. Формат под ACE-Step (главное отличие от FUZZ-эпохи)

- Теги — через запятую, строчными, без точек в конце.
- **Никаких негативов.** Все запреты перефразируем позитивно:
  - `no female vocals` → `male vocals only`
  - `no reverb` → `dry, close-mic production`
  - `no climax` → `flat dynamics, loop-like`
  - `no falsetto` → `full-voice delivery`
- Язык лирики указываем тегом: `Russian lyrics`, `French lyrics` —
  русский входит в топ-10 языков модели.
- BPM указываем явно: `120 BPM` (медиана корпуса — 128).

## 3. Оформление лирики

1. **Структура блоков:** `[Verse]`, `[Chorus]`, `[Bridge]`, `[Outro]`,
   `[Intro]`, `[Pre-Chorus]`, `[Hook]`. Пример: `[Verse 1]` → текст.
2. **Звуковые эффекты в квадратных скобках:** `[sound of wind]`,
   `[vinyl crackle]`.
3. **Адлибы в круглых скобках:** `(ad-lib: Yeah!)`, `(backing: ooh)`.
4. **Повторы без `(x3)`:** повторяйте строку явно.
5. Подробная таксономия секций — `song-structure.md`.

## 4. Что всегда работает хорошо (проверено корпусом 8202 треков)

- Конкретные эпохи: `80s vintage production` (в корпусе: 90s — 332+69
  упоминаний, 70s — 216+120, 80s — 212+36)
- Чёткие инструменты: `melodic electric guitars`, `Hammond organ`
- Ясное настроение: `hypnotic`, `cinematic`, `dreamy`
- Темп: `120 BPM`
- Атмосферные эффекты: `vinyl crackle` (760 треков корпуса), `tape hiss`
- Продакшн-характер: `analog warmth` (1104), `tape saturation` (361)

## 5. Что избегать

- Имена исполнителей и бренды
- Слишком общие описания («крутой звук»)
- Шаблонные повторы `(x3)`
- Противоречивые указания («no vocals» + «female vocals»)
- Негативные формулировки — для ACE-Step только позитивные теги

## 6. Формат ответа ИИ-агента (стандарт проекта)

Каждый трек — три блока для копирования:

```
TITLE
<название трека>

LYRICS
<полный текст с метками секций и звуковыми указаниями в скобках>

PROMPT
<теги ACE-Step: жанр, инструменты, вокал, темп, настроение, эпоха, продакшн>
```

Теги PROMPT — на английском. Лирика — на языке трека
(модель поддерживает 19 языков, русский — в топ-10).

## 7. Пример идеального промта (ACE-Step)

Из корпуса (score 407, plays 347), негативы перефразированы:

```
До (FUZZ):   Hypnotic psychedelic soul, brutal male baritone spoken-sung,
             86 BPM with strong groove, tape-saturated, liquid but punchy
             bass, wah-wah texture, vintage Hammond organ, tight drum
             groove, cold sensuality, surreal lyrics, no climax, analog
             warmth, no female lead, no melody, no falsetto.

После (ACE): hypnotic psychedelic soul, male baritone spoken-sung, 86 BPM,
             tape saturation, analog warmth, liquid punchy bass, wah-wah
             guitar, vintage Hammond organ, tight drums, cold sensual mood,
             surreal lyrics, full-voice delivery, male vocals only,
             steady loop-like dynamics
```

## 8. Где брать эталоны

- По жанрам: `../libraries/prompts-by-genre.md`
- По настроению: `../libraries/prompts-by-mood.md`
- Лучшие треки (промт + лирика): `../libraries/lyrics/showcase-top-tracks.md`
- Статистика «что сработало»: `../corpus/stats.md`
