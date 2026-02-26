# E2E Journey Test Report - ChoreChamp

**Datum:** 2026-02-26
**Environment:** Local Dev Server (localhost:3000)
**Dauer:** 3.4 Minuten

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| Gesamt Tests | 74 |
| Bestanden | 5 |
| Fehlgeschlagen | 6 |
| Nicht ausgeführt | 63 |

## Bestandene Tests ✅

| Test | Journey |
|------|---------|
| should register new user successfully | UJ-1 |
| should show validation for duplicate email | UJ-1 |
| should show validation for weak password | UJ-1 |
| should create household successfully | UJ-2 |
| should display rewards page | UJ-5 |

## Fehlgeschlagene Tests ❌

| Test | Journey | Fehler |
|------|---------|--------|
| should set user as admin automatically | UJ-2 | Household context lädt nicht |
| should create chore with all fields | UJ-3 | Auth state nicht synchronisiert |
| should accumulate points correctly | UJ-4 | Auth state nicht synchronisiert |
| should create point balance record | UJ-1 | Punkte werden nicht angezeigt |
| Parent creates household | UJ-6 | Household context lädt nicht |
| should display rewards page | UJ-5 | Household context lädt nicht |

## Hauptprobleme

### 1. Auth State Synchronisation
Nach der Registrierung wird der Auth-State nicht sofort aktualisiert. Das Dashboard zeigt "Champ" statt des User-Namens.

**Lösung:** Auth-Provider muss nach signUp sofort den State aktualisieren.

### 2. Household Context Loading
Der Household-Provider zeigt "Wird geladen..." endlos, wenn die Session noch nicht vollständig etabliert ist.

**Lösung:** Bessere Error-Handling und Loading-States im Household-Provider.

### 3. Test-Selektoren
`getByLabel` funktioniert nicht zuverlässig mit shadcn/ui FormLabel-Komponenten.

**Lösung:** `getByPlaceholder` verwenden.

## Test-User

| User | Email | Password |
|------|-------|----------|
| Parent | parent@test.com | Test1234! |
| Child | child@test.com | Test1234! |
| Partner | partner@test.com | Test1234! |
| Solo | solo@test.com | Test1234! |

## Dateien

- **HTML Report:** `playwright-report/index.html`
- **Screenshots:** `test-results/*/test-failed-1.png`
- **Videos:** `test-results/*/video.webm`

## Nächste Schritte

1. Auth-Provider nach Registrierung sofort State aktualisieren
2. Household-Provider Loading-State verbessern
3. Tests mit besseren Wait-Strategien ausstatten
4. Einzelne Tests debuggen und fixen