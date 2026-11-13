# Обратная связь автора: промты и вердикты из чатов

Слой «что автор сам одобрил, а что заставил переделывать». Источник —
переписки из музыкальных чатов (срез собран инструментами
[chats-audit PR#2](https://github.com/bestdeejay-design/chats-audit/pull/2),
ветка `feat/music-prompt-tools`, коммит `c4813aa`); мозг хранит срез в
`brain/sources/PROMPTS_WITH_COMMENTS.csv` и переэкзаменовывает вердикты.

## Сводка

- строк в срезе: 4132; уникальных промтов: 3897;
  из них в рабочей полосе 60–900 симв.: 2229
- классы (все / полоса): `strong_yes` 189 / 113; `yes` 428 / 203; `no` 354 / 189; `iteration` 416 / 234; `discussion` 2510 / 1490
- `iteration` — реплики вида «давай переделаем», которые PR пометил
  как одобрение; здесь они отделены от настоящего «да»

## Кросс-матч с продакшном (corpus/tracks.jsonl)

| Класс | Промтов в полосе | Совпало с продакшном | Медиана plays |
|---|---|---|---|
| `strong_yes` | 113 | 28 | 9 |
| `yes` | 203 | 78 | 2 |
| `no` | 189 | 57 | 2 |
| `iteration` | 234 | 67 | 4 |
| `discussion` | 1490 | 287 | 3 |

Совпадение = точное равенство промта и `sound` трека либо Жаккард >= 0.75.

## Одобренное дошло до продакшна: топ по listens

| Трек | plays | fav | Жаккард | Из чата | Комментарий автора |
|---|---|---|---|---|---|
| Room 7, No Knock (Variation) | 298 | 15 | 1.0 | Creating 1970s-inspired psyche… | Да теперь все правильно , в лирике могут быть эффекты , чтобы получило… |
| SPACE BETWEEN US (Variation) | 225 | 5 | 1.0 | Музыкальный ИИ Промты | Следующий супер хит из 70х )) |
| Forget the rules (Variation) | 194 | 9 | 1.0 | Музыкальный ИИ Промты | Очень круто поучилось |
| 3:17 AM Ritual | 184 | 5 | 1.0 | Sound Architect Prompt Guide | Все получилось отлично )  Нужна концепция альбома )  И 8 треков к теку… |
| Stone Cathedral | 116 | 3 | 1.0 | Утренняя перезагрузка | Красиво  Эпично  Эпоха теплого звука  Живого исполнения  Спасибо  Очен… |
| TAPE LOOP GOD | 109 | 4 | 1.0 | Музыкальный ИИ Промты | Красиво получается |
| Static Hymn | 85 | 2 | 1.0 | Звуковой артефакт и документац… | Да где то рядом  Ты молодец |
| Ritual of the Damp Letter (Variation) | 61 | 2 | 1.0 | Sound Ethos_ Rituals in Isolat… | Ты очень крут Прям огонь трек  Бомба  Прям оно для меня |
| Weightless (Variation) | 39 | 4 | 1.0 | Roxette Listen to Your Heart | Жаль ты не можешь услышать  Но получилось очень хорошо |
| Breathe With Me (Variation) | 27 | 2 | 1.0 | Roxette Listen to Your Heart | Едем дальше )) |
| Valse des Lettres Brûlées (Variation) | 26 | 2 | 1.0 | Sound Ethos_ Rituals in Isolat… | Да  Прям оно Ты сделал что я хочу  Следующий хит с улиц Парижа |
| So-Ba-Ka | 25 | 2 | 0.828 | Я делаю Промты для riffusion _… | Отлично все получается ) спасибо большое |
| What I say | 23 | 4 | 1.0 | Я делаю Промты для riffusion _… | Да. ИДЕАЛЬНО |
| Okay, let's go! (Variation) | 15 | 4 | 1.0 | Я написал лирику для композици… | Это прям самое супер пупер тренд? |
| City of Angels (First Rain) | 13 | 1 | 1.0 | Sound Rituals | Да теперь отлично  Титаник следующий? |

## Топ-12 сильных одобренных промтов (эталоны для генерации)

### 1. «Room 7, No Knock» — 470 симв.

