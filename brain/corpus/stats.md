# Статистика корпуса

> Автогенерация: `python3 brain/tools/stats.py`. Источник: `data/tags-data.json`
> (срез 2026-03-12). Корпус: 8202 треков с полными промтами и лирикой.

## Объём и покрытие

| Метрика | Значение |
|---|---|
| Всего треков в корпусе | 8202 |
| С звук-промтом | 8202 (100%) |
| С лирикой (len > 0) | 8202 (100.0%) |
| С распознанным BPM | 3281 (40.0%) |
| С распознанным жанром | 7570 (92.3%) |
| Суммарные прослушивания | 65,060 |
| Суммарные избранные | 7,803 |
| Медиана длины промта | 93 символов |
| p90 длины промта | 641 символов |

## Модели генерации

| Модель | Треков |
|---|---|
| None | 3505 |
| FUZZ-2.0 | 1942 |
| FUZZ-1.1 | 1207 |
| FUZZ-1.0 | 1160 |
| FUZZ-1.1 Pro | 312 |
| FUZZ-1.0 Pro | 37 |
| FUZZ-0.8 | 25 |
| FUZZ-2.0 Flash | 14 |

## Жанры (парсер по словарю, топ-30)

| Жанр | Треков |
|---|---|
| house | 1809 |
| trap | 1279 |
| tech house | 1047 |
| club | 1014 |
| electronic | 948 |
| lo-fi | 843 |
| ambient | 821 |
| pop | 796 |
| rock | 684 |
| hip-hop | 570 |
| rap | 546 |
| trip-hop | 417 |
| glitch | 353 |
| jazz | 311 |
| orchestral | 301 |
| trance | 297 |
| soul | 271 |
| r&b | 259 |
| industrial | 226 |
| classical | 205 |
| anthem | 199 |
| techno | 182 |
| folk | 172 |
| ballad | 168 |
| swing | 136 |
| psychedelic soul | 125 |
| edm | 124 |
| post-rock | 113 |
| hip hop | 103 |
| funk | 97 |

## Настроение (топ-20)

| Настроение | Треков |
|---|---|
| atmospheric | 1432 |
| hypnotic | 1099 |
| cinematic | 982 |
| haunting | 951 |
| dark | 927 |
| ethereal | 920 |
| dreamy | 736 |
| emotional | 703 |
| melancholic | 618 |
| warm | 573 |
| urban | 522 |
| psychedelic | 494 |
| euphoric | 367 |
| cold | 351 |
| aggressive | 331 |
| retro | 304 |
| smooth | 294 |
| cosmic | 249 |
| nostalgic | 227 |
| energetic | 206 |

## Инструменты (топ-20)

| Инструмент | Треков |
|---|---|
| bass | 3390 |
| 808 | 1548 |
| guitar | 1155 |
| drums | 1134 |
| synth | 886 |
| percussion | 776 |
| vinyl crackle | 760 |
| cello | 750 |
| pads | 737 |
| kick | 713 |
| piano | 710 |
| snare | 567 |
| 909 | 543 |
| strings | 396 |
| saxophone | 264 |
| acoustic guitar | 240 |
| organ | 181 |
| electric guitar | 178 |
| hi-hat | 148 |
| analog synth | 136 |

## Характер/продакшн (топ-15)

| Дескриптор | Треков |
|---|---|
| analog | 1104 |
| vinyl | 992 |
| tape | 915 |
| lo-fi | 843 |
| raw | 574 |
| soft | 511 |
| punchy | 467 |
| tape saturation | 361 |
| vintage | 321 |
| dry | 278 |
| analog warmth | 216 |
| live | 214 |
| stereo | 210 |
| tape echo | 204 |
| wide | 186 |

## Вокал

| Пол/тип вокала | Треков |
|---|---|
| unspecified | 2405 |
| unknown | 2374 |
| female | 2251 |
| male | 1000 |
| mixed | 92 |
| none | 80 |

Стили (топ-15):

| Стиль | Треков |
|---|---|
| vocal | 5222 |
| female vocals | 2343 |
| male vocals | 685 |
| rap | 665 |
| backing vocals | 558 |
| male baritone | 546 |
| whisper | 414 |
| spoken word | 173 |
| choir | 136 |
| falsetto | 112 |
| male tenor | 63 |

## Язык лирики

