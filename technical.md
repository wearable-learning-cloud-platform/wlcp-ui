# Technical notes: WearableLearning photo check

How to run WearableLearning (WL) from source on a Mac, and exactly what the photo check code does in each repo. Written 23 Oct 2026 and updated 4 Nov 2026 for the independent study with Prof. Ivon Arroyo. A copy of this file lives on branch `feature/photo-check` in `wlcp-ui`. `scripts/`, `logs/` and `trace/`, and the day-by-day log in the project `README.md`, are in the author's project folder, one level above `repos/`, and are not in any WL repo.

Contents

1. Why from source and not Docker
2. What runs
3. Install and build
4. Run, stop, rebuild, check
5. Problems hit on macOS
6. What the photo check code does, repo by repo
7. Wire format and generated code
8. Testing without a phone
9. Branch and commits

## 1. Why from source and not Docker

The lab's `wlcp-docker` repo was not usable here. Its compose file pulls prebuilt images from the lab's private AWS registry and the README expects AWS credentials from a Drive link. Its last commit is March 2022, before the summer 2025 move to JDK 17 and Spring Boot 3.5.4, so the images may not match the current `dev` branch. Docker was also not installed on this Mac.

Building from source runs exactly the code being edited, which is what the lab's own README recommends for development anyway. The wiring is identical: the Docker profile uses container names such as `wlcp-db-dev`, and the default Spring profile already says `localhost` everywhere. No configuration in any Java repo was changed. The result is the same URL, http://localhost:8050, the same login, editor and player.

## 2. What runs

Eight processes. The browser talks only to the gateway on port 8050. Everything else finds each other through Eureka.

| Process | Repo | Port | Role |
| --- | --- | --- | --- |
| MySQL | Homebrew | 3306 | Databases `wlcp-api`, `wlcp-api-archive`, `wlcp-metrics`. User `wlcp` / `wlcp` |
| wlcp-discovery | wlcp-discovery | 8761 | Eureka registry. Every service registers here |
| wlcp-gateway | wlcp-gateway | 8050 | Routes `/wlcp-ui`, `/wlcp-api`, `/wlcp-transpiler`, `/wlcp-gameserver` by Eureka lookup |
| wlcp-api | wlcp-api | 8082 | Games, states, transitions, users. JPA and Liquibase |
| wlcp-transpiler | wlcp-transpiler | 8083 | Turns a stored game into a JavaScript state machine |
| wlcp-metrics | wlcp-metrics | 8084 | Play logging. Optional; the game server tolerates it being down |
| wlcp-gameserver | wlcp-gameserver | 3333 | STOMP WebSockets; runs each player's state machine in Nashorn |
| wlcp-ui | wlcp-ui | 3000 | OpenUI5 app served by the UI5 CLI: Game Editor and the phone player |

All Java services are Spring Boot 3.5.4 targeting Java 17. The UI is OpenUI5 1.111 on UI5 CLI 2.14. The UI reaches the API and game server through `window.location.origin`, so it only works when opened via port 8050, never via port 3000 directly.

Versions used: OpenJDK 17.0.20, Maven 3.10.0, MySQL (Homebrew formula `mysql`), Node 23.5, npm 10.9, Nashorn 15.6 standalone.

## 3. Install and build

Tested on macOS 26 on Apple Silicon with Homebrew. About twenty minutes the first time, most of it Maven downloads.

Clone the repos.

```bash
mkdir -p repos && cd repos
for r in wlcp-discovery wlcp-gateway wlcp-api wlcp-transpiler wlcp-metrics wlcp-gameserver wlcp-ui; do
  git clone https://github.com/wearable-learning-cloud-platform/$r.git
done
```

Install the tools. The repos' own `mvnw` wrapper pins Maven 3.6.2, which is too old for the compiler plugin Spring Boot 3.5.4 uses, so a current Maven is needed. Homebrew's Maven pulls in a very new JDK, so install JDK 17 as well and point `JAVA_HOME` at it.

