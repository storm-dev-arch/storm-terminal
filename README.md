<div align="center">

# ⚡ STORM TERMINAL
### Professional Windows Telemetry, Diagnostics & Hardware Performance Suite

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://microsoft.com/windows)
[![Electron](https://img.shields.io/badge/Electron-34.2.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.1.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Source--Available-EF4444?style=for-the-badge)](LICENSE)

**STORM TERMINAL** — это высокопроизводительная настольная система мониторинга оборудования, бенчмаркинга и диагностики операционной системы Windows с нулевым оверхедом на процессор и бескаркасным интерфейсом в стиле хакерских терминалов.

**Автор и разработчик:** [Storm](https://github.com/storm-dev-arch) • *Made by Storm*

</div>

---

## 🌟 Ключевые возможности

### 🚀 Высокоточная телеметрия оборудования (Zero-Overhead)
* **Динамический замер тактовой частоты CPU:** Опрос реальных счетчиков производительности Windows WMI (`Win32_PerfFormattedData_Counters_ProcessorInformation`). Частота динамически масштабируется при работе Turbo Boost / Precision Boost Overdrive (PBO).
* **Мониторинг ядер без спавна процессов:** Замер загрузки каждого ядра через нативные дельты `os.cpus()` (0.15 мс процессорного времени, 0% нагрузки в простое).
* **Прямая телеметрия NVIDIA GPU:** Интеграция с `nvidia-smi` для считывания точной температуры GPU, нагрузки ядра, энергопотребления (Ватты) и заполненности видеопамяти (VRAM).
* **Фильтрация фиктивных данных BIOS:** Исключение фиктивных температурных заглушек ACPI ($\le 20^\circ\text{C}$), отображаются только реальные сенсоры.

---

### 🛠️ Инструменты и Бенчмарки (Tools & Benchmark Suite)

Комплексный центр тестирования и обслуживания Windows, разделенный на 4 профессиональные секции:

1. **Бенчмарки компонентов:**
   * **Composite Index (0–100):** Единый сводный рейтинг производительности вашей системы.
   * **CPU Benchmark:** Однопоточный и многопоточный стресс-тест решета простых чисел с расчетом баллов.
   * **GPU WebGL 2.0 Benchmark:** 3D-рендеринг сложной геометрии на Canvas с замером реального минимального, среднего и максимального FPS.
   * **RAM Benchmark:** Тестирование пропускной способности оперативной памяти (`TypedArray` чтение/запись в МБ/с) и времени задержки (наносекунды).
   * **Storage Benchmark:** Неразрушающий тест скорости системного диска в `%TEMP%` (последовательная запись, чтение и случайный доступ 4K IOPS).
   * **Network Latency:** Тестирование сетевой задержки и пропускной способности.
   * **История бенчмарков:** Сохранение истории результатов в локальное хранилище с расчетом прогресса/регресса ($\pm\%$) между замерами.

2. **Стресс-тест стабильности:**
   * Выборочная нагрузка на CPU, GPU и оперативную память.
   * Пресеты длительности (30с, 60с, 5м, 10м, бесконечно) и кнопка экстренной остановки.
   * Отображение частот, температуры и загрузки в реальном времени.

3. **Здоровье и Очистка Windows:**
   * **Схемы электропитания:** Просмотр и мгновенное переключение планов питания Windows (`powercfg`) с корректной поддержкой кириллицы.
   * **Быстрая очистка диска:** Безопасное удаление временных файлов `%TEMP%`, системного кэша Windows, эскизов Explorer и очистка корзины.
   * **Менеджер автозагрузки:** Просмотр программ в реестре `HKCU` и `HKLM` с возможностью мягкого отключения через ветку `Run_Disabled`.
   * **Проверка здоровья ОС:** Контроль свободного места на диске C: и мониторинг ключевых системных служб (`BITS`, `WinDefend`, `Spooler`, `wuauserv`).

4. **Оснастки и Дисплеи:**
   * **Административная диагностика:** Запуск `sfc /scannow`, `DISM /RestoreHealth` и `chkdsk` в повышенном режиме (UAC RunAs).
   * **Спецификации мониторов:** Разрешение, частота обновления (Гц), DPI и масштаб подключенных дисплеев.
   * **10 быстрых оснасток Windows:** `devmgmt.msc`, `services.msc`, `resmon.exe`, `regedit.exe`, `dxdiag.exe`, `cleanmgr.exe` и др.
   * **Экспорт системного отчета:** Выгрузка полного паспорта ПК в форматах JSON или оформленного TXT.

---

### 🐧 Отдельное окно Linux Terminal (Neofetch)
* Открытие независимого стилизованного бескаркасного окна терминала с логотипом STORM, детальным Neofetch-выводом и интерактивной командной строкой.
* Цветовая палитра окна динамически подстраивается под активную тему оформления программы.

---

### 🎨 Кастомная Дизайн-Система и Темы
* Полный отказ от сторонних громоздких UI-фреймворков и AI-слопа.
* **7 авторских цветовых тем:**
  * `Obsidian Dark` — строгая тёмная студийная тема (по умолчанию)
  * `Midnight Slate` — глубокий полуночный синий
  * `Pure OLED` — абсолютный черный цвет для контрастных экранов
  * `Nord Frost` — арктический сине-серый минимализм
  * `Tokyo Night` — неоновый киберпанк
  * `Gruvbox Dark` — теплый ретро-стиль
  * `Monokai Pro` — культовая палитра редакторов кода
* **Desktop App UX:** Глобально отключено случайное выделение текста (`user-select: none`) и перетаскивание изображений.

---

## ⌨️ Горячие клавиши

| Сочетание | Действие |
| :--- | :--- |
| `Ctrl + K` | Открыть универсальную панель быстрых команд (Command Palette) |
| `Alt + F4` | Закрыть приложение |
| `Esc` | Закрыть модальные окна / палитру команд |

---

## 📥 Установка и запуск

### Требования
* Node.js 18+ или 20+
* Windows 10 или Windows 11 (x64)

### Сборка из исходников

```bash
# 1. Клонировать репозиторий
git clone https://github.com/<your-username>/storm-terminal.git
cd storm-terminal

# 2. Установить зависимости
npm install

# 3. Запуск в режиме разработки (Hot-Reload)
npm run dev

# 4. Сборка TypeScript и Vite
npm run build

# 5. Упаковка переносимого бинарника (Windows Unpacked)
npx electron-builder --dir
```

Готовый исполняемый файл будет находиться в директории:
`release/win-unpacked/STORM TERMINAL.exe`

---

## 🏗️ Структура проекта

```
storm-terminal/
├── build/                 # Ресурсы сборщика (многослойный icon.ico, icon.png)
├── public/                # Статические файлы для Vite (favicon, ico.png)
├── scripts/               # Утилиты конвертации иконок и подготовки релизов
├── src/
│   ├── main/              # Главный процесс Electron (Backend)
│   │   ├── ipc/           # Модули IPC: system, actions, network, processes, terminal, window
│   │   ├── system/        # Фоновый монитор и сборщики телеметрии
│   │   ├── terminal/      # Интерактивный терминальный исполнитель
│   │   └── main.ts        # Точка входа главного процесса Electron
│   │
│   ├── preload/           # Изолированный безопасный IPC-мост
│   │   └── preload.ts     # Экспорт window.stormAPI
│   │
│   ├── renderer/          # Интерфейс React (Frontend)
│   │   ├── assets/        # Встроенные логотипы и графика (logo.ts)
│   │   ├── components/    # Компоненты UI (TitleBar, Sidebar, CommandPalette, MetricCard)
│   │   ├── i18n/          # Локализация (RU / EN)
│   │   ├── pages/         # Страницы: Overview, System, Processes, Network, Storage, Tools, Terminal
│   │   └── styles/        # CSS-дизайн-система (theme.css, index.css)
│   │
│   └── shared/            # Общие TypeScript-типы и контракты
│
├── ico.png                # Исходный логотип высокого разрешения
├── package.json           # Зависимости и конфигурация Electron-Builder
├── tsconfig.json          # Конфигурация TypeScript
└── vite.config.ts         # Конфигурация сборщика Vite
```

---

## 📄 Лицензия и Авторские права
 
 Проект распространяется по модели **Source-Available & Non-Commercial License**. Исходный код открыт для аудита, обучения и сборки для личного использования.
 
 ⚠️ **Строго запрещено:**
 * Присвоение авторства, ребрендинг и удаление плашек авторства (*Made by Storm*).
 * Коммерческое использование, продажа программы или её фрагментов без письменного разрешения автора.
 * Несанкционированное распространение модифицированных сборок.
 
 Подробнее см. в файле [LICENSE](LICENSE). Все права защищены © 2026 [Storm](https://github.com/storm-dev-arch).

---

<div align="center">

**⚡ STORM TERMINAL • Made with passion by Storm**

</div>
