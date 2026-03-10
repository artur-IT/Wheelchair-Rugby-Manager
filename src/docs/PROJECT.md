# Wheelchair Rugby Tournament Manager

### Project Overview

Aplikacja do zarządzania całym sezonem rozgrywek rugby na wózkach, czyli organizowanymi weekendowymi turniejami.
Użytkownikiem będzie 1 osoba odpowiedzialna za organizację całego turnieju. Osoba ta musi zapisać wiele różnych informacji.

## MVP (Główne ETAPY)

1. logowanie
2. ustawienia całego sezonu
3. tworzenie turnieju (CRUD):
   - hali sportowej
   - zakwaterowania
   - drużyn biorących udział w turnieju
   - sędziów boiskowych i stolikowych
   - klasyfikatorów
   - wolontariuszy
   - planu rozgrywek meczów pomiędzy drużynami
4. podgląd całego wydarzenia

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">v.2 (opcjonalne):</h3></summary>

- rozpiska meczy (+pdf),
- plan meczów dla sędziów (+pdf):
  - kto z kim,
  - o której,
  - które boisko,
- dodawanie wyników meczów z tego turnieju:
  - kto z kim,
  - wynik
- plan klasyfikacji zawodników (+pdf):
  - zawodnik,
  - gdzie,
  - o której,
- tabela generalna drużyn po turnieju:
  - miejsca zajęte,
  - wynik,
  - pkt. zdobyte / stracone,
  - pkt. generalne
- informator turniejowy dla wszystkich (+pdf)
- lista sezonów
</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">User Flow</h3></summary>

### 1) Wejście do aplikacji

1. Użytkownik otwiera stronę startową.
2. Widzi:
   - nazwę aplikacji,
   - krótki opis,
   - formularz logowania.
3. Użytkownik wpisuje e-mail i hasło.
4. System:
   - przy poprawnych danych loguje i przenosi do panelu głównego,
   - przy błędnych danych pokazuje czytelny komunikat.

### 2) Panel główny po zalogowaniu

1. Użytkownik trafia do dashboardu.
2. Widzi główne sekcje:
   - Ustawienia sezonu,
   - Turnieje,
   - Edycja konta,
   - Wyloguj.
3. Użytkownik wybiera, czy najpierw ustawia sezon, czy od razu przechodzi do turniejów.

### 3) Ustawienia sezonu (przygotowanie danych bazowych)

1. Użytkownik wchodzi w **Ustawienia sezonu**.
2. Dodaje i edytuje dane globalne:
   - drużyny,
   - sędziów,
   - klasyfikatorów,
   - wolontariuszy.
3. Dla każdej listy działa pełny CRUD:
   - dodaj,
   - podgląd listy,
   - edytuj,
   - usuń.
4. System zapisuje dane i pokazuje potwierdzenie po każdej poprawnej operacji.

### 4) Lista turniejów

1. Użytkownik przechodzi do sekcji **Turnieje**.
2. Widzi:
   - listę istniejących turniejów,
   - przycisk „Nowy turniej”.
3. Może:
   - otworzyć szczegóły turnieju,
   - edytować turniej,
   - usunąć turniej.

### 5) Tworzenie nowego turnieju (MVP)

1. Użytkownik klika „Nowy turniej”.
2. Uzupełnia podstawowe dane turnieju (np. nazwa, termin).
3. Uzupełnia dane organizacyjne:
   - hala sportowa (+ link do mapy),
   - zakwaterowanie (+ link do mapy),
   - wyżywienie.
4. Przypisuje zasoby do turnieju:
   - drużyny,
   - sędziów,
   - klasyfikatorów,
   - wolontariuszy.
5. Tworzy plan rozgrywek meczów pomiędzy drużynami.
6. Zapisuje turniej.
7. System tworzy rekord turnieju i przenosi do widoku szczegółów.

### 6) Podgląd i prowadzenie turnieju (MVP)

1. Użytkownik otwiera szczegóły jednego turnieju.
2. Widzi wszystkie kluczowe bloki danych:
   - miejsce i logistyka,
   - listy osób i drużyn,
   - plan meczów,
   - plan sędziowania.
3. Przy każdym bloku może:
   - edytować dane,
   - usuwać elementy,
   - dodawać nowe elementy.
4. System zapisuje zmiany i utrzymuje aktualny stan wydarzenia.

### 7) Zakończenie pracy z turniejem