```bash
brew install mysql maven openjdk@17
brew services start mysql
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

Create the databases and user. Root has no password after a fresh Homebrew install. Liquibase creates all tables when the API and metrics services first start.

```bash
mysql -u root -e "
CREATE DATABASE IF NOT EXISTS \`wlcp-api\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS \`wlcp-api-archive\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS \`wlcp-metrics\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'wlcp'@'%' IDENTIFIED BY 'wlcp';
CREATE USER IF NOT EXISTS 'wlcp'@'localhost' IDENTIFIED BY 'wlcp';
GRANT ALL PRIVILEGES ON \`wlcp-api\`.* TO 'wlcp'@'%', 'wlcp'@'localhost';
GRANT ALL PRIVILEGES ON \`wlcp-api-archive\`.* TO 'wlcp'@'%', 'wlcp'@'localhost';
GRANT ALL PRIVILEGES ON \`wlcp-metrics\`.* TO 'wlcp'@'%', 'wlcp'@'localhost';
FLUSH PRIVILEGES;"
```

Build the six Java services. Each produces `target/<name>-0.0.1-SNAPSHOT.jar`.

```bash
for r in wlcp-discovery wlcp-gateway wlcp-api wlcp-transpiler wlcp-metrics wlcp-gameserver; do
  (cd repos/$r && mvn -q -B package -DskipTests)
done
```

Install the UI's dependencies. One devDependency, `mbt`, has no Apple Silicon binary and aborts a plain install. It is only used for packaging, so skip install scripts.

```bash
cd repos/wlcp-ui && npm install --ignore-scripts
```

Make a local UI5 config. The repo's `ui5.yaml` registers the UI in Eureka under the name `docker-host`, which only exists inside the Docker network. One line differs. Keep the copy out of git.

```bash
cd repos/wlcp-ui
sed 's/hostName: "docker-host"/hostName: "localhost"/' ui5.yaml > ui5-local.yaml
echo ui5-local.yaml >> .git/info/exclude
```

## 4. Run, stop, rebuild, check

Two scripts in the project folder do the work. `scripts/start-wl.sh` checks MySQL, starts discovery first, then the four services and the gateway, then the UI, and waits for each port. `scripts/stop-wl.sh` stops everything except MySQL. Logs and PIDs land in `logs/`.

```bash
scripts/start-wl.sh
```

Then open http://localhost:8050. Allow up to 30 seconds after start for the gateway's Eureka cache to see the UI. The database starts empty; the login page has a sign-up form.

The UI serves source files directly, so UI changes need only a browser reload. A Java change needs a rebuild and a restart of that one service; the start script skips services whose PID is still alive.

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
(cd repos/wlcp-gameserver && mvn -q package -DskipTests)
kill $(cat logs/wlcp-gameserver.pid) && scripts/start-wl.sh
```

The UI must be started with two flags, which the script does: `--config ui5-local.yaml` for the Eureka name, and `--accept-remote-connections`, because Node 23 resolves `localhost` to IPv6 and the Java gateway connects over IPv4.

Health checks and what to expect:

| Check | Command | Expect |
| --- | --- | --- |
| Eureka | `curl -s -H 'Accept: application/json' localhost:8761/eureka/apps` | six apps, all `UP` |
| Gateway to UI | `curl -s -o /dev/null -w '%{http_code}' localhost:8050/wlcp-ui/` | 200 |
| Gateway to API | `curl -s -o /dev/null -w '%{http_code}' localhost:8050/wlcp-api/usernameController/getUsername/x` | 401, meaning the API answered |
| Tables | `mysql -u wlcp -pwlcp -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='wlcp-api'"` | 34 after the photo check migration |
| Errors | `grep -l ERROR logs/*.log` | nothing |

To play from a phone: phone and Mac on the same Wi-Fi, open `http://<Mac IP>:8050` (`ipconfig getifaddr en0` prints the IP). The Mac's firewall must allow incoming connections on 8050.

## 5. Problems hit on macOS

