# F-Droid Submission

Diese Datei beschreibt den aktuell empfohlenen Weg, um `org.fedisuite.mobile` in das offizielle F-Droid-Repository einzureichen.

## Dateien in diesem Repo

- Repo-lokale F-Droid-Build-Metadaten: [`.fdroid.yml`](../.fdroid.yml)
- Vorlage fuer `fdroiddata`: [`fdroiddata/org.fedisuite.mobile.yml`](../fdroiddata/org.fedisuite.mobile.yml)
- Asset- und Branding-Rechte: [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)
- Store-Metadaten und Screenshots: `fastlane/metadata/android/`

## Aktueller Stand

- Paketname: `org.fedisuite.mobile`
- Aktuelle Version: `0.9.13`
- Aktueller Android- und F-Droid-`versionCode`: `913`
- Tag fuer den letzten Release-Commit: `v0.9.13`
- Update-Strategie fuer F-Droid aktuell bewusst konservativ: `UpdateCheckMode: Static`
- Build-Metadaten installieren auf dem F-Droid-Buildserver explizit `npm` und fuehren vor Gradle ein `npm ci` im Repo-Root aus

`Static` ist hier absichtlich gesetzt, weil die App ihre Version aus der Datei `version` ableitet und wir fuer den ersten F-Droid-Merge-Request moeglichst wenig Automatisierungsrisiko wollen.

## Empfohlener Ablauf

1. `fdroiddata` auf GitLab forken.
2. Einen Branch wie `org.fedisuite.mobile` anlegen.
3. Die Datei `metadata/org.fedisuite.mobile.yml` aus `fdroiddata/org.fedisuite.mobile.yml` uebernehmen.
4. Im F-Droid-Build-Container lokal pruefen:

```bash
fdroid readmeta
fdroid rewritemeta org.fedisuite.mobile
fdroid lint org.fedisuite.mobile
fdroid build org.fedisuite.mobile
```

Bei React-Native-/Expo-Projekten ist wichtig:

- ausserhalb eines echten F-Droid-Builder-VM-Laufs werden `sudo:`-Schritte von `fdroid build` absichtlich uebersprungen
- fuer diese App betrifft das insbesondere die Installation von `npm`
- ein lokaler Docker-Test ohne dedizierte Builder-VM kann deshalb frueher abbrechen als der spaetere echte F-Droid-Serverlauf

5. Wenn der Build sauber ist, den Merge Request gegen `fdroiddata` erstellen.

## Hinweise fuer den Merge Request

- Die App ist nicht an einen einzelnen Hosted-Dienst gebunden. Sie startet mit expliziter Instanzwahl und unterstuetzt auch selbst gehostete FediSuite-Instanzen.
- Dadurch ist sie kein Fall fuer das Anti-Feature `Tethered Network Services`.
- Branding, Logo, Screenshots, Store-Grafiken und App-Name sind fuer diese App und ihre F-Droid-Metadaten frei freigegeben; siehe `ASSET_LICENSES.md`.
- Fastlane-Metadaten liegen bereits in `en-US`, `de-DE` und `it-IT` vor.