1. Po zapisaniu zmian użytkownik wraca do listy turniejów.
2. W dowolnym momencie może ponownie wejść w szczegóły i kontynuować edycję.
3. Po zakończeniu pracy użytkownik się wylogowuje.

### 8) User Flow rozszerzony (v2 - opcjonalnie)

1. Po przygotowaniu turnieju użytkownik może wygenerować dokumenty PDF:
   - rozpiska meczów,
   - plan meczów dla sędziów,
   - plan klasyfikacji zawodników,
   - informator turniejowy.
2. W trakcie lub po turnieju użytkownik wpisuje wyniki meczów.
3. System automatycznie aktualizuje:
   - tabelę turniejową,
   - tabelę generalną sezonu (punkty zdobyte/stracone, punkty generalne, miejsca).
4. Użytkownik przegląda listę sezonów i może otworzyć dane historyczne.

### 9) Najważniejsze zasady UX w całym przepływie

- Każda akcja zapisu powinna mieć widoczne potwierdzenie.
- Każda akcja usunięcia powinna mieć krok potwierdzenia.
- Błędy walidacji muszą być jasne i napisane prostym językiem.
- Użytkownik zawsze powinien wiedzieć, gdzie jest (breadcrumb lub nagłówek sekcji).

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">Design Prompts do AI</h3></summary>

<div style="color: #56D5FC;">
Aplikacja do zarządzania całym sezonem rozgrywek rugby na wózkach, czyli organizowanymi weekendowymi turniejami. Podstawowym użytkownikiem będzie osoba odpowiedzialna za organizację turnieju. Osoba ta musi zapisać m.in. takie informacje jak: plan rozgrywek pomiędzy drużynami, zakwaterowanie i adres hali, listę drużyn biorących udział w lidze wraz z zawodnikami, trenerem istaffem oraz sędziów boiskowych i stolikowych. Dochodzą jeszcze klasyfikatorzy, którzy badają zawodników wg ustalonego harmonogramu. Są jeszcze wolontariusze. To są najważniejsze dane.

Utwórz szkielet nowoczesnej i responsywnej strony mojego projektu. Powinien zawierać taką strukturę stron:

- startowa: tytuł, logowanie, informacja o aplikacji
- po zalogowaniu: ustawienia sezonu, wyloguj, edycja konta, turnieje
- strona turnieje:
  - lista turniejów,
  - podgląd turnieju,
  - nowy turniej,
  - edycja turnieju,
  - usuwanie turnieju
- strona ustawienia sezonu:
  - drużyny (nazwa, logo, dane teleadresowe, osoba do kontaktu (imię, nazwisko, email, telefon), trener, staff),
    - lista drużyn,
    - nowa drużyna,
      - lista zawodników,
      - nowy zawodnik,
        - edycja zawodnika,
        - usuwanie zawodnika,
      - trener,
        - nowy trener,
        - edycja trenera,
        - usuwanie trenera,
      - staff,
        - nowy staff,
        - edycja staffu,
        - usuwanie staffu,
    - edycja drużyny,
    - usuwanie drużyny,
  - sędziowie (imię, nazwisko, telefon, email),
    - lista sędziów,
    - nowy sędzia,
      - imię,
      - nazwisko,
      - telefon,
      - email,
    - edycja sędziego,
    - usuwanie sędziego,
  - klasyfikatorzy (imię, nazwisko, telefon, email),
    - lista klasyfikatorów,
    - nowy klasyfikator,
      - imię,
      - nazwisko,
      - telefon,
      - email,
    - edycja klasyfikatora,
    - usuwanie klasyfikatora,
  - wolontariusze (imię, nazwisko, telefon),
    - lista wolontariuszy,
    - nowy wolontariusz,
      - imię,
      - nazwisko,
      - telefon,
      - email,
    - edycja wolontariusza,
    - usuwanie wolontariusza,
- strona jednego turnieju wyświetla szczegóły turnieju. Wszystkie poniższe informacje powinny być wyświetlane w formie listy, tabeli lub karty. Przy każdym polu ma być możliwość edycji i wyczyszczenia zawartości pola.:
  - hala sportowa i link do mapy,
  - zakwaterowanie i link do mapy,
  - wyżywienie,
  - lista drużyn,
  - plan rozgrywek meczów pomiędzy drużynami,
  - lista sędziów,
  - lista klasyfikatorów,
  - lista wolontariuszy,
  - plan sędziowania.

