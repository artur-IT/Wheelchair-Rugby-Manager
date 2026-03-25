# Brudnopis notatek do projektu

### Generowanie Designu UI z AI

- **Najlepiej wygenerował Google AI Studio (z mojego prompta)** - mało plików, dobra struktura kodu,
- 3 mniejsze prompty na design wygenertowane przez GPT-5.2 były słabe (czasochłonne i nie było zadowalającego designu),
- NIE polegać na promptach od AI do generowania designu UI,
- lepszy jest mój długi prompt (wcale nie za długi dla Google AI Studio),

Zostaje szablon struktury stron wygenerowany przez Google AI Studio. Teraz trzeba go dopasować do mojego projektu.

---

## Co robiłem i w jakiej kolejności dobrze jest to robić (Mój Plan):

T: Teoria
P: Praca

1. stworzyłem plik PROJECT.md z ogólnym opisem projektu
2. Cursor AI - zasady:

- stworzyłem plik AGENTS.md z opisem jak AI ma pracować w repo (stack, foldery, zasady, styl).
- dostosowanie rules, commands, skills do projektu:

- opisałem MVP :T
- spisałem stack technologiczny :T
- stworzyłem bardzo dobry prompt do wygenerowania szablonu strony :T
- nie robiłem projektów UI, bo Google AI Studio generuje dobry design i kod :P
  - zamieniłem wygenerowany styl na MUI (jest brzydszy), ale m.in. ma lepsze a11y :P
- utworzyłem repozytorium na GitHub :P
- zaimportowałem 10xDev Astro starter do repozytorium :P
- utworzyłem GitHub Project: :P
  - dodawałem pierwsze zadania teoretyczne (plany wdrożenia) :T
- konfiguracja rules i AGENTS.md :T
- realizacja MVP:
  - sprawdzenie nawigacji (wszędzie, buttony, powroty) :P

---

### DB - opis relacji między modelami

1 sezon posiada: drużyny, sędziowie, klasyfikatorzy.

Turnieje są tworzone tylko na bazie ustawień sezonu.
Jeśli w ustawieniach sezonu nie ma dostepnych danych (np. zawodnika, sędziego) to nie mozna go dodać do turnieju.
Każdy nowy turniej to nowy zestaw danych z ustawień sezonu.
Turniej może być edytowany w trakcie sezonu.

1 drużyna posiada: kilku zawodników, 1 trenera, 1 sędziego.
1 drużyna może być w kilku turniejach.
1 drużyna w 1 turnieju może być dodana tylko 1 raz.
1 drużyna może rozegrać kilka meczy w 1 turnieju.

1 sędzia może być w kilku turniejach.
1 sędzia może sędziować wiele meczy w tym samym turnieju.
Sędzia w 1 meczu może pełnić 1 funkcję (boiskowy lub stolikowy).

1 turniej - user dodaje (system pobiera/kopiuje) z ustawień sezonu: drużyny, sędziowie, klasyfikatorzy
1 turniej może mieć wiele meczy.
1 turniej może mieć wiele sędziów.
1 turniej może mieć wiele klasyfikatorów.
1 turniej może mieć wiele wolontariuszy.
1 turniej może mieć kilka hoteli.
1 turniej może mieć kilka hal sportowych.
1 turniej może mieć kilka planów wyżywienia.

1 mecz posiada: 2 drużyny, 2 sędziów boiskowych i 2 stolikowych (w sumie 4 sędziów).

Każdy zawodnik należy tylko do 1 drużyny.

Klasyfikatorzy są przypisywani tylko do turnieju.
Klasyfikatorzy badają wybranych zawodników w turnieju.

---

### GitHub Gists (odkrycie projektu!)

Daily Notes robić modelem: Sonnet 4.6 lub Auto

---

```bash
"concurrently": "^9.2.1" - npm package do uruchamiania wielu komend naraz

"dev:full": "concurrently \"npm run dev\" \"npx prisma studio\" \"npm run test:watch\"", - uruchamia wszystko 1 komendą (dev serwer, prisma studio, testy)
```

---

### Prisma i PostgreSQL:

**\*Uwaga dla przyszłości: po zmianach w prisma/schema**:

1. Zastosuj migrację: `pnpm prisma migrate dev` (development) lub `pnpm prisma db push` (prototyping)
2. Wygeneruj klienta: `pnpm prisma generate`
3. Zrestartuj serwer