| Symptom | Cause | Fix |
| --- | --- | --- |
| Every call through port 8050 returns 500 after days of uptime, but the services answer on their own ports | The Mac's Wi-Fi address changed and Eureka still holds the old one | `stop-wl.sh` then `start-wl.sh` |
| Gateway returns 500 for `/wlcp-ui/`, log says `NXDOMAIN docker-host` | The UI registered in Eureka as `docker-host` | Use `ui5-local.yaml`; delete a stale entry with `curl -X DELETE localhost:8761/eureka/apps/WLCP-UI/docker-host:wlcp-ui:3000` |
| Gateway returns 500 for `/wlcp-ui/`, log says `connection refused 127.0.0.1:3000` | Node 23 bound the UI server to IPv6 only | Start the UI with `--accept-remote-connections` |
| `./mvnw` fails: compiler plugin requires Maven 3.6.3 | The wrapper pins Maven 3.6.2 | Use Homebrew's `mvn` |
| `npm install` aborts on `mbt`: no binaries for darwin-arm64 | A packaging tool with no Apple Silicon build | `npm install --ignore-scripts` |
| The phone shows HTTP 500 popups on every screen | Pre-existing bug: guest players logged metrics with id 0 | Fixed on the feature branch |
| The game freezes after the camera closes on an iPhone | Pre-existing bug: a Nashorn class cast on reconnect killed the player thread | Fixed on the feature branch |
| A game edited through the API reverts | Run and Debug saves the editor's in-memory copy first | Reload the editor after any API edit |
| "Game Instance N is full" on a game nobody has joined | On 3 Nov a leftover client on the Mac, retrying about every 2 minutes as `wltest`, took the only slot. Which page it was was not pinned down | Close old player pages and start a new instance |
| A PIN looks free but the game does not run | An instance with no connected players stops at its next 5-minute timer tick, but it stays in the game server's in-memory list, so `playersAvaliable` still answers for it. Pre-existing | Start a new instance and join within 5 minutes |
| A debug player stays on "Reconnecting" | `GameInstanceService.userConnect` only runs the reconnect path when the instance is not a debug instance. Pre-existing | Test reconnects in a normal game with a PIN |

Two habits that avoid new problems. The Java repos use CRLF line endings; edit them with tools that preserve line endings or a one-line change turns into a 900-line diff. And `npm run lint` already fails on the untouched Virtual Device controller because the ESLint config parses as ES5, so lint is not a usable gate for that file.

## 6. What the photo check code does, repo by repo

Every piece copies the shape of the existing text-entry (keyboard input) transition, so anyone who knows that code can follow this. Read the repos in this order: API, transpiler, game server, UI.

### wlcp-api (stores the rule)

- `datamodel/master/transition/PhotoCheck.java`. An embeddable with three fields: `modelUrl` (the Teachable Machine link, up to 1024 chars), `targetClass` (the class name that counts as a match), `threshold` (a Double from 0 to 1). An empty `targetClass` means "any other photo", the no-match branch. Modeled on `TimerDuration`, not on `KeyboardInput`, so there is no entity id to rename when a game is copied.
- `datamodel/master/transition/Transition.java`. New field `Map<String, PhotoCheck> photoChecks`, keyed by scope ("Game Wide", "Team 1", "Team 1 Player 1"), stored through `@ElementCollection` in table `PHOTO_CHECK` with `@MapKeyColumn(name = "SCOPE")`. Getter and setter. Jackson maps the editor's JSON `photoChecks` straight onto it; no service code changed.
- `liquibase/changelogs/liquibase-child-changelog-11.xml`. Creates `photo_check` with columns `transition_transition_id`, `scope` (together the primary key), `model_url`, `target_class`, `threshold`, plus a foreign key to `transition`. Registered in `liquibase-parent-changelog.xml`. Runs on both the main and the archive schema.

### wlcp-transpiler (turns the rule into game code)

- `dto/GameDto.java`. A `PhotoCheck` DTO (`modelUrl`, `targetClass`, `threshold`) and `Map<String, PhotoCheck> photoChecks` on `Transition`, with a getter.
- `transpiler/transition/PhotoCheckTransitionType.java`. For one state and one scope, collects every outgoing transition that has a photo check in that scope, and emits one line with parallel arrays: target classes, thresholds, next states. The model link is taken from the first such transition. Scope conditionals come from the base class, same as every other type.
- `transpiler/steps/GenerateStateMachineFunctionsStep.java`. Registers the new type right after `KeyboardInputTransitionType`.
- `transpiler/helper/TranspilerHelpers.java`. `createEmptyTransition`, `transitionContainsScope` and `transitionConatainsNoScopes` know about the new map, so a state whose only transition is a photo check counts as having a transition.
- `transpiler/transition/TimerDurationTransitionType.java`. Its "is this scope a pure delay" check now also excludes photo checks.

### wlcp-gameserver (runs the rule)