Stack to: na razie tylko i wyłącznie HTML5 z jego walidacją formularzy, CSS3 i podział na komponenty React, Typescript.

</div>
</details>

## Stack technologiczny

Jest w pliku `.cursor/rules/shared.mdc`.

## Epic - duża część systemu (Epiki mają być funkcjonalne)

### Definition of Done (DoD)

Każda Story musi mieć:

<ul style="color: yellow;">

- kod napisany
- testy przechodzą
- brak console errors
- ESLint czysty
- commit powiązany z ticketem
- działa na dev server
  </ul>
To jest profesjonalizm. **Max. 2 taski w Progress**.

## ETAP 1.1

**Cel:** Dodanie logowania i rejestracji do aplikacji.

### 🔐 Authentication

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US1: Logowanie (email + hasło)</h3></summary>

**User Story**

- Jako użytkownik chcę móc zalogować się za pomocą e-maila i hasła, aby uzyskać dostęp do mojego konta i funkcji aplikacji.

**Kryteria akceptacji**

- Widzę formularz: e-mail, hasło, przycisk „Zaloguj”.
- Po poprawnych danych zostaję zalogowany i przekierowany do aplikacji.
- Przy błędnych danych widzę czytelny komunikat (np. „Nieprawidłowy e-mail lub hasło”).

**Zadania techniczne**

- Frontend
  - [ ] Widok i routing strony `/login`.
  - [ ] Formularz z walidacją (e-mail w poprawnym formacie, hasło wymagane) + czytelne błędy.
  - [ ] Integracja z API logowania (np. `POST /auth/login`) + obsługa stanów: loading / success / error.
  - [ ] Obsługa sesji użytkownika (np. tokeny w bezpiecznych cookies httpOnly lub inna ustalona strategia).
  - [ ] Trasy chronione (użytkownik niezalogowany nie wchodzi do części aplikacji).
- Backend / API
  - [ ] Endpoint logowania + walidacja danych.
  - [ ] Bezpieczne hashowanie haseł w bazie (np. Argon2/Bcrypt).
  - [ ] Ochrona przed brute force (np. rate limit / blokada po wielu próbach).
- Testy
  - [ ] Scenariusze: poprawne logowanie, błędne hasło, nieistniejący e-mail, walidacja pól.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US2: Rejestracja</h3></summary>

**User Story**

- Jako nowy użytkownik chcę móc założyć konto, aby korzystać z aplikacji jako zalogowany użytkownik.

**Kryteria akceptacji**

- Widzę formularz rejestracji (np. e-mail, hasło, powtórz hasło).
- Po poprawnym wypełnieniu konto zostaje utworzone.
- Dostaję informację o sukcesie i mogę się zalogować (albo jestem zalogowany automatycznie — zależnie od decyzji produktu).

**Zadania techniczne**

- Frontend
  - [ ] Widok i routing strony `/register`.
  - [ ] Formularz rejestracji + walidacja (zgodność haseł, minimalna długość hasła).
  - [ ] Integracja z API rejestracji (np. `POST /auth/register`) + obsługa błędów (np. „E-mail już istnieje”).
  - [ ] Po sukcesie: przekierowanie do `/login` lub auto-login.
- Backend / API
  - [ ] Endpoint rejestracji + walidacja danych.
  - [ ] Reguły dla hasła (min. długość, ewentualnie polityka złożoności).
  - [ ] Unikalność e-maila + sensowne komunikaty błędów.
- Testy
  - [ ] Scenariusze: poprawna rejestracja, zajęty e-mail, słabe hasło, brak zgodności haseł.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US3: Reset hasła („Zapomniałem hasła”)</h3></summary>

**User Story**

- Jako użytkownik, który zapomniał hasła, chcę móc zresetować hasło, aby odzyskać dostęp do konta.

**Kryteria akceptacji**

- Widzę opcję „Nie pamiętasz hasła?” na ekranie logowania.
- Mogę podać e-mail i wysłać prośbę o reset.
- Widzę komunikat, że jeśli e-mail istnieje, instrukcja została wysłana (bez ujawniania, czy konto istnieje).
- Mogę ustawić nowe hasło po wejściu w link resetu.

**Zadania techniczne**

- Frontend
  - [ ] Widok i routing strony `/forgot-password` (podanie e-maila).
  - [ ] Widok i routing strony `/reset-password?token=...` (ustawienie nowego hasła).
  - [ ] Formularze + walidacja + obsługa stanów loading/success/error.
  - [ ] Integracja z API (np. `POST /auth/forgot-password` i `POST /auth/reset-password`).