```
hypnotic psychedelic soul, brutal male baritone starting with a whisper, 72 BPM, slow tight drum groove with ride cymbal, liquid and punchy Fender bass, atmospheric wah-wah guitar texture, vintage Hammond organ with slow Leslie speaker, tape saturation, analog warmth, vinyl crackle, surreal desert motel lyrics, cold sensuality, no climax, stream-of-consciousness, recorded in a 1977 Los Angeles basement studio, no female vocals, no falsetto, no reverb, tape echo only
```
> Да теперь все правильно , в лирике могут быть эффекты , чтобы получилось прям хорошо

### 2. 384 симв.

```
Hypnotic psychedelic soul, brutal male baritone spoken-sung, 86 BPM with strong groove, tape-saturated, liquid but punchy bass, wah-wah texture, vintage Hammond organ, tight drum groove (kick + snare + ride), cold sensuality, surreal lyrics about the space between two people as living cosmic void, no climax, analog warmth, lifetime as ritual, no female lead, no melody, no falsetto.
```
> Следующий супер хит из 70х ))

### 3. 597 симв.

```
psychedelic rock, late 1970s, gritty male lead vocal, layered backing vocals, analog tape warmth, vinyl crackle, fuzz guitar, Hammond organ, heavy spring reverb, analog delay, slow tempo 70 BPM, underground psychedelic club vibe, acid rock atmosphere, mystical and surreal mood, structure: verse-chorus-verse-chorus-bridge-outro, guitar solo after second chorus with wah-wah, phaser and flanger on vocals and instruments, light distortion on lead vocal, whispered backing chants, ad-libs with reverse effects and panning, fade-out with run-out groove sound, smoky, hypnotic, immersive stereo field
```
> Очень круто поучилось

### 4. «3:17 AM Ritual» — 492 симв.

```
Male baritone only—whispered verses, dry spoken-word choruses, raw and intimate. Rhythm built from domestic sounds: dripping faucet (82 BPM), spoon-on-glass taps, chair creaks, subtle kitchen ambience. No instruments, no reverb, no digital effects. Only analog tape saturation, light vinyl crackle, and natural room tone. Mood: nocturnal, ritualistic, melancholic domestic surrealism. Style: 1976 Los Angeles basement apartment session, voice as confessional, household objects as percussion.
```
> Все получилось отлично )  Нужна концепция альбома )  И 8 треков к текущему.  То есть это первый и еще 8.  Давай сначала составим список песен и тему альбома, и каждым треком будем ее раскрывать как историю , основные темы в альбоме дождь, тишина, одиночество, разговор с самим собой, письма из прошло

### 5. 620 симв.

```
1969 psychedelic spoken-word rock, lo-fi analog recording;
male baritone vocal: deep, spoken-sung, slight rasp, dry close-mic, no autotune;
vocal processing: long plate reverb (3s decay) only in chorus, subtle phaser on sustained notes;
Fender Precision bass: melodic, fingerstyle, slightly overdriven, main melodic driver;
drums: loose 70 BPM, brushed snare, heartbeat kick, no cymbals;
electric guitar: clean tone, spring reverb, tremolo, sparse notes;
analog synth drone: Moog-style, slow LFO, low frequency;
sound texture: analog tape saturation, tube amp hum, vinyl crackle, high frequencies rolled off above 10kHz;
```
> Красиво  Эпично  Эпоха теплого звука  Живого исполнения  Спасибо  Очень красиво получилось  Даже вариации получаются как красивые оригиналы

### 6. 723 симв.

```
VOCAL GENDER = MALE. NOT FEMALE. MALE ONLY. vocal fragments only — no full lines, no melody — only whispers, spoken phrases, reversed words, glitched syllables, looped and decaying, no female vocals at all, psychedelic ambient rock, 1970s analog tape decay, tempo 60 BPM drifting to 50 BPM, structure: intro-tape-hiss → loop-build → vocal-glitch-layers → peak-collapse → guitar-drone → outro-tape-unspool, instruments: e-bow guitar, mellotron, analog synth, bass drone, tape loops, effects: heavy tape echo, wow & flutter, reverse reverb, pitch decay, vinyl crackle, sudden silence, panning loops, oscillator fade, 3D immersive, hypnotic, haunting, time-loop, psychological, surreal, no chorus, no verse — pure sonic ritual
```
> Красиво получается

### 7. «Static Hymn» — 581 симв.