| Язык | Треков |
|---|---|
| английский (en) | 1 |
| французский (fr) | 1 |
| русский (ru) | 1 |
| смешанный (mixed) | 1 |
| испанский (es) | 1 |
| не определён (unknown) | 1 |
| немецкий (de) | 1 |

## Эпоха (упоминания в промтах)

| Эпоха | Треков |
|---|---|
| 90s | 332 |
| 70s | 216 |
| 80s | 212 |
| 1970s | 120 |
| 2000s | 90 |
| 1990s | 69 |
| 1980s | 36 |
| 2010s | 17 |
| 1920s | 14 |
| 1950s | 12 |
| 1930s | 11 |
| 1960s | 10 |
| 1940s | 9 |
| 2020s | 6 |
| 50s | 2 |

## Распределение BPM

| Диапазон BPM | Треков |
|---|---|
| 20–39 | 3 |
| 40–59 | 10 |
| 60–79 | 318 |
| 80–99 | 633 |
| 100–119 | 302 |
| 120–139 | 1765 |
| 140–159 | 109 |
| 160–179 | 120 |
| 180–199 | 21 |

## Негативные указания в промтах (топ-15)

> Для ACE-Step их нужно перефразировать позитивно — см. knowledge/prompt-rules.md

| Запрет | Треков |
|---|---|
| no male vocals | 217 |
| no english | 149 |
| no reverb | 147 |
| no melody | 144 |
| no verse lyrics | 106 |
| no falsetto | 82 |
| no climax | 79 |
| no instruments | 68 |
| no digital effects | 59 |
| no snare | 57 |
| no cymbals | 47 |
| no synths | 47 |
| no female lead | 46 |
| no vibrato | 43 |
| no distortion | 38 |

## Топ-20 треков по score (plays + 10 x favorites)

| # | Трек | Score | Плей | Избр. | Модель | BPM | Жанры |
|---|---|---|---|---|---|---|---|
| 1 | Last Train | 598 | 258 | 34 | — | — | lo-fi |
| 2 | Dans Mes Rêves | 515 | 275 | 24 | — | — | lounge lo-fi, lounge, lo-fi |
| 3 | Room 7, No Knock (Variation) | 448 | 298 | 15 | FUZZ-2.0 | 72 | psychedelic soul, soul |
| 4 | Let It Go | 429 | 239 | 19 | FUZZ-2.0 | 128 | tech house, house, club |
| 5 | BREATH IS VOW | 407 | 347 | 6 | FUZZ-2.0 | 86 | psychedelic soul, soul |
| 6 | We float on a melody  | 341 | 231 | 11 | FUZZ-2.0 | 100 | psychedelic soul, soul |
| 7 | Forget the rules (Variation) | 284 | 194 | 9 | FUZZ-2.0 | 70 | psychedelic rock, club, rock |
| 8 | Short Circuit (Psychedelic Jazz) | 275 | 235 | 4 | FUZZ-2.0 | — | jazz |
| 9 | SPACE BETWEEN US (Variation) | 275 | 225 | 5 | FUZZ-2.0 | 86 | psychedelic soul, soul |
| 10 | Haze | 270 | 150 | 12 | FUZZ-2.0 | 86 | psychedelic soul, soul |
| 11 | THE EDGE OF YES | 269 | 209 | 6 | FUZZ-2.0 | 86 | psychedelic soul, soul |
| 12 | Pont | 269 | 159 | 11 | — | — | gangsta rap, rap |
| 13 | I WON’T WHISPER ANYMORE (Variation) | 268 | 208 | 6 | FUZZ-2.0 | 86 | psychedelic soul, soul |
| 14 | Can You See Me? | 254 | 124 | 13 | — | — | — |
| 15 | The Ghost in the Glass | 251 | 201 | 5 | FUZZ-2.0 | 86 | psychedelic soul, soul |
| 16 | Сквозь дождь (Variation) | 244 | 94 | 15 | FUZZ-2.0 | 100 | hip-hop, glitch |
| 17 | Echo Location | 235 | 195 | 4 | FUZZ-2.0 | 86 | psychedelic soul, soul |
| 18 | 3:17 AM Ritual | 234 | 184 | 5 | FUZZ-2.0 | 82 | — |
| 19 | Rain don’t fall (Acoustic Variation) | 226 | 86 | 14 | FUZZ-2.0 | 148 | industrial, grunge, lo-fi |
| 20 | Back to you | 224 | 134 | 9 | FUZZ-2.0 | 128 | tech house, house, club |