- Backend / API
  - [ ] Generowanie tokenu resetu (jednorazowy, z datą ważności) i zapisanie go w bezpieczny sposób.
  - [ ] Wysyłka e-maila z linkiem resetu.
  - [ ] Endpoint ustawienia nowego hasła: weryfikacja tokenu + ustawienie nowego hasła + unieważnienie tokenu.
- Bezpieczeństwo
  - [ ] Token resetu krótko ważny, nie do odgadnięcia, używalny tylko raz.
  - [ ] Komunikat nie może zdradzać, czy konto istnieje.
- Testy
  - [ ] Scenariusze: poprawny reset, nieważny/wygasły token, walidacja nowego hasła.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US4: Logowanie przez Google</h3></summary>

**User Story**

- Jako użytkownik chcę móc zalogować się przez Google, aby szybciej wejść do aplikacji bez wpisywania hasła.

**Kryteria akceptacji**

- Widzę przycisk „Zaloguj przez Google”.
- Po poprawnej autoryzacji Google zostaję zalogowany i wracam do aplikacji.
- Gdy anuluję lub wystąpi błąd, widzę czytelny komunikat i mogę wrócić do zwykłego logowania.

**Zadania techniczne**

- Frontend
  - [ ] Przycisk logowania Google na `/login`.
  - [ ] Przekierowanie do flow OAuth (zależnie od architektury: frontend-only lub przez backend).
  - [ ] Obsługa błędów/anulowania oraz powrotu do aplikacji.
- Backend / API (jeśli robimy własny backend)
  - [ ] Konfiguracja OAuth (Client ID/Secret, redirect URI).
  - [ ] Endpoint startu i callback (np. `/auth/google` i `/auth/google/callback`).
  - [ ] Po stronie serwera: weryfikacja tokenu Google, utworzenie/połączenie konta użytkownika, start sesji.
- Testy
  - [ ] Scenariusze: udane logowanie, anulowanie, błąd OAuth, pierwsze logowanie (tworzenie konta).

</details>

## ETAP 2.1

**Cel:** Dodanie ustawień sezonu do aplikacji.

### ⚙️ Season Settings

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US1: Zarządzanie ustawieniami sezonu (CRUD)</h3></summary>

**User Story**

- Jako organizator chcę móc tworzyć i edytować ustawienia sezonu, aby mieć jedno miejsce do zarządzania danymi sezonu (drużyny, sędziowie, klasyfikatorzy).

**Kryteria akceptacji**

- Mogę utworzyć sezon i zapisać podstawowe ustawienia.
- Mogę edytować i przeglądać dane sezonu.
- Dane sezonu są zapisane trwale (po odświeżeniu nic nie znika).

**Zadania techniczne**

- Frontend
  - [ ] Widok i routing strony ustawień sezonu (np. `/season-settings`).
  - [ ] Podział UI na sekcje: Drużyny / Sędziowie / Klasyfikatorzy.
  - [ ] Obsługa stanów: loading / empty / error / success.
- Backend / API
  - [ ] Model/encja `Season` + powiązania do: `Team`, `Referee`, `Classifier`.
  - [ ] Endpointy CRUD dla sezonu (np. `GET/POST/PATCH/DELETE /seasons`).
- Testy
  - [ ] Scenariusze: zapis ustawień, edycja, błędy walidacji, odświeżenie strony.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US2: Drużyny sezonu (CRUD)</h3></summary>

**User Story**

- Jako organizator chcę dodawać i edytować drużyny w sezonie, aby móc później używać ich w turniejach i planach meczów.

**Zakres danych drużyny**

- nazwa
- logo
- dane teleadresowe
- osoba do kontaktu (imie, nazwisko, email, telefon)
- trener
- zawodnicy

**Kryteria akceptacji**

- Mogę dodać nową drużynę i widzę ją na liście.
- Mogę edytować i usuwać drużynę.
- Walidacja: nazwa wymagana, e-mail w poprawnym formacie (dla osoby kontaktowej).

**Zadania techniczne**

