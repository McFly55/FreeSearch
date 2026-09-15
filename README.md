# FreeSearch

Firefox-WebExtension (Manifest V3), die unten links einen schwebenden, zweiteiligen Button einblendet, um den aktuellen Suchbegriff schnell mit einer anderen Suchmaschine zu suchen.

## Funktionsweise

- **Auf deiner SearXNG-Instanz** ist die linke Button-Hälfte standardmäßig mit **DuckDuckGo** belegt. Ein Klick sucht den aktuellen Begriff auf DuckDuckGo.
- **Auf allen anderen Suchmaschinen** (DuckDuckGo, Google, Bing, Brave, Startpage) ist die linke Hälfte mit **SearXNG** belegt. Ein Klick sucht den Begriff auf deiner SearXNG-Instanz.
- Die **rechte Hälfte** (Pfeil nach oben) öffnet ein Auswahlmenü mit weiteren Suchmaschinen (Google, Bing, Brave, Startpage, SearXNG – jeweils ohne die aktuell angezeigte Seite).

Der Button erscheint nur, wenn ein Suchbegriff erkannt wird (in der URL oder im sichtbaren Suchfeld).

## Installation (temporär zum Testen)

1. Firefox: `about:debugging` öffnen.
2. **Dieser Firefox → Erweiterungen vorübergehend laden** → den Ordner (bzw. `manifest.json`) auswählen.
3. Eine Suche auf deiner SearXNG-Instanz bzw. DuckDuckGo öffnen – der Button erscheint unten links.

Für eine dauerhafte Installation (ohne „vorübergehend“) muss die Erweiterung signiert werden, z. B. über [`web-ext sign`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign) mit einem Mozilla-Entwicklerkonto.

## Einstellungen

Unter `about:addons` → FreeSearch → **Einstellungen/Optionen** lässt sich die URL der SearXNG-Instanz anpassen. Voreingestellt ist `https://search.billfish-pirate.ts.net`.

## Dateien

| Datei | Zweck |
|------|-------|
| `manifest.json` | Manifest V3, Rechte, Content-Script-Registrierung |
| `content.js` | Erkennt die aktuelle Suchmaschine und den Suchbegriff, baut die Shadow-DOM-UI |
| `options.html` / `options.js` | Einstellungsseite für die SearXNG-URL |
| `icon.svg` | Erweiterungs-Icon |

## Unterstützte Suchmaschinen

DuckDuckGo, Google, Bing, Brave, Startpage sowie deine SearXNG-Instanz.

## Hinweise

- Die UI läuft in einem Shadow-DOM und ist damit weitgehend resistent gegen Styles der Seite.
- Es werden keine Daten nach außen übertragen; das Speichern der URL nutzt die Sync-Storage der Erweiterung.
