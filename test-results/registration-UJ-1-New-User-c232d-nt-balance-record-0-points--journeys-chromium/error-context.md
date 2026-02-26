# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "ChoreChamp" [ref=e5] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e7]
          - generic [ref=e10]: ChoreChamp
        - link "?" [ref=e16] [cursor=pointer]:
          - /url: /profile
          - button "?" [ref=e17]:
            - generic [ref=e18]: "?"
    - main [ref=e19]:
      - generic [ref=e20]:
        - heading "Willkommen zuruck, Champ!" [level=1] [ref=e21]
        - paragraph [ref=e22]: Hier ist deine Ubersicht fur heute.
      - generic [ref=e23]:
        - link [ref=e25] [cursor=pointer]:
          - /url: /points/history
        - generic [ref=e31]:
          - generic [ref=e32]:
            - img [ref=e33]
            - generic [ref=e36]: Level 1
          - generic [ref=e37]: Newcomer
        - link [ref=e39] [cursor=pointer]:
          - /url: /chores
      - generic [ref=e51]: Wird geladen...
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e57] [cursor=pointer]:
    - img [ref=e58]
  - alert [ref=e61]
```