- Frontend
  - [ ] Lista drużyn + akcje: dodaj/edytuj/usuń.
  - [ ] Formularz drużyny z walidacją (w tym kontakt i trener).
  - [ ] Upload logo (albo placeholder, jeśli logo opcjonalne).
  - [ ] Zarządzanie zawodnikami w drużynie (lista + dodaj/usuń).
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /seasons/:seasonId/teams`).
- Backend / API
  - [ ] Model/encja `Team` + pola wg zakresu (w tym `contactPerson`, `coach`, `players`).
  - [ ] Endpointy CRUD dla drużyn w sezonie.
  - [ ] Obsługa pliku logo (jeśli dotyczy): storage + walidacja typu/rozmiaru.
- Testy
  - [ ] Scenariusze CRUD drużyny + walidacja + upload logo.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US3: Sędziowie sezonu (CRUD)</h3></summary>

**User Story**

- Jako organizator chcę dodawać i edytować sędziów sezonu, aby móc przypisywać ich później do meczów/turniejów.

**Zakres danych sędziego**

- imie, nazwisko, email, telefon

**Kryteria akceptacji**

- Mogę dodać sędziego i widzę go na liście.
- Mogę edytować i usuwać sędziego.
- Walidacja: imie i nazwisko wymagane, e-mail w poprawnym formacie.

**Zadania techniczne**

- Frontend
  - [ ] Lista sędziów + akcje: dodaj/edytuj/usuń.
  - [ ] Formularz sędziego + walidacja.
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /seasons/:seasonId/referees`).
- Backend / API
  - [ ] Model/encja `Referee`.
  - [ ] Endpointy CRUD dla sędziów w sezonie.
- Testy
  - [ ] Scenariusze CRUD sędziego + walidacja.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US4: Klasyfikatorzy sezonu (CRUD)</h3></summary>

**User Story**

- Jako organizator chcę dodawać i edytować klasyfikatorów sezonu, aby móc przypisywać ich później do zadań w turniejach.

**Zakres danych klasyfikatora**

- imie, nazwisko, email, telefon

**Kryteria akceptacji**

- Mogę dodać klasyfikatora i widzę go na liście.
- Mogę edytować i usuwać klasyfikatora.
- Walidacja: imie i nazwisko wymagane, e-mail w poprawnym formacie.

**Zadania techniczne**

- Frontend
  - [ ] Lista klasyfikatorów + akcje: dodaj/edytuj/usuń.
  - [ ] Formularz klasyfikatora + walidacja.
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /seasons/:seasonId/classifiers`).
- Backend / API
  - [ ] Model/encja `Classifier`.
  - [ ] Endpointy CRUD dla klasyfikatorów w sezonie.
- Testy
  - [ ] Scenariusze CRUD klasyfikatora + walidacja.

</details>

## ETAP 3.1

**Cel:** Dodanie zarządzania turniejami do aplikacji.

### 🏆 Tournament Management

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US1: Turniej (CRUD)</h3></summary>

**User Story**

- Jako organizator chcę móc tworzyć, edytować i usuwać turniej, aby zarządzać danymi konkretnego weekendu rozgrywek.

**Kryteria akceptacji**

- Mogę utworzyć nowy turniej i widzę go na liście.
- Mogę wejść w szczegóły turnieju i edytować dane.
- Po usunięciu turnieju nie jest on widoczny w systemie.

**Zadania techniczne**

- Frontend
  - [ ] Widok listy turniejów + akcje: dodaj/edytuj/usuń.
  - [ ] Widok szczegółów turnieju (nawigacja po zakładkach/sekcjach).
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /tournaments`).
  - [ ] Obsługa stanów: loading / empty / error / success.
- Backend / API
  - [ ] Model/encja `Tournament` + podstawowe pola (np. nazwa, daty, miejsce — do ustalenia).
  - [ ] Endpointy CRUD dla turniejów.
- Testy
  - [ ] Scenariusze CRUD turnieju + walidacja + błędy API.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US2: Hala sportowa (CRUD)</h3></summary>

**User Story**

- Jako organizator chcę dodać halę sportową do turnieju, aby mieć w jednym miejscu adres i dane obiektu.

**Kryteria akceptacji**

- Mogę dodać/edytować/usunąć halę przypisaną do turnieju.
- Widzę adres hali na dashboardzie (sekcja logistyka).

**Zadania techniczne**

