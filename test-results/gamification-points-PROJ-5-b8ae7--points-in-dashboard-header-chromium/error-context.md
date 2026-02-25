# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e7]
      - generic [ref=e10]: Willkommen zurück!
      - generic [ref=e11]: Melde dich an, um deinen Haushalt zu verwalten
    - generic [ref=e13]:
      - generic [ref=e14]:
        - text: E-Mail
        - generic [ref=e15]:
          - img [ref=e16]
          - textbox "deine@email.de" [ref=e19]
      - generic [ref=e20]:
        - text: Passwort
        - generic [ref=e21]:
          - img [ref=e22]
          - textbox "••••••••" [ref=e25]
          - button [ref=e26] [cursor=pointer]:
            - img [ref=e27]
      - link "Passwort vergessen?" [ref=e31] [cursor=pointer]:
        - /url: /auth/forgot-password
      - button "Anmelden" [ref=e32] [cursor=pointer]
    - paragraph [ref=e34]:
      - text: Noch kein Konto?
      - link "Jetzt registrieren" [ref=e35] [cursor=pointer]:
        - /url: /auth/register
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e41] [cursor=pointer]:
    - img [ref=e42]
  - alert [ref=e45]
```