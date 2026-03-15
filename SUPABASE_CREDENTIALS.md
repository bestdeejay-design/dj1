# 🔑 Supabase Credentials

## 📍 Где находится .env файл

**Путь:** `/Users/admin/Documents/dj1/dj1/.env`

**Команда для открытия:**
```bash
cd /Users/admin/Documents/dj1/dj1
cat .env
```

**Или через Finder (macOS):**
```bash
open /Users/admin/Documents/dj1/dj1/.env
```

---

## 📄 Содержимое .env

```ini
# Supabase URL
SUPABASE_URL=https://nwdalhrbifkjyyhpstnt.supabase.co

# Anon Key (для публичного доступа)
SUPABASE_KEY=sb_publishable_XzianscA3VPcm-oPjFz-3Q_VRqXHXIH

# Service Role Key (полный доступ - использовать осторожно!)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZGFsaHJiaWZranl5aHBzdG50Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM0MTg1NiwiZXhwIjoyMDg4OTE3ODU2fQ.c-Uj184ZuFxXthr6kozBjzq75sQ9d9Wj8jNmo4k-Kic

# Database URL (для прямого подключения)
DATABASE_URL=postgresql://postgres:b334144338B@db.nwdalhrbifkjyyhpstnt.supabase.co:5432/postgres
```

---

## 🔐 Какой ключ использовать

### **1. SUPABASE_KEY (Anon Key)**
- ✅ Для frontend (браузер)
- ✅ Для публичных API запросов
- ✅ Безопасно для клиентского кода
- ⚠️ Ограниченные права (только чтение и некоторые операции)

**Пример использования:**
```javascript
const SUPABASE_KEY = 'sb_publishable_XzianscA3VPcm-oPjFz-3Q_VRqXHXIH';
fetch(`${SUPABASE_URL}/rest/v1/tracks`, {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
    }
});
```

### **2. SUPABASE_SERVICE_KEY (Service Role Key)**
- ❌ **НЕЛЬЗЯ** использовать во frontend!
- ✅ Только для backend/serverless функций
- ✅ Для административных операций
- ✅ Полный доступ ко всем таблицам
- ⚠️ **ОПАСНО** если попадёт в чужие руки!

**Пример использования:**
```javascript
// ТОЛЬКО SERVER-SIDE!
const SUPABASE_SERVICE_KEY = 'eyJhbG...c-Uj184ZuFxXthr6kozBjzq75sQ9d9Wj8jNmo4k-Kic';
```

---

## 🚀 Быстрый доступ к ключам

### **Terminal (копирование в буфер):**
```bash
# Скопировать URL
pbcopy < <(grep SUPABASE_URL .env | cut -d'=' -f2)

# Скопировать Anon Key
pbcopy < <(grep SUPABASE_KEY .env | head -1 | cut -d'=' -f2)

# Скопировать Service Key
pbcopy < <(grep SUPABASE_SERVICE_KEY .env | cut -d'=' -f2)
```

### **Python (чтение из .env):**
```python
from dotenv import load_dotenv
import os

load_dotenv('.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
service_key = os.getenv('SUPABASE_SERVICE_KEY')
```

### **Node.js (чтение из .env):**
```javascript
require('dotenv').config({ path: '.env' });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
```

---

## ⚠️ ВАЖНЫЕ ПРАВИЛА

### ✅ МОЖНО:
1. Использовать `.env` локально для разработки
2. Хранить файл в корне проекта (`/Users/admin/Documents/dj1/dj1/.env`)
3. Импортировать через `dotenv` в скриптах
4. Давать `.env` только тем кто работает над проектом

### ❌ НЕЛЬЗЯ:
1. **ПУБЛИКОВАТЬ В GIT!** (уже в `.gitignore`)
2. Отправлять по email/мессенджерам
3. Хардкодить ключи в коде сайта
4. Использовать `SUPABASE_SERVICE_KEY` на клиенте

---

## 🛡️ Безопасность

### **Файл уже в .gitignore:**
```gitignore
.env
```

### **Проверка что файл не в git:**
```bash
cd /Users/admin/Documents/dj1/dj1
git ls-files | grep ".env"
# Должно быть пусто!
```

### **Если случайно закоммитил:**
```bash
# Удалить из git но оставить локально
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## 📊 Текущие значения (актуальные)

| Параметр | Значение | Статус |
|----------|----------|--------|
| **URL** | `https://nwdalhrbifkjyyhpstnt.supabase.co` | ✅ Активен |
| **Anon Key** | `sb_publishable_XzianscA3VPcm-oPjFz-3Q_VRqXHXIH` | ✅ Можно во frontend |
| **Service Key** | `eyJhbG...Kic` (полный JWT) | ⚠️ Только server-side! |
| **DB Password** | `b334144338B` | 🔒 Секрет |

---

## 🔗 Полезные ссылки

- **Supabase Dashboard:** https://app.supabase.com/project/nwdalhrbifkjyyhpstnt
- **API Docs:** https://supabase.com/docs/reference/javascript/introduction
- **REST API:** https://nwdalhrbifkjyyhpstnt.supabase.co/rest/v1/

---

**Last Updated:** 2026-03-15  
**Location:** `/Users/admin/Documents/dj1/dj1/.env`  
**Status:** ✅ Secure (not in Git)