- Frontend
  - [ ] Formularz hali (np. nazwa, adres, notatki — do doprecyzowania).
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /tournaments/:id/venue`).
- Backend / API
  - [ ] Model/encja `Venue` (lub pola w `Tournament`) + walidacja.
  - [ ] Endpointy do hali dla turnieju.
- Testy
  - [ ] Scenariusze: dodanie, edycja, usunięcie hali.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US3: Zakwaterowanie (CRUD)</h3></summary>

**User Story**

- Jako organizator chcę dodać zakwaterowanie do turnieju, aby mieć komplet informacji logistycznych.

**Kryteria akceptacji**

- Mogę dodać/edytować/usunąć zakwaterowanie przypisane do turnieju.
- Informacje są widoczne na dashboardzie w sekcji logistyka.

**Zadania techniczne**

- Frontend
  - [ ] Formularz zakwaterowania (np. nazwa, adres, notatki — do doprecyzowania).
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /tournaments/:id/accommodation`).
- Backend / API
  - [ ] Model/encja `Accommodation` (lub pola w `Tournament`) + walidacja.
  - [ ] Endpointy do zakwaterowania dla turnieju.
- Testy
  - [ ] Scenariusze: dodanie, edycja, usunięcie zakwaterowania.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US4: Wyżywienie (CRUD)</h3></summary>

**User Story**

- Jako organizator chcę dodać informacje o wyżywieniu (hala, hotel), aby wiedzieć gdzie i kiedy jest jedzenie dla uczestników.

**Kryteria akceptacji**

- Mogę dodać/edytować/usunąć wyżywienie dla hali i/lub hotelu.
- Na dashboardzie widzę wyżywienie w sekcji logistyka.

**Zadania techniczne**

- Frontend
  - [ ] Formularz wyżywienia z rozróżnieniem: hala / hotel.
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /tournaments/:id/meals`).
- Backend / API
  - [ ] Model/encja `MealPlan` + typ (hala/hotel) + walidacja.
  - [ ] Endpointy do wyżywienia dla turnieju.
- Testy
  - [ ] Scenariusze: dodanie wyżywienia hali, dodanie wyżywienia hotelu, edycja, usunięcie.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US5: Drużyny biorące udział w turnieju</h3></summary>

**User Story**

- Jako organizator chcę przypisać drużyny do turnieju, aby móc ułożyć plan meczów i mieć listę uczestników.

**Kryteria akceptacji**

- Mogę dodać do turnieju drużyny z listy drużyn sezonu.
- Widzę listę przypisanych drużyn przy turnieju.
- Mogę usunąć drużynę z turnieju.

**Zadania techniczne**

- Frontend
  - [ ] Widok „Drużyny turnieju” (lista + dodaj/usuń).
  - [ ] Select/autocomplete do wyboru drużyn z sezonu.
  - [ ] Integracja z API (np. `GET /seasons/:seasonId/teams` + `POST/DELETE /tournaments/:id/teams`).
- Backend / API
  - [ ] Relacja `Tournament <-> Team` (np. tabela łącząca).
  - [ ] Endpointy do przypisywania/odpinania drużyn.
- Testy
  - [ ] Scenariusze: przypisanie, odpięcie, brak duplikatów.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US6: Plan rozgrywek meczów</h3></summary>

**User Story**

- Jako organizator chcę ułożyć plan meczów (kto z kim, o której, które boisko, koszulki, wynik), aby turniej miał kompletny harmonogram.

**Kryteria akceptacji**

- Mogę dodać mecz z polami: drużyna A, drużyna B, czas, boisko, koszulki.
- Widzę mecze w kolejności czasowej.
- Mogę zaktualizować wynik meczu.

**Zadania techniczne**

- Frontend
  - [ ] Widok listy meczów turnieju + akcje: dodaj/edytuj/usuń.
  - [ ] Formularz meczu (walidacja: A ≠ B, czas wymagany, boisko wymagane).
  - [ ] Edycja wyniku meczu.
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /tournaments/:id/matches`).
- Backend / API
  - [ ] Model/encja `Match` + walidacja spójności (np. drużyny różne).
  - [ ] Endpointy CRUD dla meczów + endpoint do aktualizacji wyniku.
- Testy
  - [ ] Scenariusze: dodanie meczu, walidacja A=B, aktualizacja wyniku, sortowanie.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US7: Sędziowie (boiskowi i stolikowi) w turnieju</h3></summary>

**User Story**

- Jako organizator chcę dodać sędziów do turnieju, aby móc ich później przypisać do planu sędziowania.

**Kryteria akceptacji**

