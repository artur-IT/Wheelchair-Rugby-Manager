# 🧭 Fullstack Project Kickoff — uniwersalny plan (checklista)

> Cel: mieć **jedną, stałą kolejność działań**, żebyś nie musiał za każdym razem myśleć „co teraz?” — tylko odhaczasz i idziesz dalej.

---

## 🟦 Zasada przewodnia

- Najpierw ustalasz **co budujesz i po co (MVP)**.
- Potem wybierasz **minimalną architekturę/stack**, który to uniesie.
- Dopiero na końcu dokładasz **produktywnościowe dodatki** (agent/rules/skills, rozbudowana dokumentacja, optymalizacje).

---

## 🟩 Etap 0 — Definicja problemu (bez kodu)

- [ x ] **Jedno zdanie o projekcie**: BUDUJĘ 'Menadżera sezonu rugby na wózkach' DLA osoby, która będzie organizować turnieje, ŻEBY mieć całą organizację turnieju w 1 miejscu.”
- [ x ] **Użytkownicy**: kto korzysta? (1 osoba).
- [ x ] **3 główne scenariusze (use-case)**: co user robi najczęściej?
  - logowanie
  - Ustawienia główne dla całego sezonu,
  - Tworzenie turnieju (CRUD):
  - Podgląd turnieju,
- [ x ] **Zakres ‘NIE robimy’ (anti-scope)**: 5–15 punktów.
- [ x ] **Kryterium sukcesu**: po czym poznasz, że projekt ma sens? (np. działa 1 flow end-to-end)
  - działa MVP (wyświetla przykładowe mockowane dane)

**Done when**: masz 1–2 akapity opisu + listę MVP + listę poza zakresem.
**Nie rób jeszcze**: wyboru bazy/ORM/hostingu „bo modne” — bez MVP to zgadywanie.

---

## 🟩 Etap 1 — MVP i “mapa produktu”

- [ x ] **MVP: 3–7 funkcji max** (w punktach).
  1. **Logowanie**
     - **Cel**: użytkownik może wejść do aplikacji i wraca do niej bez ponownego logowania (sesja).
     - **Must-have (MVP)**:
       - logowanie na PIN
       - wylogowanie
       - ochrona podstron “po zalogowaniu” (bez sesji → przekierowanie do logowania)
     - **Poza zakresem (na później)**: reset hasła, 2FA, logowanie społecznościowe, role/uprawnienia, audyt logowań.

  2. **Ustawienia główne dla całego sezonu**
     - **Cel**: ustalasz “ramy” sezonu, które będą używane w turniejach.
     - **Must-have (MVP)**:
       - jeden ekran ustawień sezonu
       - zapis + odczyt ustawień (persistencja)
       - minimum pól: nazwa sezonu (opcjonalnie: rok / opis)
     - **Poza zakresem (na później)**: historia zmian, wiele sezonów naraz, uprawnienia do edycji, rozbudowane walidacje.

  3. **Tworzenie turnieju (CRUD)**
     - **Cel**: dodasz/edytujesz/usuniesz turniej i widzisz go na liście.
     - **Must-have (MVP)**:
       - lista turniejów
       - dodanie turnieju (formularz z minimum: nazwa + data)
       - edycja turnieju
       - usunięcie turnieju z potwierdzeniem
     - **Poza zakresem (na później)**: import/eksport, duplikowanie, zaawansowane filtrowanie, workflow statusów, rozbudowane pola.

  4. **Podgląd turnieju**
     - **Cel**: wejdziesz w szczegóły turnieju i zobaczysz podstawowe dane.
     - **Must-have (MVP)**:
       - ekran szczegółów turnieju
       - wyświetlenie podstawowych pól (np. nazwa, data)
       - nawigacja: powrót do listy / przejście do edycji
     - **Poza zakresem (na później)**: publiczny link, generowanie PDF, statystyki, udostępnianie, “ładne raporty”.

- [ x ] **1 user flow**: od wejścia do “wow, działa”.
- [ ] **Minimalny model danych**: lista encji + relacje.
- [ x ] **Wymagania niefunkcjonalne (must-have)**:
  - [ x ] RWD

**Done when**: umiesz opisać MVP w 60 sekund i wiesz jakie dane musisz zapisać.
**Nie rób jeszcze**: 200 tasków — na razie planujesz tylko najbliższy etap.

---

## 🟨 Etap 2 — Decyzje techniczne (minimalny zestaw)

Wybierz tylko rzeczy, które trudno zmienić później:

- [ x ] **Typ aplikacji**: web / mobile / desktop - DECYZJA: Wszystkie platformy
- [ x ] **Forma fullstack**: monorepo (często najlepszy start) vs osobne repo - DEZYCJA: Monorepo
- [ x ] **Framework**: np. Next.js (dla fullstack web) - DEZYCJA: Next.js
- [ x ] **Baza**: Postgres (uniwersalna) lub inna, jeśli masz powód - DEZYCJA: Postgres
- [ x ] **ORM / DB layer**: Prisma / Drizzle / SQL (jeden wybór) - DEZYCJA: Prisma
- [ x ] **Auth**: gotowiec (np. Auth.js) vs własny - DEZYCJA: OAuth 2.0 + OpenID Connect (OIDC)
- [ x ] **Hosting**: gdzie deployujesz app i DB - DEZYCJA: 1Free.eu (VPS)

**Done when**: masz listę 5–8 decyzji + krótkie “dlaczego”.
**Nie rób jeszcze**: mikroserwisów, CQRS, event-driven — dopóki nie masz skali i realnych problemów.

---

## 🟨 Etap 2a — UI bez designera (szkielet + style guide)

Cel: dostać **spójny, responsywny layout i podstawowe style**, żebyś mógł budować MVP bez zastanawiania się „jak to ma wyglądać”.

### Uniwersalny prompt (HTML + CSS skeleton całej aplikacji)

Skopiuj i wklej do wybranego narzędzia AI. Podmień tylko fragmenty w `<>`.

```text
You are a senior UI engineer. Generate a clean, responsive HTML + CSS starter UI for a fullstack web app.

Context:
- App name: <name>
- App type: admin/dashboard style application
- Main user flow (1): <describe in 3-6 steps>
- Pages needed now: <list 2-4 pages for MVP>
- Brand vibe: neutral, modern, simple (no fancy visuals)

Output requirements:
1) Provide ONE HTML file and ONE CSS file.
2) Use semantic HTML5 and accessible patterns (labels for inputs, focus states, aria where needed).
3) Layout: top navigation + optional left sidebar + main content area.
4) Include these UI sections/components as HTML blocks with realistic placeholders:
   - Login form (email + password)
   - Dashboard overview (cards)
   - Data list/table page (search, filters, pagination placeholders)
   - Create/Edit form page (inputs, select, textarea, validation message placeholders)
   - Modal dialog
   - Toast/alert messages
   - Loading skeleton, empty state, error state
5) CSS:
   - Use CSS variables for design tokens: colors, spacing, radius, shadows, font sizes.
   - Provide light mode and dark mode (via [data-theme="dark"] on <html>).
   - Provide responsive breakpoints (mobile/tablet/desktop).
   - Provide clear focus-visible styles and accessible color contrast.
   - Prefer simple class naming (BEM or simple utility classes), consistent across files.
6) Do NOT use any external libraries or frameworks. No Tailwind, no Bootstrap.
7) Keep it practical and minimal — this is a starter skeleton, not a final design.

Deliverables:
- index.html content
- styles.css content
- Short note: which parts map to which pages and how to extend it.
```

### Polecane narzędzia do automatycznego generowania UI

- **Kod UI (React/Next) z gotowych komponentów**: v0 (Vercel) + często shadcn/ui jako baza komponentów.
- **No-code szybki wygląd (często lepszy do landingów)**: Framer / Webflow.
- **Google AI Studio** - najlepsze narzędzie do generowania szablonu strony web z dobrym kodem i strukturą plików + ładny design.

### Szybka zasada wyboru (żeby nie myśleć za każdym razem)

- Jeśli chcesz **jak najszybciej kod w repo i działające ekrany MVP** → **v0 + biblioteka komponentów**.
- Jeśli chcesz najpierw **poukładać UX bez walki z CSS** → **Figma (wireframe)**.

### Co generujesz / co robisz z wynikiem

- [ x ] Wygeneruj: layout (topbar/sidebar), podstawowe komponenty, stany (loading/empty/error), tokeny (CSS variables).
- [ x ] Dopasuj do **1 flow MVP** (wystarczą 1–2 ekrany).

**Done when**: masz spójny “wygląd” i gotowy szkielet pod pierwszy pion MVP.

### Kiedy importować wygenerowany szablon do projektu?

- **Import do repo rób w Etapie 3** (po utworzeniu projektu i ustawieniu minimum jakości typu formatter/linter).

### Czy poprawiać ręcznie wygenerowany kod od razu?

- **Tak, ale tylko minimalnie** — potraktuj to jako “szkic”.
- **Od razu popraw**: strukturę plików, nazewnictwo/spójność, a11y basics (label, focus), usuń zbędne elementy niepasujące do MVP.
- **Nie poprawiaj od razu**: pixel-perfect UI, animacji, pełnego design systemu, wszystkich ekranów aplikacji.
- **Zasada**: po imporcie zrób szybki “cleanup” i idź do Etapu 6 (pierwszy działający pion).