- `dto/messages/PhotoCheckMessage.java`. One class used in both directions, because `PlayerVMService.unblock` only accepts a reply whose class equals the class of the last request sent. Server to phone: `modelUrl`, `targetClasses` and `thresholds` (the rule, so the phone can explain the result), and `retry` (true only when the request is sent again because the last photo matched nothing). Phone to server: `scores` (`Map<String, Double>`) or `error` (`MODEL_LOAD_FAILED`, `PREDICT_FAILED`).
- `dto/messages/combined/MessageType.java`. `PHOTO_CHECK` added, used in the combined message the server also publishes.
- `feignclient/dto/LogEventGamePlayerCommunicationDto.java`. `PHOTO_CHECK` in the `Input` enum for metrics logging.
- `service/impl/PlayerVMService.java`. `public int PhotoCheck(String modelUrl, String[] targetClasses, double[] thresholds, int[] transitions)`. Mirrors `KeyboardInput`: set `block = true`, build the request with the model link and the rule, remember it as `lastSentPacket`, publish to `/subscription/gameInstance/{id}/photoCheckRequest/{user}/{team}/{player}`, log to metrics, spin on `block()` (17 ms sleep per loop, also watches reconnect, shutdown and timer flags). When the reply arrives: if it carries `error` or no scores, log it and send the request again with `retry` false. An error says nothing about the photo, so it never takes a branch. Otherwise, for each non-empty target class, if the reply's score for that class (compared ignoring case) is at least the threshold, return that transition's state. If nothing matched, return the state of an empty target class if there is one. Otherwise send the request again with `retry` true. The server makes every decision. Nashorn passes the JavaScript arrays into `String[]`, `double[]` and `int[]` without any conversion code.
- `service/impl/GameInstanceService.java`. `@MessageMapping("/gameInstance/{gameInstanceId}/photoCheck/{usernameId}/{team}/{player}")` finds the player and calls `unblock(msg)`, then logs the message.
- Two fixes to pre-existing bugs, in their own commits. `PlayerVMService` and `MetricsServiceImpl` imported `netscape.javascript.JSObject`; the standalone Nashorn 15 used since the JDK 17 upgrade returns `org.openjdk.nashorn.api.scripting.ScriptObjectMirror`, which does not extend it, so every cast threw. `gotoSameState()` killed the player thread on any WebSocket reconnect (which the phone camera triggers on iOS), and `logServerEvent()` failed silently inside its try/catch. Importing `org.openjdk.nashorn.api.scripting.JSObject` fixes both. The stage 2 hook that turned `__photo__` text entries into photo checks was removed once the real transition type existed.

### wlcp-ui, phone player (takes the photo)

- `javascript/PhotoCheckHelper.js`. `loadLibraries()` injects three script tags on first use: TensorFlow.js 4.22.0, its wasm backend, and `@teachablemachine/image` 0.8.5, all from jsDelivr with pinned versions, then sets the wasm backend with cpu as fallback. `loadModel(url)` loads `model.json` and `metadata.json` from the link, runs one warm-up prediction, and caches the model per link. `scoreFile(model, file)` decodes the photo, draws it to a canvas no wider than 1024 px, predicts, and returns `{scores, previewDataUrl, ms}`, with scores rounded to 4 decimals. `toCenterSquare` makes the preview from the center square of the photo, because the Teachable Machine library crops to that before scoring. `checkScores` applies the rule the way the server does, for display only, and returns `{matched, hasOtherBranch, closest}`. `resultHtml` builds the result card and escapes class names, which come from the model's metadata. `missingClasses` finds target classes the model does not have, and `isSameCheck` compares two requests by model and rule.
- `view/VirtualDevice.view.xml`. A `photoCheck` page in the input NavContainer: status text, a `core:HTML` result card, and one button whose label changes (Take a photo, Continue, Take another photo, Try again).
- `controller/VirtualDevice.controller.js`. The flow of one check:
    - **Request.** `onPhotoCheckRequest` receives the request. A waiting result for the same check stays on screen, and is sent now if the player already pressed Continue. A request with `retry` true shows the last result again. Otherwise the player gets a fresh prompt naming the target ("The model is looking for: Class 2"), or a message for the teacher if the model has no class with that name. A model that failed to load publishes `{error: "MODEL_LOAD_FAILED"}` once and then shows Try again rather than retrying on every request, so a dead link cannot bounce messages forever.
    - **Photo.** `onPhotoCheckButtonPress` confirms a waiting result or calls `takePhotoForCheck`, which creates a file input with `capture="environment"` inside the press handler (so browsers allow it) and scores the chosen file.
    - **Result.** `onPhotoScored` keeps the result as `photoCheckPending` and shows the verdict, bars and preview. With a match or an "any other photo" branch the game will move on, so the scores wait for Continue. Otherwise they are sent at once and the button offers another photo.
    - **Send.** `sendPhotoCheckResult` publishes `{scores}` to `/app/gameInstance/{id}/photoCheck/{user}/{team}/{player}` only when the player has confirmed and the server has an open request on this connection (`photoCheckRequestOpen`, cleared by `stompClient.onWebSocketClose`). If the connection is down the player sees "Reconnecting", and the result goes out when the server asks again after the reconnect. This matters on iOS, where opening the camera can close the WebSocket.
    - **Cleanup.** `switchToTransitionType` calls `clearPhotoCheckRound` when the game moves to another transition type, and `resetPhotoCheck` also clears the model reference when the player leaves. A photo sent into a socket that is dead but not yet noticed is lost; the player gets a fresh prompt after the reconnect and retakes it.
