// January Sprint — Countdown + Tasks + Points
// Uses local machine timezone.

const STORAGE_KEY = "jan_sprint_v2";

const el = {
  countdownLabel: document.getElementById("countdownLabel"),
  countdownDetail: document.getElementById("countdownDetail"),
  pointsValue: document.getElementById("pointsValue"),
  pointsPill: document.getElementById("pointsPill"),
  progressBar: document.getElementById("progressBar"),
  completedCount: document.getElementById("completedCount"),
  totalCount: document.getElementById("totalCount"),
  taskInput: document.getElementById("taskInput"),
  pointsSelect: document.getElementById("pointsSelect"),
  addBtn: document.getElementById("addBtn"),
  taskList: document.getElementById("taskList"),
  clearCompletedBtn: document.getElementById("clearCompletedBtn"),
  resetBtn: document.getElementById("resetBtn"),
  todayChip: document.getElementById("todayChip"),
};

let state = loadState();

function defaultState() {
  return {
    points: 0,
    tasks: [],
    // Countdown target: end of January 2026
    // Change this if you want New Year's Day:
    // "2026-01-01T00:00:00"
    targetISO: "2026-01-31T23:59:59",
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tasks)) return defaultState();
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatCountdown(targetDate) {
  const now = new Date();
  const ms = targetDate - now;

  if (ms <= 0) {
    return {
      label: "Sprint complete ✅",
      detail: "Reset and start a new sprint.",
      msLeft: 0,
    };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    label: `${days} days left in January`,
    detail: `${hours}h ${minutes}m remaining`,
    msLeft: ms,
  };
}

function render() {
  // Today chip
  const now = new Date();
  el.todayChip.textContent = `📅 ${now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })}`;

  // Countdown
  const targetDate = new Date(state.targetISO);
  const cd = formatCountdown(targetDate);
  el.countdownLabel.textContent = cd.label;
  el.countdownDetail.textContent = cd.detail;

  // Points
  el.pointsValue.textContent = state.points;

  // Tasks
  el.taskList.innerHTML = "";
  state.tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = `item ${t.done ? "item--done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.done;
    checkbox.setAttribute("aria-label", "Mark complete");
    checkbox.addEventListener("change", () => toggleTask(t.id));

    const textWrap = document.createElement("div");
    textWrap.className = "item__text";

    const title = document.createElement("p");
    title.className = "item__title";
    title.textContent = t.title;

    const sub = document.createElement("p");
    sub.className = "item__sub";
    sub.textContent = t.done ? "Completed" : "In progress";

    textWrap.appendChild(title);
    textWrap.appendChild(sub);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `+${t.points}`;

    li.appendChild(checkbox);
    li.appendChild(textWrap);
    li.appendChild(badge);

    el.taskList.appendChild(li);
  });

  // Progress
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.done).length;
  el.totalCount.textContent = total;
  el.completedCount.textContent = completed;

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  el.progressBar.style.width = `${pct}%`;

  saveState();
}

function addTask() {
  const title = el.taskInput.value.trim();
  if (!title) return;

  const points = Number(el.pointsSelect.value) || 10;

  state.tasks.unshift({
    id: uid(),
    title,
    points,
    done: false,
    createdAt: Date.now(),
  });

  el.taskInput.value = "";
  render();
}

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  // If marking done: add points. If unchecking: remove points.
  if (!task.done) {
    task.done = true;
    state.points += task.points;

    // More satisfying animation for points pill
    el.pointsPill?.animate(
      [
        { transform: "translateY(0px) scale(1)" },
        { transform: "translateY(-2px) scale(1.06)" },
        { transform: "translateY(0px) scale(1)" },
      ],
      { duration: 260, easing: "ease-out" }
    );

    // Bigger pop on the number
    el.pointsValue.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }],
      { duration: 240, easing: "ease-out" }
    );

    maybeBonus();
  } else {
    task.done = false;
    state.points = Math.max(0, state.points - task.points);
  }

  render();
}

function clearCompleted() {
  state.tasks = state.tasks.filter((t) => !t.done);
  render();
}

function resetAll() {
  state = defaultState();
  render();
}

// Bonus: if all tasks are complete, add +50
function maybeBonus() {
  const total = state.tasks.length;
  if (total === 0) return;

  const completed = state.tasks.filter((t) => t.done).length;
  if (completed === total) {
    state.points += 50;
    el.countdownDetail.textContent = "All tasks done 🎉 +50 bonus!";
  }
}

// Events
el.addBtn.addEventListener("click", addTask);
el.taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});
el.clearCompletedBtn.addEventListener("click", clearCompleted);
el.resetBtn.addEventListener("click", resetAll);

// Countdown tick (update every second)
setInterval(() => {
  const targetDate = new Date(state.targetISO);
  const cd = formatCountdown(targetDate);
  el.countdownLabel.textContent = cd.label;
  el.countdownDetail.textContent = cd.detail;
}, 1000);

render();