- Mogę dodać sędziów z listy sezonu do turnieju.
- Widzę listę sędziów przypisanych do turnieju.

**Zadania techniczne**

- Frontend
  - [ ] Widok „Sędziowie turnieju” (lista + dodaj/usuń).
  - [ ] Integracja z API (np. `GET /seasons/:seasonId/referees` + `POST/DELETE /tournaments/:id/referees`).
- Backend / API
  - [ ] Relacja `Tournament <-> Referee`.
  - [ ] Endpointy do przypisywania/odpinania sędziów.
- Testy
  - [ ] Scenariusze: przypisanie, odpięcie, brak duplikatów.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US8: Klasyfikatorzy w turnieju</h3></summary>

**User Story**

- Jako organizator chcę dodać klasyfikatorów do turnieju, aby mieć przypisane osoby do zadań klasyfikacyjnych.

**Kryteria akceptacji**

- Mogę dodać klasyfikatorów z listy sezonu do turnieju.
- Widzę listę klasyfikatorów przypisanych do turnieju.

**Zadania techniczne**

- Frontend
  - [ ] Widok „Klasyfikatorzy turnieju” (lista + dodaj/usuń).
  - [ ] Integracja z API (np. `GET /seasons/:seasonId/classifiers` + `POST/DELETE /tournaments/:id/classifiers`).
- Backend / API
  - [ ] Relacja `Tournament <-> Classifier`.
  - [ ] Endpointy do przypisywania/odpinania klasyfikatorów.
- Testy
  - [ ] Scenariusze: przypisanie, odpięcie, brak duplikatów.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US9: Wolontariusze w turnieju</h3></summary>

**User Story**

- Jako organizator chcę dodać wolontariuszy do turnieju, aby mieć listę osób pomagających podczas wydarzenia.

**Kryteria akceptacji**

- Mogę dodać/edytować/usunąć wolontariusza przypisanego do turnieju.
- Widzę listę wolontariuszy na dashboardzie.

**Zadania techniczne**