- `css/VirtualDevice.css`. `.photoCheckText` (white text for the dark pane) and the `.photoCheckResultCard` and `.photoCheckBar*` classes for the preview, bars and threshold line.
- `javascript/MetricsHelper.js`. `PHOTO_CHECK` in `Input`, and `saveLogEventGamePlayer` skips events while the logging id is unknown (the second pre-existing bug: guests never fetched it). `onTeamPlayerSelected` in the controller now fetches it.
- `Component.js`. Requires the helper.
- `i18n/i18n.properties`, `i18n_en.properties`. Seventeen player strings under `gamePlayer.photoCheck.*`. The Spanish bundle falls back to the base bundle.

### wlcp-ui, Game Editor (lets the creator set the rule)

- `javascript/GameEditor/transition/TransitionConfig/TransitionConfigType.js`. `PHOTO_CHECK: 6` and its display name.
- `javascript/GameEditor/transition/TransitionConfig/TransitionConfigPhotoCheck.js`. Page model per scope: `modelUrl`, `targetClass`, `thresholdPercent` (50 to 100), `anyOther`, `classNames`, `loadStatus`. `loadClassesAt` fetches `metadata.json` from the pasted link in the browser (Google serves it with permissive CORS), fills the dropdown with `labels`, keeps the chosen class if the model has it, and warns when every label still matches `Class N`. It runs from the Load classes button and 600 ms after typing in the link field stops, and ignores a reply for a link that has since changed. `getSaveData` writes `photoChecks[scope] = {modelUrl, targetClass, threshold}` with threshold as 0 to 1, or an empty class and 0 when the any-other box is ticked. `setLoadData` does the reverse. `isPageActive` decides whether the scope counts as configured: a link plus either the any-other box, or a class with `classNames` filled. Editing the link empties `classNames`, so an old class cannot be saved against a new model. Pressing Accept with a dead link, or with no class, still saves the transition with no rule after the generic confirmation.
- `fragment/GameEditor/Transitions/InputTransitionPhotoCheckConfig.fragment.xml`. The panel: link input, Load classes button, status line, class dropdown, percent step input, any-other checkbox, help text.
- `javascript/GameEditor/transition/TransitionConfig/TransitionConfig.js`. The shared rule that decides which type is active in a scope now recognises photo check, so the "Photo Check" title lands in `activeTransitions`.
- `javascript/GameEditor/transition/InputTransition.js`. Adds the config to every transition, after Text Entry.
- `i18n/i18n.properties`, `i18n_en.properties`. Thirteen strings under `gameEditor.inputTransition.photoCheck.*`. The Spanish bundle has no transition strings at all, so nothing was added there.

### wlcp-metrics

- `datamodel/master/player/LogEventGamePlayerCommunication.java`. `PHOTO_CHECK` in the `Input` enum so logged photo messages deserialise.

## 7. Wire format and generated code

What the transpiler emits for a state with a match branch and an any-other branch:

```javascript
this.state = this.playerVM.PhotoCheck("https://teachablemachine.withgoogle.com/models/V9QG2NB-d/", ["", "Class 1"], [0.0, 0.8], [states.OUTPUT_STATE_3, states.OUTPUT_STATE_2]);
```

