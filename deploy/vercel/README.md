# FollowVille su Vercel

Questa è la versione autonoma del gioco: Next.js 16, database remoto libSQL/Turso e account email/password con Better Auth. Non richiede l’accesso a ChatGPT e non usa il database di ChatGPT Sites.

## Pubblicazione

1. Crea un database **libSQL** in Turso (non un database locale o una replica salvata nel filesystem di Vercel). Conserva il suo URL e genera un token con permessi di lettura e scrittura. Puoi usare l’integrazione Turso disponibile per Vercel.
2. In Vercel scegli **Add New → Project** e importa `lukecrd/followville`.
3. Imposta **Root Directory** su `deploy/vercel` e abilita **Include source files outside of the Root Directory in the Build Step**: la build importa la grafica, la logica e le migrazioni condivise dalla radice del repository.
4. Seleziona il preset **Next.js**, Node.js **22.x**, Install Command `npm ci`, Build Command `npm run build`, Output Directory `.next` (già dichiarati nel progetto).
5. Aggiungi le variabili della tabella seguente a **Production** e pubblica. Al primo accesso vengono applicate le migrazioni e creato l’amministratore. Non servono comandi SQL manuali.
6. Entra con l’email e la password amministratore configurate. Il menu **Account** permette di cambiare password e uscire. Aggiungi cittadini e assegna le case; dal menu Cittadini genera gli inviti personali. I giocatori si registrano, accedono e collegano il proprio abitante con l’invito.

| Variabile | Valore |
| --- | --- |
| `TURSO_DATABASE_URL` | URL del database libSQL, per esempio `libsql://nome-organizzazione.turso.io`. |
| `TURSO_AUTH_TOKEN` | Token del database con permessi di scrittura. |
| `BETTER_AUTH_SECRET` | Segreto casuale di almeno 32 caratteri, generato una volta e conservato. |
| `FOLLOWVILLE_ADMIN_EMAIL` | Email dell’amministratore iniziale. |
| `FOLLOWVILLE_ADMIN_PASSWORD` | Password iniziale dell’amministratore, almeno 16 caratteri. |
| `BETTER_AUTH_URL` | Facoltativa: URL definitivo di produzione, senza percorso, per esempio `https://followville.vercel.app`. Lasciala assente per Preview. |

Per generare un segreto sul tuo computer: `openssl rand -base64 32`. Incollalo direttamente nelle variabili protette di Vercel, mai nel repository. Un modello senza valori segreti è disponibile in [.env.example](.env.example).

Le cinque variabili obbligatorie mancanti vengono elencate nella pagina di configurazione. Dopo averle aggiunte, esegui un nuovo deploy. Se sono presenti ma non valide, controlla URL, token e lunghezza dei segreti.

## Dati e ambienti

La versione autonoma parte da una città nuova. **I cittadini, i progressi e gli account della città su ChatGPT Sites non vengono trasferiti automaticamente.** Il codice e le funzioni sono condivisi, i dati e le identità sono separati.

Per le Preview usa un altro database e altri segreti: collegare una Preview al database di produzione consentirebbe alle prove di modificare la città reale. Non usare il filesystem temporaneo di Vercel come database.

Le migrazioni vengono registrate con un hash e applicate una sola volta in transazione. Le migrazioni già applicate non devono essere riscritte. Le operazioni del gioco mantengono le transazioni, i controlli del saldo e l’unicità dei voti.

`FOLLOWVILLE_ADMIN_PASSWORD` crea l’account solo la prima volta: cambiarla nelle variabili **non** modifica una password già salvata. Per cambiarla usa **Account → Cambia password**. Non è configurato un servizio email per recupero password o verifica dell’email; i diritti sugli abitanti dipendono dagli inviti monouso dell’amministratore.

## Sviluppo

Dalla radice del repository:

```bash
npm ci --prefix deploy/vercel
```

Configura `deploy/vercel/.env.local` con i valori del tuo ambiente di sviluppo (usa un database separato), poi:

```bash
npm run dev --prefix deploy/vercel
```

Per verificare la build:

```bash
npm run build --prefix deploy/vercel
```

Il comando di build prepara `.generated/` e `public/` copiando i sorgenti condivisi e raccogliendo le migrazioni; queste copie non vanno modificate o aggiunte a Git. Nessun dato di produzione viene letto o migrato durante la build: l’inizializzazione avviene al primo accesso con la configurazione runtime.

Il test `node scripts/test-vercel.mjs`, eseguito dopo `npm run prepare:source --prefix deploy/vercel`, usa un database SQLite temporaneo per verificare login, ruoli, inviti, acquisti concorrenti, transazioni e logout. Le altre verifiche del gioco rimangono nella cartella `scripts/`.

## Riferimenti ufficiali

- [Vercel: monorepo e Root Directory](https://vercel.com/docs/monorepos/monorepo-faq)
- [Turso: client TypeScript e transazioni](https://docs.turso.tech/sdk/ts/reference)
- [Better Auth: Next.js](https://better-auth.com/docs/integrations/next)
- [Better Auth: rate limiting persistente](https://better-auth.com/docs/concepts/rate-limit)
