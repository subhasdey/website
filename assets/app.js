/* FitTrack — workout tracker that runs fully client-side (localStorage). */

(() => {
  "use strict";

  const STORAGE_KEY = "fittrack:v1";
  const THEME_KEY = "fittrack:theme";

  /** @type {HTMLElement} */
  const appRoot = mustGetEl("#appRoot");
  const toastWrap = ensureToastWrap();

  initTheme();
  const state = loadState();
  ensureSeedData(state);
  saveState(state);

  window.addEventListener("hashchange", () => renderRoute(state));
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      // Another tab changed state — reload + re-render.
      try {
        const fresh = loadState();
        Object.assign(state, fresh);
        renderRoute(state);
        toast("Synced", "Updated from another tab.", "ok");
      } catch {
        // ignore
      }
    }
  });

  mustGetEl("#themeToggle").addEventListener("click", () => {
    const html = document.documentElement;
    const cur = html.getAttribute("data-theme") || "dark";
    const next = cur === "light" ? "dark" : "light";
    html.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });

  renderRoute(state);

  // ---------------------------
  // Routing + Rendering
  // ---------------------------

  function renderRoute(s) {
    const { route, params } = parseHash();
    highlightNav(route);

    if (!s.profile?.name) {
      renderOnboarding(s);
      return;
    }

    switch (route) {
      case "dashboard":
        renderDashboard(s);
        break;
      case "workout":
        renderWorkout(s, params);
        break;
      case "exercises":
        renderExercises(s);
        break;
      case "progress":
        renderProgress(s);
        break;
      case "settings":
        renderSettings(s);
        break;
      default:
        setHash("/dashboard");
    }
  }

  function renderOnboarding(s) {
    appRoot.innerHTML = `
      <div class="panel__header">
        <h1 class="panel__title">Welcome to FitTrack</h1>
        <span class="pill"><span class="pill__dot"></span><span class="small muted">Private • Local • No account</span></span>
      </div>
      <div class="panel__body">
        <div class="grid grid--2">
          <div class="card">
            <div class="list-item__title">Get started</div>
            <div class="list-item__meta">Your workouts are stored in this browser only (localStorage). You can export/import any time.</div>
          </div>
          <div class="card">
            <form id="onboardForm" class="grid" autocomplete="on">
              <div class="field">
                <label for="name">Your name</label>
                <input class="input" id="name" name="name" placeholder="e.g., Alex" required maxlength="40" />
              </div>
              <div class="field">
                <label for="units">Weight units</label>
                <select class="select" id="units" name="units">
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
              <div class="row">
                <button class="btn btn--primary" type="submit">Create profile</button>
                <span class="muted small">You can change this later.</span>
              </div>
            </form>
          </div>
        </div>
        <div class="card" style="margin-top:12px">
          <div class="list-item__title">Tip</div>
          <div class="list-item__meta">Start by logging a workout, then check <b>Progress</b> to see estimated 1RM charts per exercise.</div>
        </div>
      </div>
    `;

    const form = mustGetEl("#onboardForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const units = String(fd.get("units") || "kg");
      if (!name) return;
      s.profile = {
        name,
        units: units === "lb" ? "lb" : "kg",
        createdAt: new Date().toISOString(),
      };
      saveState(s);
      toast("Welcome", "Profile created.", "ok");
      setHash("/dashboard");
    });
  }

  function renderDashboard(s) {
    const today = isoDate(new Date());
    const weekStart = startOfWeekISO(new Date());
    const workoutsSorted = [...s.workouts].sort((a, b) => b.date.localeCompare(a.date));
    const last = workoutsSorted[0] || null;

    const weekly = s.workouts.filter((w) => w.date >= weekStart);
    const weeklyCount = weekly.length;
    const weeklyVolume = sum(weekly.map(workoutVolume));
    const streak = computeStreakDays(s.workouts, today);

    appRoot.innerHTML = `
      <div class="panel__header">
        <div>
          <h1 class="panel__title">Hi ${escapeHTML(s.profile.name)} 👋</h1>
          <div class="muted small">Today: ${escapeHTML(formatDateFriendly(today))}</div>
        </div>
        <div class="row">
          <a class="btn btn--primary" href="#/workout">Log workout</a>
        </div>
      </div>
      <div class="panel__body">
        <div class="grid grid--3">
          <div class="card">
            <div class="card__kpi">${weeklyCount}</div>
            <div class="card__label">Workouts this week</div>
          </div>
          <div class="card">
            <div class="card__kpi">${formatNumber(weeklyVolume)}</div>
            <div class="card__label">Weekly volume (${escapeHTML(s.profile.units)}·reps)</div>
          </div>
          <div class="card">
            <div class="card__kpi">${streak}</div>
            <div class="card__label">Day streak</div>
          </div>
        </div>

        <div style="height:12px"></div>

        <div class="grid grid--2">
          <div class="card">
            <div class="list-item__title">Recent workouts</div>
            <div class="list-item__meta">Your last 5 sessions.</div>
            <div style="height:10px"></div>
            <div class="list">
              ${workoutsSorted.slice(0, 5).map((w) => workoutRowHTML(s, w)).join("") || `<div class="muted">No workouts yet. Log your first one.</div>`}
            </div>
          </div>

          <div class="card">
            <div class="list-item__title">Quick stats</div>
            <div class="list-item__meta">Best set per exercise (estimated 1RM).</div>
            <div style="height:10px"></div>
            ${renderTopPRsHTML(s)}
            <div style="height:10px"></div>
            <div class="row">
              <a class="btn" href="#/progress">Open progress</a>
              <a class="btn btn--ghost" href="#/settings">Export data</a>
            </div>
          </div>
        </div>

        ${
          last
            ? `
              <div style="height:12px"></div>
              <div class="card">
                <div class="row">
                  <div>
                    <div class="list-item__title">Last workout</div>
                    <div class="list-item__meta">${escapeHTML(formatDateFriendly(last.date))} • ${last.items.length} exercises • volume ${formatNumber(workoutVolume(last))}</div>
                  </div>
                  <div class="spacer"></div>
                  <a class="btn" href="#/workout?id=${encodeURIComponent(last.id)}">View</a>
                </div>
              </div>
            `
            : ""
        }
      </div>
    `;

    // Wire delete buttons in recent list.
    appRoot.querySelectorAll("[data-action='delete-workout']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        if (!confirm("Delete this workout? This cannot be undone.")) return;
        s.workouts = s.workouts.filter((w) => w.id !== id);
        saveState(s);
        toast("Deleted", "Workout removed.", "ok");
        renderDashboard(s);
      });
    });
  }

  function renderWorkout(s, params) {
    const units = s.profile.units;
    const existing = params.id ? s.workouts.find((w) => w.id === params.id) : null;
    const draft = existing ? deepClone(existing) : createEmptyWorkout();

    // Normalize date
    if (!draft.date) draft.date = isoDate(new Date());

    appRoot.innerHTML = `
      <div class="panel__header">
        <div>
          <h1 class="panel__title">${existing ? "Workout" : "New workout"}</h1>
          <div class="muted small">Log sets, then save. (${escapeHTML(units)})</div>
        </div>
        <div class="row">
          ${existing ? `<button class="btn btn--danger" id="deleteWorkout" type="button">Delete</button>` : ""}
          <button class="btn btn--primary" id="saveWorkout" type="button">Save workout</button>
        </div>
      </div>
      <div class="panel__body">
        <div class="grid grid--2">
          <div class="field">
            <label for="wDate">Date</label>
            <input class="input" id="wDate" type="date" value="${escapeAttr(draft.date)}" />
          </div>
          <div class="field">
            <label for="wTitle">Title (optional)</label>
            <input class="input" id="wTitle" placeholder="e.g., Upper body" value="${escapeAttr(draft.title || "")}" />
          </div>
        </div>

        <div style="height:12px"></div>
        <div class="field">
          <label for="wNotes">Notes</label>
          <textarea class="textarea" id="wNotes" placeholder="How did it feel? Any cues?">${escapeHTML(draft.notes || "")}</textarea>
        </div>

        <div style="height:16px"></div>

        <div class="card">
          <div class="row">
            <div>
              <div class="list-item__title">Exercises</div>
              <div class="list-item__meta">Add an exercise, then add sets.</div>
            </div>
            <div class="spacer"></div>
            <button class="btn" id="addExercise" type="button">Add exercise</button>
          </div>
        </div>

        <div style="height:12px"></div>
        <div id="exerciseBlocks" class="grid"></div>
      </div>
    `;

    const blocksEl = mustGetEl("#exerciseBlocks");
    const wDate = mustGetEl("#wDate");
    const wTitle = mustGetEl("#wTitle");
    const wNotes = mustGetEl("#wNotes");

    function rerenderBlocks() {
      blocksEl.innerHTML = draft.items.map((item) => exerciseBlockHTML(s, item, units)).join("") || `
        <div class="card">
          <div class="muted">No exercises yet. Click “Add exercise”.</div>
        </div>
      `;

      blocksEl.querySelectorAll("[data-action='remove-exercise']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-item-id");
          if (!id) return;
          draft.items = draft.items.filter((it) => it.id !== id);
          rerenderBlocks();
        });
      });

      blocksEl.querySelectorAll("[data-action='add-set']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-item-id");
          const item = draft.items.find((it) => it.id === id);
          if (!item) return;
          const lastSet = item.sets[item.sets.length - 1] || { reps: 8, weight: 0 };
          item.sets.push({ reps: lastSet.reps ?? 8, weight: lastSet.weight ?? 0, note: "" });
          rerenderBlocks();
        });
      });

      blocksEl.querySelectorAll("[data-action='remove-set']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const itemId = btn.getAttribute("data-item-id");
          const idx = Number(btn.getAttribute("data-set-idx"));
          const item = draft.items.find((it) => it.id === itemId);
          if (!item) return;
          if (!Number.isFinite(idx)) return;
          item.sets.splice(idx, 1);
          rerenderBlocks();
        });
      });

      // Inputs -> draft
      blocksEl.querySelectorAll("[data-field='reps'], [data-field='weight'], [data-field='note']").forEach((el) => {
        el.addEventListener("input", () => {
          const itemId = el.getAttribute("data-item-id");
          const idx = Number(el.getAttribute("data-set-idx"));
          const field = el.getAttribute("data-field");
          const item = draft.items.find((it) => it.id === itemId);
          if (!item || !Number.isFinite(idx) || !field) return;
          const set = item.sets[idx];
          if (!set) return;
          if (field === "reps") set.reps = clampInt(el.value, 0, 200);
          if (field === "weight") set.weight = clampNum(el.value, 0, 5000);
          if (field === "note") set.note = String(el.value || "");
        });
      });
    }

    rerenderBlocks();

    mustGetEl("#addExercise").addEventListener("click", () => {
      openExercisePicker(s, (exerciseId) => {
        const ex = s.exercises.find((e) => e.id === exerciseId);
        if (!ex) return;
        draft.items.push({
          id: uid(),
          exerciseId: ex.id,
          sets: [{ reps: 8, weight: 0, note: "" }],
        });
        rerenderBlocks();
      });
    });

    const saveBtn = mustGetEl("#saveWorkout");
    saveBtn.addEventListener("click", () => {
      draft.date = sanitizeISODate(wDate.value) || isoDate(new Date());
      draft.title = String(wTitle.value || "").trim();
      draft.notes = String(wNotes.value || "").trim();
      draft.updatedAt = new Date().toISOString();
      if (!draft.createdAt) draft.createdAt = draft.updatedAt;

      // Remove empty exercises / sets
      draft.items = draft.items
        .map((it) => ({
          ...it,
          sets: (it.sets || []).filter((set) => (set.reps ?? 0) > 0 || (set.weight ?? 0) > 0 || (set.note || "").trim() !== ""),
        }))
        .filter((it) => it.exerciseId && it.sets.length > 0);

      if (draft.items.length === 0) {
        toast("Add something", "A workout needs at least one exercise + set.", "warn");
        return;
      }

      if (existing) {
        const idx = s.workouts.findIndex((w) => w.id === existing.id);
        if (idx >= 0) s.workouts[idx] = draft;
      } else {
        s.workouts.push(draft);
      }
      saveState(s);
      toast("Saved", "Workout saved.", "ok");
      setHash("/dashboard");
    });

    if (existing) {
      const delBtn = mustGetEl("#deleteWorkout");
      delBtn.addEventListener("click", () => {
        if (!confirm("Delete this workout? This cannot be undone.")) return;
        s.workouts = s.workouts.filter((w) => w.id !== existing.id);
        saveState(s);
        toast("Deleted", "Workout removed.", "ok");
        setHash("/dashboard");
      });
    }
  }

  function renderExercises(s) {
    const queryId = "exerciseQuery";
    appRoot.innerHTML = `
      <div class="panel__header">
        <div>
          <h1 class="panel__title">Exercises</h1>
          <div class="muted small">Manage your exercise list (built-in + custom).</div>
        </div>
        <div class="row">
          <button class="btn btn--primary" id="addCustomExercise" type="button">Add custom</button>
        </div>
      </div>
      <div class="panel__body">
        <div class="grid grid--2">
          <div class="field">
            <label for="${queryId}">Search</label>
            <input class="input" id="${queryId}" placeholder="e.g., bench, squat, row" />
          </div>
          <div class="card">
            <div class="list-item__title">Tip</div>
            <div class="list-item__meta">Custom exercises can be renamed or deleted. Built-ins are protected.</div>
          </div>
        </div>
        <div style="height:12px"></div>
        <div id="exerciseList" class="list"></div>
      </div>
    `;

    const listEl = mustGetEl("#exerciseList");
    const qEl = mustGetEl(`#${queryId}`);

    const renderList = () => {
      const q = String(qEl.value || "").trim().toLowerCase();
      const exs = [...s.exercises].sort((a, b) => a.name.localeCompare(b.name));
      const filtered = q ? exs.filter((e) => e.name.toLowerCase().includes(q)) : exs;

      listEl.innerHTML = filtered
        .map((e) => {
          const usedCount = countExerciseUsage(s, e.id);
          return `
            <div class="list-item">
              <div class="row">
                <div>
                  <div class="list-item__title">${escapeHTML(e.name)}</div>
                  <div class="list-item__meta">${escapeHTML(e.muscleGroup || "—")} • ${escapeHTML(e.equipment || "—")} • ${e.isCustom ? "Custom" : "Built-in"} • used ${usedCount}×</div>
                </div>
                <div class="spacer"></div>
                ${e.isCustom ? `<button class="btn" data-action="rename" data-id="${escapeAttr(e.id)}" type="button">Rename</button>` : ""}
                ${e.isCustom ? `<button class="btn btn--danger" data-action="delete" data-id="${escapeAttr(e.id)}" type="button">Delete</button>` : ""}
              </div>
            </div>
          `;
        })
        .join("");

      listEl.querySelectorAll("[data-action='rename']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const ex = s.exercises.find((x) => x.id === id);
          if (!ex) return;
          const next = prompt("Rename exercise:", ex.name);
          if (!next) return;
          ex.name = next.trim().slice(0, 60);
          saveState(s);
          toast("Updated", "Exercise renamed.", "ok");
          renderList();
        });
      });

      listEl.querySelectorAll("[data-action='delete']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const ex = s.exercises.find((x) => x.id === id);
          if (!ex) return;
          const used = countExerciseUsage(s, ex.id);
          if (used > 0 && !confirm(`This exercise is used in ${used} workout(s). Delete anyway? Those workouts will keep the name for display, but progress charts may break for it.`)) {
            return;
          }
          s.exercises = s.exercises.filter((x) => x.id !== ex.id);
          saveState(s);
          toast("Deleted", "Exercise removed.", "ok");
          renderList();
        });
      });
    };

    qEl.addEventListener("input", renderList);
    renderList();

    mustGetEl("#addCustomExercise").addEventListener("click", () => {
      const name = prompt("Exercise name (e.g., Cable row):");
      if (!name) return;
      const muscleGroup = prompt("Muscle group (optional, e.g., Back):") || "";
      const equipment = prompt("Equipment (optional, e.g., Cable):") || "";
      s.exercises.push({
        id: uid(),
        name: name.trim().slice(0, 60),
        muscleGroup: muscleGroup.trim().slice(0, 40),
        equipment: equipment.trim().slice(0, 40),
        isCustom: true,
        createdAt: new Date().toISOString(),
      });
      saveState(s);
      toast("Added", "Custom exercise created.", "ok");
      renderList();
    });
  }

  function renderProgress(s) {
    const units = s.profile.units;
    const exercises = [...s.exercises].sort((a, b) => a.name.localeCompare(b.name));
    const defaultId = exercises[0]?.id || "";

    appRoot.innerHTML = `
      <div class="panel__header">
        <div>
          <h1 class="panel__title">Progress</h1>
          <div class="muted small">Estimated 1RM trend per exercise (Epley formula).</div>
        </div>
        <div class="row">
          <a class="btn" href="#/workout">Log workout</a>
        </div>
      </div>
      <div class="panel__body">
        <div class="grid grid--2">
          <div class="field">
            <label for="progExercise">Exercise</label>
            <select class="select" id="progExercise">
              ${exercises.map((e) => `<option value="${escapeAttr(e.id)}">${escapeHTML(e.name)}</option>`).join("")}
            </select>
          </div>
          <div class="card">
            <div class="list-item__title">How it works</div>
            <div class="list-item__meta">For each workout, FitTrack takes the best set and estimates 1RM as <b>weight × (1 + reps/30)</b>. This is a rough indicator, not a guarantee.</div>
          </div>
        </div>

        <div style="height:12px"></div>
        <div id="chartHost"></div>
        <div style="height:12px"></div>
        <div id="progTable"></div>
      </div>
    `;

    const sel = mustGetEl("#progExercise");
    const chartHost = mustGetEl("#chartHost");
    const tableHost = mustGetEl("#progTable");

    const render = () => {
      const exId = sel.value || defaultId;
      const ex = s.exercises.find((e) => e.id === exId);
      const points = progressPointsForExercise(s, exId);

      if (!ex) {
        chartHost.innerHTML = `<div class="card"><div class="muted">No exercises found.</div></div>`;
        tableHost.innerHTML = "";
        return;
      }

      if (points.length === 0) {
        chartHost.innerHTML = `
          <div class="card">
            <div class="list-item__title">${escapeHTML(ex.name)}</div>
            <div class="list-item__meta">No logged sets yet for this exercise.</div>
          </div>
        `;
        tableHost.innerHTML = "";
        return;
      }

      const best = Math.max(...points.map((p) => p.e1rm));
      const first = points[0]?.e1rm ?? 0;
      const last = points[points.length - 1]?.e1rm ?? 0;
      const delta = last - first;

      chartHost.innerHTML = `
        <div class="chart">
          <div class="chart__header">
            <div>
              <div class="chart__title">${escapeHTML(ex.name)}</div>
              <div class="chart__meta">${points.length} data point(s) • best ${formatNumber(best)} ${escapeHTML(units)}</div>
            </div>
            <div class="chart__meta">${delta >= 0 ? "+" : ""}${formatNumber(delta)} since first</div>
          </div>
          <div class="chart__body">
            ${sparklineSVG(points.map((p) => p.e1rm))}
          </div>
        </div>
      `;

      tableHost.innerHTML = `
        <div class="card">
          <div class="list-item__title">History</div>
          <div class="list-item__meta">Best set per workout day for this exercise.</div>
          <div style="height:10px"></div>
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Best set</th>
                <th>Estimated 1RM</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${points
                .slice()
                .reverse()
                .slice(0, 15)
                .map((p) => {
                  return `
                    <tr>
                      <td>${escapeHTML(formatDateFriendly(p.date))}</td>
                      <td>${escapeHTML(p.bestSetText)}</td>
                      <td>${formatNumber(p.e1rm)} ${escapeHTML(units)}</td>
                      <td><a class="btn btn--ghost" href="#/workout?id=${encodeURIComponent(p.workoutId)}">View</a></td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    };

    sel.addEventListener("change", render);
    // If no exercises exist, this view will be weird, but seed data ensures some exist.
    render();
  }

  function renderSettings(s) {
    const units = s.profile.units;
    appRoot.innerHTML = `
      <div class="panel__header">
        <div>
          <h1 class="panel__title">Settings</h1>
          <div class="muted small">Profile, units, and data portability.</div>
        </div>
        <div class="row">
          <a class="btn" href="#/dashboard">Done</a>
        </div>
      </div>
      <div class="panel__body">
        <div class="grid grid--2">
          <div class="card">
            <div class="list-item__title">Profile</div>
            <div class="list-item__meta">These settings affect display and calculations.</div>
            <div style="height:10px"></div>
            <form id="profileForm" class="grid">
              <div class="field">
                <label for="pName">Name</label>
                <input class="input" id="pName" maxlength="40" value="${escapeAttr(s.profile.name)}" />
              </div>
              <div class="field">
                <label for="pUnits">Weight units</label>
                <select class="select" id="pUnits">
                  <option value="kg" ${units === "kg" ? "selected" : ""}>kg</option>
                  <option value="lb" ${units === "lb" ? "selected" : ""}>lb</option>
                </select>
              </div>
              <div class="row">
                <button class="btn btn--primary" type="submit">Save profile</button>
                <span class="muted small">No account. Stored locally.</span>
              </div>
            </form>
          </div>

          <div class="card">
            <div class="list-item__title">Data</div>
            <div class="list-item__meta">Export/import your data as JSON. Great for backups.</div>
            <div style="height:10px"></div>
            <div class="row">
              <button class="btn" id="exportBtn" type="button">Export JSON</button>
              <label class="btn" for="importFile" style="cursor:pointer">Import JSON</label>
              <input id="importFile" type="file" accept="application/json" class="sr-only" />
            </div>
            <div style="height:10px"></div>
            <div class="row">
              <button class="btn btn--danger" id="resetBtn" type="button">Reset all data</button>
            </div>
            <div style="height:10px"></div>
            <div class="muted small">Reset will delete workouts and custom exercises in this browser.</div>
          </div>
        </div>

        <div style="height:12px"></div>
        <div class="card">
          <div class="list-item__title">About</div>
          <div class="list-item__meta">
            FitTrack stores data in <b>localStorage</b> on this device. Read the <a href="./privacypolicy/">privacy policy</a>.
          </div>
        </div>
      </div>
    `;

    const profileForm = mustGetEl("#profileForm");
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = String(mustGetEl("#pName").value || "").trim();
      const nextUnits = String(mustGetEl("#pUnits").value || "kg") === "lb" ? "lb" : "kg";
      if (!name) {
        toast("Name required", "Please enter a name.", "warn");
        return;
      }
      s.profile.name = name;
      s.profile.units = nextUnits;
      saveState(s);
      toast("Saved", "Profile updated.", "ok");
      renderSettings(s);
    });

    mustGetEl("#exportBtn").addEventListener("click", () => exportJSON(s));
    mustGetEl("#importFile").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const imported = sanitizeImportedState(parsed);
        if (!imported) throw new Error("Invalid file");
        Object.assign(s, imported);
        ensureSeedData(s);
        saveState(s);
        toast("Imported", "Data imported successfully.", "ok");
        renderRoute(s);
      } catch (err) {
        toast("Import failed", "That file didn't look like FitTrack data.", "danger");
      } finally {
        e.target.value = "";
      }
    });

    mustGetEl("#resetBtn").addEventListener("click", () => {
      if (!confirm("Reset ALL FitTrack data in this browser? This cannot be undone.")) return;
      localStorage.removeItem(STORAGE_KEY);
      const fresh = loadState();
      Object.assign(s, fresh);
      ensureSeedData(s);
      saveState(s);
      toast("Reset", "All data cleared.", "ok");
      renderRoute(s);
    });
  }

  // ---------------------------
  // UI helpers
  // ---------------------------

  function openExercisePicker(s, onPick) {
    const id = "picker_" + uid();
    const exerciseOptions = [...s.exercises].sort((a, b) => a.name.localeCompare(b.name));

    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.background = "rgba(0,0,0,0.55)";
    modal.style.display = "grid";
    modal.style.placeItems = "center";
    modal.style.padding = "16px";
    modal.style.zIndex = "60";
    modal.innerHTML = `
      <div class="panel" style="width:min(820px, 100%);">
        <div class="panel__header">
          <div>
            <div class="panel__title">Add exercise</div>
            <div class="muted small">Search and select.</div>
          </div>
          <div class="row">
            <button class="btn" data-action="close" type="button">Close</button>
          </div>
        </div>
        <div class="panel__body">
          <div class="grid grid--2">
            <div class="field">
              <label for="${id}_q">Search</label>
              <input class="input" id="${id}_q" placeholder="Type to filter…" />
            </div>
            <div class="card">
              <div class="list-item__title">Custom exercise</div>
              <div class="list-item__meta">Can’t find one? Create it in <a href="#/exercises">Exercises</a>.</div>
            </div>
          </div>
          <div style="height:12px"></div>
          <div id="${id}_list" class="list" style="max-height: 55vh; overflow:auto;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const escId = cssEscape(id);
    const q = modal.querySelector(`#${escId}_q`);
    const list = modal.querySelector(`#${escId}_list`);

    const close = () => {
      modal.remove();
      document.removeEventListener("keydown", onKeyDown);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    modal.querySelector("[data-action='close']").addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });

    const render = () => {
      const term = String(q.value || "").trim().toLowerCase();
      const filtered = term ? exerciseOptions.filter((e) => e.name.toLowerCase().includes(term)) : exerciseOptions;
      list.innerHTML = filtered
        .slice(0, 200)
        .map((e) => {
          return `
            <div class="list-item">
              <div class="row">
                <div>
                  <div class="list-item__title">${escapeHTML(e.name)}</div>
                  <div class="list-item__meta">${escapeHTML(e.muscleGroup || "—")} • ${escapeHTML(e.equipment || "—")}</div>
                </div>
                <div class="spacer"></div>
                <button class="btn btn--primary" data-action="pick" data-id="${escapeAttr(e.id)}" type="button">Add</button>
              </div>
            </div>
          `;
        })
        .join("");

      list.querySelectorAll("[data-action='pick']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const exId = btn.getAttribute("data-id");
          if (!exId) return;
          close();
          onPick(exId);
        });
      });
    };

    q.addEventListener("input", render);
    render();
    q.focus();
  }

  function workoutRowHTML(s, w) {
    const exercises = w.items
      .map((it) => s.exercises.find((e) => e.id === it.exerciseId)?.name || "(deleted exercise)")
      .slice(0, 3);
    const more = w.items.length > 3 ? ` +${w.items.length - 3} more` : "";
    return `
      <div class="list-item">
        <div class="row">
          <div>
            <div class="list-item__title">${escapeHTML(w.title?.trim() ? w.title : formatDateFriendly(w.date))}</div>
            <div class="list-item__meta">${escapeHTML(exercises.join(", ") + more)} • volume ${formatNumber(workoutVolume(w))}</div>
          </div>
          <div class="spacer"></div>
          <a class="btn" href="#/workout?id=${encodeURIComponent(w.id)}">Open</a>
          <button class="btn btn--danger" type="button" data-action="delete-workout" data-id="${escapeAttr(w.id)}">Delete</button>
        </div>
      </div>
    `;
  }

  function exerciseBlockHTML(s, item, units) {
    const ex = s.exercises.find((e) => e.id === item.exerciseId);
    const name = ex?.name || "(deleted exercise)";
    return `
      <div class="card">
        <div class="row">
          <div>
            <div class="list-item__title">${escapeHTML(name)}</div>
            <div class="list-item__meta">${escapeHTML(ex?.muscleGroup || "—")} • ${escapeHTML(ex?.equipment || "—")}</div>
          </div>
          <div class="spacer"></div>
          <button class="btn" data-action="add-set" data-item-id="${escapeAttr(item.id)}" type="button">Add set</button>
          <button class="btn btn--danger" data-action="remove-exercise" data-item-id="${escapeAttr(item.id)}" type="button">Remove</button>
        </div>
        <div style="height:10px"></div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:72px">Set</th>
              <th style="width:120px">Weight (${escapeHTML(units)})</th>
              <th style="width:120px">Reps</th>
              <th>Note</th>
              <th style="width:90px"></th>
            </tr>
          </thead>
          <tbody>
            ${(item.sets || [])
              .map((set, idx) => {
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><input class="input" inputmode="decimal" data-field="weight" data-item-id="${escapeAttr(item.id)}" data-set-idx="${idx}" value="${escapeAttr(String(set.weight ?? 0))}" /></td>
                    <td><input class="input" inputmode="numeric" data-field="reps" data-item-id="${escapeAttr(item.id)}" data-set-idx="${idx}" value="${escapeAttr(String(set.reps ?? 0))}" /></td>
                    <td><input class="input" data-field="note" data-item-id="${escapeAttr(item.id)}" data-set-idx="${idx}" value="${escapeAttr(String(set.note ?? ""))}" placeholder="optional" /></td>
                    <td><button class="btn btn--danger" data-action="remove-set" data-item-id="${escapeAttr(item.id)}" data-set-idx="${idx}" type="button">Remove</button></td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderTopPRsHTML(s) {
    const bestByExercise = new Map();
    for (const w of s.workouts) {
      for (const it of w.items || []) {
        const exId = it.exerciseId;
        for (const set of it.sets || []) {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          if (weight <= 0 || reps <= 0) continue;
          const e1rm = estimate1RM(weight, reps);
          const prev = bestByExercise.get(exId);
          if (!prev || e1rm > prev.e1rm) {
            bestByExercise.set(exId, {
              e1rm,
              date: w.date,
              text: `${formatNumber(weight)}×${reps}`,
            });
          }
        }
      }
    }

    const rows = [...bestByExercise.entries()]
      .map(([exId, best]) => {
        const ex = s.exercises.find((e) => e.id === exId);
        return { name: ex?.name || "(deleted exercise)", exId, ...best };
      })
      .sort((a, b) => b.e1rm - a.e1rm)
      .slice(0, 6);

    if (rows.length === 0) return `<div class="muted">No PRs yet — log workouts to see progress here.</div>`;

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Exercise</th>
            <th>Best set</th>
            <th>e1RM</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((r) => {
              return `
                <tr>
                  <td>${escapeHTML(r.name)}</td>
                  <td>${escapeHTML(r.text)} <span class="muted small">(${escapeHTML(formatDateFriendly(r.date))})</span></td>
                  <td>${formatNumber(r.e1rm)} ${escapeHTML(s.profile.units)}</td>
                  <td><a class="btn btn--ghost" href="#/progress">View</a></td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  // ---------------------------
  // Data + calculations
  // ---------------------------

  function createEmptyWorkout() {
    const now = new Date().toISOString();
    return {
      id: uid(),
      date: isoDate(new Date()),
      title: "",
      notes: "",
      items: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  function workoutVolume(w) {
    let v = 0;
    for (const it of w.items || []) {
      for (const set of it.sets || []) {
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        v += weight * reps;
      }
    }
    return round2(v);
  }

  function estimate1RM(weight, reps) {
    // Epley: 1RM = w * (1 + r/30)
    return round2(weight * (1 + reps / 30));
  }

  function progressPointsForExercise(s, exId) {
    const points = [];
    const workouts = [...s.workouts].sort((a, b) => a.date.localeCompare(b.date));
    for (const w of workouts) {
      const item = (w.items || []).find((it) => it.exerciseId === exId);
      if (!item) continue;
      let best = null;
      for (const set of item.sets || []) {
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        if (weight <= 0 || reps <= 0) continue;
        const e1rm = estimate1RM(weight, reps);
        const text = `${formatNumber(weight)}×${reps}`;
        if (!best || e1rm > best.e1rm) best = { e1rm, text };
      }
      if (!best) continue;
      points.push({
        workoutId: w.id,
        date: w.date,
        e1rm: best.e1rm,
        bestSetText: best.text,
      });
    }
    return points;
  }

  function computeStreakDays(workouts, todayISO) {
    const days = new Set(workouts.map((w) => w.date));
    let streak = 0;
    let cur = todayISO;
    while (days.has(cur)) {
      streak += 1;
      cur = isoDate(addDays(parseISODate(cur), -1));
    }
    return streak;
  }

  function countExerciseUsage(s, exId) {
    let c = 0;
    for (const w of s.workouts) {
      if ((w.items || []).some((it) => it.exerciseId === exId)) c += 1;
    }
    return c;
  }

  // ---------------------------
  // Storage
  // ---------------------------

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    try {
      const parsed = JSON.parse(raw);
      return sanitizeImportedState(parsed) || emptyState();
    } catch {
      return emptyState();
    }
  }

  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function emptyState() {
    return {
      version: 1,
      profile: null,
      exercises: [],
      workouts: [],
    };
  }

  function sanitizeImportedState(obj) {
    if (!obj || typeof obj !== "object") return null;
    const version = Number(obj.version) || 1;
    const profile = obj.profile && typeof obj.profile === "object" ? obj.profile : null;
    const exercises = Array.isArray(obj.exercises) ? obj.exercises : [];
    const workouts = Array.isArray(obj.workouts) ? obj.workouts : [];

    const safe = {
      version,
      profile: profile
        ? {
            name: String(profile.name || "").trim().slice(0, 40),
            units: String(profile.units || "kg") === "lb" ? "lb" : "kg",
            createdAt: typeof profile.createdAt === "string" ? profile.createdAt : new Date().toISOString(),
          }
        : null,
      exercises: exercises
        .filter((e) => e && typeof e === "object" && e.id && e.name)
        .map((e) => ({
          id: String(e.id),
          name: String(e.name).trim().slice(0, 60),
          muscleGroup: String(e.muscleGroup || "").trim().slice(0, 40),
          equipment: String(e.equipment || "").trim().slice(0, 40),
          isCustom: Boolean(e.isCustom),
          createdAt: typeof e.createdAt === "string" ? e.createdAt : new Date().toISOString(),
        })),
      workouts: workouts
        .filter((w) => w && typeof w === "object" && w.id && w.date && Array.isArray(w.items))
        .map((w) => ({
          id: String(w.id),
          date: sanitizeISODate(String(w.date)) || isoDate(new Date()),
          title: String(w.title || "").trim().slice(0, 80),
          notes: String(w.notes || "").trim().slice(0, 5000),
          createdAt: typeof w.createdAt === "string" ? w.createdAt : new Date().toISOString(),
          updatedAt: typeof w.updatedAt === "string" ? w.updatedAt : new Date().toISOString(),
          items: (w.items || [])
            .filter((it) => it && typeof it === "object" && it.exerciseId)
            .map((it) => ({
              id: String(it.id || uid()),
              exerciseId: String(it.exerciseId),
              sets: Array.isArray(it.sets)
                ? it.sets.map((set) => ({
                    weight: clampNum(set?.weight, 0, 5000),
                    reps: clampInt(set?.reps, 0, 200),
                    note: String(set?.note || "").slice(0, 200),
                  }))
                : [],
            })),
        })),
    };

    return safe;
  }

  function ensureSeedData(s) {
    if (!Array.isArray(s.exercises)) s.exercises = [];
    if (!Array.isArray(s.workouts)) s.workouts = [];

    if (s.exercises.length === 0) {
      s.exercises = seedExercises();
    } else {
      // Ensure required fields exist for older data.
      s.exercises = s.exercises.map((e) => ({
        id: e.id || uid(),
        name: e.name || "Exercise",
        muscleGroup: e.muscleGroup || "",
        equipment: e.equipment || "",
        isCustom: Boolean(e.isCustom),
        createdAt: e.createdAt || new Date().toISOString(),
      }));
    }
  }

  function seedExercises() {
    const now = new Date().toISOString();
    const builtins = [
      ["Back Squat", "Legs", "Barbell"],
      ["Front Squat", "Legs", "Barbell"],
      ["Deadlift", "Back", "Barbell"],
      ["Romanian Deadlift", "Hamstrings", "Barbell"],
      ["Bench Press", "Chest", "Barbell"],
      ["Incline Bench Press", "Chest", "Barbell"],
      ["Overhead Press", "Shoulders", "Barbell"],
      ["Pull-up", "Back", "Bodyweight"],
      ["Lat Pulldown", "Back", "Cable"],
      ["Barbell Row", "Back", "Barbell"],
      ["Dumbbell Row", "Back", "Dumbbell"],
      ["Dumbbell Bench Press", "Chest", "Dumbbell"],
      ["Dips", "Chest", "Bodyweight"],
      ["Biceps Curl", "Arms", "Dumbbell"],
      ["Triceps Pushdown", "Arms", "Cable"],
      ["Leg Press", "Legs", "Machine"],
      ["Leg Extension", "Quads", "Machine"],
      ["Leg Curl", "Hamstrings", "Machine"],
      ["Calf Raise", "Calves", "Machine"],
      ["Plank", "Core", "Bodyweight"],
      ["Running", "Cardio", "—"],
      ["Cycling", "Cardio", "—"],
    ];
    return builtins.map(([name, muscleGroup, equipment]) => ({
      id: uid(),
      name,
      muscleGroup,
      equipment,
      isCustom: false,
      createdAt: now,
    }));
  }

  // ---------------------------
  // Export / import helpers
  // ---------------------------

  function exportJSON(s) {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fittrack-backup-${isoDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Exported", "Downloaded a JSON backup.", "ok");
  }

  // ---------------------------
  // Theme
  // ---------------------------

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
      return;
    }
    // Default: match system
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    document.documentElement.setAttribute("data-theme", prefersLight ? "light" : "dark");
  }

  // ---------------------------
  // Utilities
  // ---------------------------

  function parseHash() {
    const raw = String(location.hash || "");
    const h = raw.startsWith("#") ? raw.slice(1) : raw;
    const pathAndQuery = h.startsWith("/") ? h.slice(1) : h;
    const [path, query = ""] = pathAndQuery.split("?");
    const route = (path || "dashboard").split("/")[0] || "dashboard";
    const params = Object.fromEntries(new URLSearchParams(query).entries());
    return { route, params };
  }

  function setHash(path) {
    location.hash = `#${path.startsWith("/") ? path : `/${path}`}`;
  }

  function highlightNav(route) {
    document.querySelectorAll(".nav__link").forEach((a) => {
      const r = a.getAttribute("data-route");
      if (r === route) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function ensureToastWrap() {
    let el = document.querySelector(".toast-wrap");
    if (el) return el;
    el = document.createElement("div");
    el.className = "toast-wrap";
    document.body.appendChild(el);
    return el;
  }

  function toast(title, msg, kind = "ok") {
    const t = document.createElement("div");
    t.className = `toast toast--${kind}`;
    t.innerHTML = `<div class="toast__title">${escapeHTML(title)}</div><div class="toast__msg">${escapeHTML(msg)}</div>`;
    toastWrap.appendChild(t);
    const ms = kind === "danger" ? 5200 : 3600;
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(6px)";
      t.style.transition = "all 220ms ease";
      setTimeout(() => t.remove(), 240);
    }, ms);
  }

  function mustGetEl(sel) {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Missing element ${sel}`);
    return el;
  }

  function uid() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function isoDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseISODate(iso) {
    const [y, m, d] = String(iso).split("-").map((x) => Number(x));
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function sanitizeISODate(iso) {
    const s = String(iso || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
    return s;
  }

  function addDays(d, days) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }

  function startOfWeekISO(d) {
    // Monday start
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Mon=0
    x.setDate(x.getDate() - day);
    return isoDate(x);
  }

  function formatDateFriendly(iso) {
    try {
      const d = parseISODate(iso);
      return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  }

  function sum(nums) {
    return round2(nums.reduce((a, b) => a + (Number(b) || 0), 0));
  }

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function formatNumber(n) {
    const x = Number(n) || 0;
    return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function clampNum(val, min, max) {
    const n = Number(val);
    if (!Number.isFinite(n)) return 0;
    return Math.min(max, Math.max(min, n));
  }

  function clampInt(val, min, max) {
    const n = Math.trunc(Number(val));
    if (!Number.isFinite(n)) return 0;
    return Math.min(max, Math.max(min, n));
  }

  function escapeHTML(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(s) {
    // For attribute values inside double quotes
    return escapeHTML(s).replaceAll("\n", " ");
  }

  function cssEscape(s) {
    // CSS.escape isn't supported in every browser we might be hosted on.
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(String(s));
    return String(s).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function sparklineSVG(values) {
    const w = 600;
    const h = 220;
    const padX = 10;
    const padY = 16;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1e-6, max - min);

    const pts = values.map((v, i) => {
      const x = padX + (i * (w - padX * 2)) / Math.max(1, values.length - 1);
      const y = padY + (1 - (v - min) / span) * (h - padY * 2);
      return { x, y };
    });

    const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const last = pts[pts.length - 1];

    const gridLines = [0.25, 0.5, 0.75]
      .map((t) => {
        const y = padY + t * (h - padY * 2);
        return `<line x1="${padX}" x2="${w - padX}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>`;
      })
      .join("");

    return `
      <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Progress chart">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(78,160,255,0.85)" />
            <stop offset="100%" stop-color="rgba(124,92,255,0.85)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="transparent"></rect>
        ${gridLines}
        <polyline fill="none" stroke="url(#g)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${line}" />
        <circle cx="${last.x}" cy="${last.y}" r="4.5" fill="rgba(78,160,255,0.95)" />
      </svg>
    `;
  }
})();