Server to phone, STOMP over a raw WebSocket at `/wlcp-gameserver/wlcpGameServer-ws/0`, destination `/subscription/gameInstance/{id}/photoCheckRequest/{user}/{team}/{player}`:

```json
{"modelUrl": "https://teachablemachine.withgoogle.com/models/V9QG2NB-d/", "targetClasses": ["Class 1"], "thresholds": [0.8], "retry": false, "scores": null, "error": null}
```

Phone to server, destination `/app/gameInstance/{id}/photoCheck/{user}/{team}/{player}`:

```json
{"scores": {"Class 1": 0.0467, "Class 2": 0.9533}}
```

or `{"error": "MODEL_LOAD_FAILED"}`. Team and player are zero-based on the wire and one-based in the UI. The complete frame logs from the real runs are in `trace/`.

Timings measured: prediction 34 to 57 ms on the laptop and 27 ms on the iPhone, phone send to next-state text 78 ms, server no-match to re-sent request 46 ms, first library and model load about 3 MB then cached. In an iPhone run on 3 Nov the camera dropped the connection, and the waiting scores reached the server about 120 ms after the reconnect.

## 8. Testing without a phone

The editor's Run and Debug opens the player in a frame inside the editor. Faster for repeated runs: start an instance through the game server's REST API and open the player page directly.

```bash
curl -s -H "Authorization: Bearer <token from POST /wlcp-api/login>" -H 'Content-Type: application/json' \
  -d '{"gameId":"phototrace","usernameId":"wltest","restart":true,"archivedGame":false}' \
  http://localhost:8050/wlcp-gameserver/gameInstanceController/startDebugGameInstance
```

That returns the instance id. Open `http://localhost:8050/wlcp-ui/#/RouteVirtualDeviceView/<user>/<id>/true`, join, and the photo page appears. For a normal game with a PIN use `startGameInstance` with `{"gameId","usernameId"}` instead; the phone then joins through Play a game.

A browser has no camera dialog an automated test can drive, so scripted runs override `HTMLInputElement.prototype.click` to hand the file input a generated image. A plain gray 640 by 480 JPEG scores Class 2 at 95.3% with the test model every time, which makes it a reliable no-match input. The result screen then waits, so a script must also press the button when it shows Continue.

To test failures from the page's console, get the controller with `sap.ui.getCore().byId("container-wlcp-ui---virtualDevice").getController()`:

- **Model load failure.** Replace `PhotoCheckHelper.loadModel` with a function that returns a rejected promise before pressing Join. The player should stay on the check with Try again, even in a game with an "any other photo" branch.
- **Dropped connection.** Call `stompClient._webSocket.close()` on the controller while the result screen is up, then press Continue. The player should see "Reconnecting", and after about 5 seconds the game should move on with no retake. Use a normal game with a PIN, because debug instances do not reconnect.

A forced close is not the same as the iOS camera, so finish with one real camera round trip on a phone. Scripted and phone tests so far cover match, no match, the "any other photo" branch, load failure, reconnect and a missing class in the browser, and match plus a real reconnect on an iPhone.

The transpiled script for any game can be read from the transpiler on port 8083, no auth needed:

```bash
curl -s "http://localhost:8083/transpilerController/transpileGame?gameId=phototrace&archivedGame=false"
```

To watch the WebSocket traffic, wrap `window.WebSocket` in the player page before pressing Join and log every `send` and `message`.

## 9. Branch and commits

Branch `feature/photo-check`, cut from `dev`, in five repos under `repos/`, with collaborator access to the `wearable-learning-cloud-platform` organisation. Twelve commits were pushed on 2 Nov as new remote branches. `dev` is untouched and no pull request is open. Four newer commits are local only as of 4 Nov: `a29851c` in `wlcp-gameserver`, and `4306d57`, `1cdd833` and the commit that adds this file in `wlcp-ui`.

| Repo | Commits | Files changed |
| --- | --- | --- |
| wlcp-ui | 9 (3 local) | 14 |
| wlcp-gameserver | 4 (1 local) | 6 |
| wlcp-api | 1 | 4 |
| wlcp-transpiler | 1 | 5 |
| wlcp-metrics | 1 | 1 |

The two bug fixes (Nashorn import, guest logging id) are separate commits so they can be reviewed and merged on their own.