- Frontend
  - [ ] Widok „Wolontariusze” (lista + dodaj/edytuj/usuń).
  - [ ] Formularz wolontariusza (imię, nazwisko, telefon) + walidacja.
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /tournaments/:id/volunteers`).
- Backend / API
  - [ ] Model/encja `Volunteer` + walidacja.
  - [ ] Endpointy CRUD wolontariuszy dla turnieju.
- Testy
  - [ ] Scenariusze CRUD wolontariusza + walidacja.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US10: Plan sędziowania dla sędziów</h3></summary>

**User Story**

- Jako organizator chcę ułożyć plan sędziowania (kto z kim, o której, które boisko, 2 sędziów boiskowych, 1 stolikowy), aby sędziowie wiedzieli, które mecze prowadzą.

**Kryteria akceptacji**

- Mogę dodać pozycję planu sędziowania przypisaną do meczu.
- Dla każdego meczu mogę wybrać: 2 sędziów boiskowych i 1 stolikowego.
- Walidacja: nie da się wybrać tej samej osoby dwa razy w tej samej pozycji.

**Zadania techniczne**

- Frontend
  - [ ] Widok „Plan sędziowania” (lista pozycji + dodaj/edytuj/usuń).
  - [ ] Formularz: wybór meczu + wybór sędziów (2 boiskowi + 1 stolikowy).
  - [ ] Integracja z API (np. `GET/POST/PATCH/DELETE /tournaments/:id/referee-assignments`).
- Backend / API
  - [ ] Model/encja `RefereeAssignment` powiązana z `Match`.
  - [ ] Walidacja serwerowa (brak duplikatów, wymagane obsady).
  - [ ] Endpointy CRUD dla planu sędziowania.
- Testy
  - [ ] Scenariusze: przypisanie sędziów, walidacja duplikatów, lista planu.

</details>

## ETAP 4.1

**Cel:** Dodanie dashboardu do aplikacji.

### 📊 Dashboard

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US1: Podgląd całego wydarzenia (Dashboard)</h3></summary>

**User Story**

- Jako organizator chcę widzieć podsumowanie całego wydarzenia w jednym miejscu, aby szybko sprawdzić najważniejsze informacje o turnieju.

**Kryteria akceptacji**

- Widzę ekran dashboardu dla wybranego turnieju.
- Dashboard pokazuje sekcje: plan meczów, logistyka (hala/hotel), listy osób.
- Gdy brakuje danych, widzę „pusto”/placeholder zamiast błędu.

**Zadania techniczne**

- Frontend
  - [ ] Widok i routing dashboardu (np. `/tournaments/:tournamentId/dashboard`).
  - [ ] Układ sekcji + komponenty „kafelki”/sekcje.
  - [ ] Obsługa stanów: loading / empty / error.
  - [ ] Integracja z API (pobranie danych turnieju w 1-2 requestach).
- Backend / API
  - [ ] Endpoint do pobrania danych dashboardu (np. `GET /tournaments/:id/dashboard`).
  - [ ] Optymalizacja: agregacja danych, żeby nie robić wielu ciężkich zapytań.
- Testy
  - [ ] Scenariusze: brak danych, częściowe dane, błąd API.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US2: Podgląd planu rozgrywek meczów</h3></summary>

**User Story**

- Jako organizator chcę widzieć plan meczów (kto z kim, o której, które boisko), aby móc kontrolować przebieg turnieju.

**Kryteria akceptacji**

- Widzę listę/harmonogram meczów dla turnieju.
- Mogę łatwo przesuwać się po dniu/godzinach (czytelny układ).
- Dane są spójne z tym, co zostało ustawione w „Tournament Management”.

**Zadania techniczne**

- Frontend
  - [ ] Sekcja „Plan meczów” na dashboardzie.
  - [ ] Komponent listy/harmonogramu (sortowanie po czasie).
  - [ ] Integracja z API (np. `GET /tournaments/:id/matches`).
- Backend / API
  - [ ] Endpoint do listy meczów + sortowanie po czasie.
- Testy
  - [ ] Scenariusze: brak meczów, wiele meczów, poprawna kolejność.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US3: Podgląd logistyki (hala, hotel, wyżywienie)</h3></summary>

**User Story**

- Jako organizator chcę szybko sprawdzić informacje logistyczne (hala, hotel, wyżywienie), aby móc je przekazać zainteresowanym i uniknąć pomyłek.

**Kryteria akceptacji**

- Widzę adres hali sportowej.
- Widzę informacje o zakwaterowaniu.
- Widzę informacje o wyżywieniu (hala, hotel), jeśli zostały dodane.

**Zadania techniczne**

- Frontend
  - [ ] Sekcja „Logistyka” na dashboardzie.
  - [ ] Komponent adresu hali (kopiowanie adresu / link do mapy — opcjonalnie).
  - [ ] Komponent zakwaterowania + wyżywienia (czytelny opis).
  - [ ] Integracja z API (np. `GET /tournaments/:id/venue`, `.../accommodation`, `.../meals` lub 1 endpoint zbiorczy).
- Backend / API
  - [ ] Endpointy do pobierania danych: hala, zakwaterowanie, wyżywienie.
- Testy
  - [ ] Scenariusze: brak zakwaterowania/wyżywienia, tylko część danych, komplet danych.

</details>

<details style="margin-left: 1.5em">
<summary><h3 style="display:inline; margin:0">US4: Podgląd list osób (drużyny, sędziowie, klasyfikatorzy, wolontariusze)</h3></summary>

**User Story**

- Jako organizator chcę widzieć listy osób biorących udział w turnieju, aby szybko sprawdzić, kto jest przypisany i czy niczego nie brakuje.

**Kryteria akceptacji**

- Widzę listę drużyn biorących udział w turnieju.
- Widzę listę sędziów (boiskowych i stolikowych) przypisanych do turnieju.
- Widzę listę klasyfikatorów i wolontariuszy przypisanych do turnieju.
- Każda lista działa nawet, gdy jest pusta (komunikat „Brak danych”).

**Zadania techniczne**

- Frontend
  - [ ] Sekcja „Listy osób” na dashboardzie (podsekcje: drużyny, sędziowie, klasyfikatorzy, wolontariusze).
  - [ ] Proste listy (np. tabela lub lista) + czytelne nagłówki.
  - [ ] Integracja z API (np. `GET /tournaments/:id/teams`, `.../referees`, `.../classifiers`, `.../volunteers` lub 1 endpoint zbiorczy).
- Backend / API
  - [ ] Endpointy do pobrania list przypisanych do turnieju.
  - [ ] Spójne sortowanie (np. alfabetycznie po nazwisku/nazwie).
- Testy
  - [ ] Scenariusze: puste listy, duże listy, sortowanie.

</details>

### 🧪 Testing & QA

...

### 🚀 Deployment

...