Dzięki temu kod Astro/Node będzie używał zaktualizowanego klienta i schematu bazy danych.\*

---

Code Rabbit do code review po commitach, ALE przed zatwierdzeniem PR.

---

REFEREE MATCH PLAN prompt:

_Poniżej planu rozgrywek i na podstawie planu rozgrywek stwórz podobny plan dla sędziów.
Kolumny jakie ma zawierać formularz dokładnie w tej kolejności to:_

- Drużyna A
- Start
- Koniec
- Drużyna B
- Boisko
- Sędzia 1
- Sędzia 2
- Stolik kar
- Zagary

_dodaj takie same funkcjonalności tj. edycja, usuwanie, tworzenie nowych pozycji.
tworzenie i usuwanie dnia itp.
całą sekcję dla sędziów wyróżnij innym kolorem tła i nagłówkiem._

AGENT: Auto
EFEKT: Super! - tylko po tym 1 poleceniu (bez dopisywania poprawek) otrzymałem:

- dokładny plan rozgrywek sędziów,
- wszystkie niezbędne kolumny
- bez błędów w konsoli DevTools!
- pełny CRUD dla nowych dni planu rozgrywek sędziów,
- CRUD wybranego dnia planu rozgrywek sędziów,

DO POPRAWKI:

- Nie wszystkie testy przechodziły, ale wszystko działało!

WNIOSEK:
Dobrze przemyślany i zaplanowany prompt to wielka siła i ma świetny potencjał oraz sens do tworzenia całych nowych modułów!

---

Ładny design - https://soleilenergia.pl/ - może by zastosować?

---

### User Stories

- NIE planować wszystkich User Stories na początku!
- Planuj po 1 User Story na 1 moduł / sekcję i dopiero po zaimplementowaniu iść do następnego. Wtedy mogę dokładnie zobaczyć, co potrzebuję i co nie potrzebuję i doskonalić treść następnego US.

---

Classificators Plan prompt:

w szczegółach turnieju, Poniżej planu dla sędziów i na podstawie planu sędziów stwórz podobny plan dla klasyfikatorów.
Kolumny jakie ma zawierać formularz dokładnie w tej kolejności to:

- imię i nazwisko zawodnika
- godzina startu badania
- godzina zakończenia badania
- klasyfikacja

Podczas dodawania nowego zawodnika do planu klasyfikatorów wyświetl listę dostępnych zawodników z obecnego turnieju.
Na liście zawodników ma być prosty filtr wyszukiwania po imieniu lub nazwisku.
kliknięty zawodnik jest pobierany do formularza i wyświetlany w nim.

dodaj takie same funkcjonalności tj. edycja, usuwanie, tworzenie nowych pozycji.
tworzenie i usuwanie dnia itp.
całą sekcję wyróżnij innym kolorem tła i nagłówkiem.

AGENT: Auto
EFEKT: Dobry+ - wymaga dopracowania i poprawek

- dokładny plan klasyfikatorów,
- wszystkie niezbędne kolumny
- bardzo dobry widok dodawania zawodnika + filtr wyszukiwania
- bez błędów w konsoli DevTools!
- wadliwy CRUD dla nowych dni planu klasyfikatorów,

DO POPRAWKI:

- nie moge wybrać godziny zakończenia badania
- nie mogę dodać zawodnika jesli nie ma wcześniej dodanych meczów w turnieju, a powinienem moć to zrobić
- jeśli są dodane mecze to plan klasyfikatorów ma zawierać tylko przycisk 'dodaj badanie'
- po kliknęciu 'usun dzień' dzień się usuwa z bazy, ale widok się nie aktualizuje
- mogę dodać badanie w tym samym czasie co inne badanie, nie może tak być
- niedziela zapisuje sie ale po odswieżeniu strony znika
- jeśli wszystkie dni są już dodane to przycisk 'nowy dzień' musi byhć nie aktywny
- po różnych operacjach na planie klasyfikatorów np. utworzeniu nowego dnia, dodaniu zawodników i odswieżeniu strony zostaje tylko piątek
- po usunięciu planu sędziów zostaje też usunięty cały plan rozgrywek i klasyfikatorów. Każdy Plan ma działać niezależnie od siebie bez wpływu na pozostałe plany .