```
male vocal alternating lazy hoarse spoken-sung verses and raw strained choruses, breathy female whisper and ethereal high male harmony backing vocals, detuned clean electric guitar riff with analog chorus effect, sparse fingerpicked acoustic guitar with slight dissonance, ambient granular synth pads, light brushed snare only in choruses, tempo 84 BPM, key E minor, dynamic contrast between raw and fragile, 2025 indie folk meets 1991 alternative rock production, analog tape saturation, narrow stereo, dry intimate vocals, themes emotional exhaustion suburban decay quiet despair
```
> Да где то рядом  Ты молодец

### 8. «Ritual of the Damp Letter» — 441 симв.

```
male baritone raw spoken-word whisper, English lyrics, 94 BPM, found sounds only (dripping water, match strike, paper unfold, floorboard creak, telephone coil breath), analog effects (tape saturation, extreme wow/flutter, vinyl crackle, tape echo with decay), 1970s psychedelic texture (dusty, lo-fi, mind-drifting), no reverb, no flanger, no phaser, no melody, cold sensuality, hypnotic groove, structure: intro-verse-prechorus-chorus-outro
```
> Ты очень крут Прям огонь трек  Бомба  Прям оно для меня

### 9. 202 симв.

```
West Coast conscious hip-hop with warm trap, laid-back groove, emotional male vocals, introspective storytelling, and uplifting summer atmosphere — blending reflective lyrics with sunny, rhythmic vibes.
```
> Жаль ты не можешь услышать  Но получилось очень хорошо

### 10. 209 симв.

```
West Coast conscious hip-hop with warm trap, laid-back groove, brutal emotional male vocals, introspective storytelling, and uplifting summer atmosphere — blending reflective lyrics with sunny, rhythmic vibes.
```
> Едем дальше ))

### 11. «Valse des Lettres Brûlées» — 465 симв.

```
male baritone raw spoken-word whisper French lyrics, waltz rhythm 3/4 time, 96 BPM (felt pulse, no percussion), found sounds only (rain, paper crumple in triplets, floorboard creaks, vinyl crackle, tape flutter), analog effects (tape saturation, wow/flutter, vinyl surface noise, tape echo), 1970s psychedelic texture, no female lead vocal, no reverb, no flanger, no phaser, no melody, cold sensuality, hypnotic groove, structure: intro-verse-prechorus-chorus-outro
```
> Да  Прям оно Ты сделал что я хочу  Следующий хит с улиц Парижа

### 12. «, add subtle crowd noise (low-pass filtered) in pre-chorus» — 721 симв.

```
Female Vocal Tech House, 128 BPM, DJ-friendly, peak-time energy,  
verses: strictly non-lyrical FEMALE vocals - ahh, ooh, breathy moans, chopped hey in staccato,  
TRAP GROOVE: subtle 808 slides (30% volume), hi-hat rolls (1/32 notes), sparse trap kicks (every 3rd beat),  
pre-chorus: SHORT 2-4 sec, FEMALE whisper - go or now + single exhale, NO MELODY in pre-chorus,  
chorus: explosive FEMALE hook repetitive x4,  
bouncy bassline with sidechain, euphoric pluck synths, punchy off-beat claps,  
VIP CLUB SIGNATURE: hidden 18.5kHz sine wave (inaudible, creates "air pressure" effect),  
VIP-style FX ONLY post-chorus, radio-ready but underground mix,  
ABSOLUTELY NO male vocals, NO WORDS in verses, NO LONG PRE-CHORUS
```
> Отлично все получается ) спасибо большое

## Как использовать

- **LoRA-отбор**: `datasets/lora-candidates.jsonl` несёт поле
  `author_feedback` — приоритет кандидатам с `strong_yes`.
- **Промт-правила**: комментарии в `author-feedback.jsonl` — прямая
  речь автора о вкусе (что нравится, что терпеть не может);
  дополнения к `knowledge/prompt-rules.md` стоит формулировать
  по ним, а не по догадкам.
- **Негативы**: класс `no` + реплики автора — готовый список того,
  что НЕ переносить в промты.

## Ограничения

- Вердикт ставился по словам реплики, а не вручную; спорные случаи
  видны по полю `why`. Класс `iteration` отделяет правки от одобрений,
  но пограничные реплики всё равно есть — выборку `strong_yes` перед
  использованием стоит просмотреть глазами.
- Рабочая полоса 60–900 симв.: короче — в основном
  названия песен (они сохранены как `title_hint`).
- Кросс-матч односторонний: находится лучший продакшн-трек на промт;
  треки без связи с чатами (например, прямая генерация в FUZZ) в слой
  не попадают.
