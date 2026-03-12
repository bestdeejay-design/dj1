#!/bin/bash
source venv/bin/activate
python3 << 'PYTHON_SCRIPT'
import sys
sys.stdout.reconfigure(line_buffering=True)

# Теперь импортируем и запускаем скрипт
exec(open('analyze_api_phase1.py').read())
PYTHON_SCRIPT