**Nie rób za wcześnie**: nie poleruj UI do ideału i nie projektuj całej aplikacji w Figmie przed pierwszym pionem danych.

---

## 🟨 Etap 3 — Repo i standard jakości (bez nadmiaru)

- [ x ] Utwórz repo / wybierz boilerplate dopasowany do Etapu 2 - DEZYCJA: 10xDevs Astro starter
- [ x ] Minimum plików:
  - [ ] `README.md` (co to jest + jak odpalić)
  - [ x ] `.env.example`
  - [ x ] `.gitignore`
  - [ -] `LICENSE` (opcjonalnie)
- [ ] Zaimportuj wygenerowany szablon aplikacji do projektu

**Done when**: projekt odpala się lokalnie w 1 komendzie i ma spójne formatowanie.
**Nie rób jeszcze**: 15 narzędzi naraz (Storybook, Cypress, Sentry, Terraform…) — dodasz, gdy realnie potrzebujesz.

---

## 🟦 Etap 4 — Minimalna architektura + struktura folderów

- [ ] Ustal granice warstw (prosto):
  - UI (components/pages)
  - logika UI (hooks)
  - komunikacja (api/client)
  - serwer (routes/handlers)
  - db (schema/queries)
- [ ] Konwencje: nazwy plików, komponentów, endpointów.
- [ ] Zaplanuj jedną ścieżkę: **UI → API → DB → UI**.

**Done when**: wiesz gdzie dodać ekran/endpoint/model bez myślenia.
**Nie rób jeszcze**: “idealnej” struktury pod przyszłe feature’y, których nie ma w MVP.

---

## 🟦 Etap 5 — GitHub Projects i pierwsze taski

- [ x ] Utwórz GitHub Project.
- [ x ] Kolumny: Backlog / Next / In Progress / Done.
- [ ] Dodaj 10–25 tasków maks na najbliższy etap.
- [ x ] Priorytety:
  - [ x ] **P0**: musi być, żeby flow działał
  - [ x ] **P1**: poprawia jakość, ale nie blokuje
  - [ x ] **P2+**: dodatki

**Done when**: masz jasne “co robię przez najbliższe dni”.
**Nie rób jeszcze**: planowania sprintów na miesiąc — zmienisz zdanie po 1–2 dniach budowania.

---

## 🟥 Etap 6 — Zbuduj MVP end-to-end (pierwszy działający pion)

- [ x ] UI dla 1 flow (nawet brzydki, byle działał)
- [ x ] API dla tego flow
- [ x ] DB zapis/odczyt
- [ x ] Obsługa błędów (minimum: komunikat + log)

**Done when**: da się przejść flow od początku do końca bez ręcznego “grzebania w bazie”.
**Nie rób jeszcze**: “final” UI, dopóki nie masz działającej logiki i danych.

---

## 🟪 Etap 7 — Po pierwszym MVP: produktywność i porządkowanie

Teraz dopinasz rzeczy, które naprawdę zaczną oszczędzać czas:

- [ x ] `AGENTS.md` / `agent.md`: jak AI ma pracować w repo (stack, foldery, zasady, styl).
- [ x ] Rules / Skills / Commands:
  - [ x ] rules: standardy i decyzje (krótko)
  - [ x ] skills: automatyzacje powtarzalnych rzeczy
  - [ x ] commands: gotowe polecenia/szablony pracy
- [ x ] Dokumentacja, która realnie pomaga:
  - [ x ] `PROJECT.md`: scope, MVP, roadmap
  - [ - ] `ARCHITECTURE.md`: warstwy + przepływy
  - [ - ] `DECISIONS.md`: krótkie decyzje “co i dlaczego”

**Done when**: widzisz powtarzalne problemy i te pliki realnie oszczędzają czas.
**Dlaczego nie wcześniej**: na starcie nie wiesz jeszcze, co będzie powtarzalne — łatwo zrobić “martwe” zasady.

---

## 🧩 Uniwersalny wzór? Tak — z wyjątkami

To jest uniwersalne, bo idzie po ryzykach:

1. sens produktu → 2) trudne decyzje → 3) działający pion → 4) optymalizacja procesu.

**Wyjątki**:

- twarde wymagania (compliance, bezpieczeństwo, enterprise integracje) → Etap 2/4 robisz wcześniej i dokładniej,
- mini-projekty na 1–2 dni → skracasz Etapy 2/4/7 do minimum.

## 🧠 Szybka ściąga: “Co teraz?”

Jeśli utkniesz: **wróć do 1 flow end-to-end** i zapytaj: “co mnie blokuje, żeby to działało?”.
