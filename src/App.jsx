import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Dumbbell,
  Edit3,
  PanelLeft,
  Plus,
  Settings,
  Flag,
  Clock,
  LayoutDashboard,
  ListChecks,
  Moon,
  Palette,
  Sun,
  Trash2,
  Trophy,
} from "lucide-react";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const MAIN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "habits", label: "Habitudes", icon: ListChecks },
  { id: "sport", label: "Sport", icon: Dumbbell },
];

const THEME_OPTIONS = [
  { id: "default", label: "Default", icon: Palette },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

const DEFAULT_MUSCU_EXERCISES = [
  "Ab Wheel",
  "Abduction hanche",
  "Adduction hanche",
  "Battle Rope",
  "Box Jump",
  "Bulgarian Split Squat",
  "Burpees",
  "Cable Crunch",
  "Curl biceps haltères",
  "Curl biceps haltères incliné",
  "Curl biceps barre",
  "Curl incliné",
  "Curl marteau",
  "Développé couché",
  "Développé couché barre",
  "Développé couché haltères",
  "Développé couché haltères prise serrée",
  "Développé décliné barre",
  "Développé décliné haltères",
  "Développé incliné",
  "Développé incliné barre",
  "Développé incliné haltères",
  "Développé militaire",
  "Développé militaire barre",
  "Développé militaire haltères",
  "Développé nuque",
  "Développé épaules haltères",
  "Dips",
  "Écartés couché haltères",
  "Écartés incliné haltères",
  "Écartés machine",
  "Écartés poulie basse",
  "Écartés poulie haute",
  "Écartés poulie vis-a-vis",
  "Élévation frontale",
  "Élévation latérale",
  "Extension lombaire",
  "Extension triceps",
  "Face Pull",
  "Fentes",
  "Fentes marchées",
  "Gainage",
  "Goblet Squat",
  "Good Morning",
  "Hack Squat",
  "Hip Thrust",
  "Jump Squat",
  "Leg Curl",
  "Leg Extension",
  "Leg Press",
  "Mollets assis",
  "Mollets debout",
  "Mountain Climbers",
  "Oiseau",
  "Pec Deck",
  "Pompes",
  "Presse à cuisses",
  "Pull Over",
  "Pull Over haltère",
  "Rack Pull",
  "Relevé de jambes",
  "Renegade Row",
  "Rowing barre",
  "Rowing haltère",
  "Russian Twist",
  "Shrugs",
  "Sit-up",
  "Soulevé de terre",
  "Squat",
  "Squat avant",
  "Step-up",
  "Soulevé de terre sumo",
  "Superman",
  "Tirage horizontal",
  "Tirage menton",
  "Tirage vertical",
  "Tractions",
  "Tractions supination",
  "Triceps barre au front",
  "Triceps corde",
  "Triceps dips banc",
  "Triceps extension nuque",
  "Wall Ball",
  "Course a pied dehors",
  "Course sur tapis",
  "Marche inclinee tapis",
  "Velo appartement",
  "Velo elliptique",
  "Rameur",
  "Stairmaster",
];

const CARDIO_EXERCISES = new Set([
  "Course a pied dehors",
  "Course sur tapis",
  "Marche inclinee tapis",
  "Velo appartement",
  "Velo elliptique",
  "Rameur",
  "Stairmaster",
]);

function getDateKey(habitId, date) {
  return `${habitId}-${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDayDate(monthDate, day) {
  return new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
}

function getDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatCountdown(milliseconds, showSeconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [
    String(days),
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
  ];

  if (showSeconds) {
    parts.push(String(seconds).padStart(2, "0"));
  }

  return parts.join(":");
}

export default function HabitTrackerApp() {
  const today = new Date();

  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem("active-view") || "dashboard";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [exportJson, setExportJson] = useState("");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "default";
  });

  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem("habit-list");

    if (saved) {
      return JSON.parse(saved);
    }

    return [
      {
        id: Date.now(),
        name: "No Relapse",
        createdAt: Date.now(),
        targetDays: 90,
        countdownEnabled: false,
        countdownShowSeconds: true,
      },
    ];
  });

  const [selectedHabitId, setSelectedHabitId] = useState(() => {
    const saved = localStorage.getItem("selected-habit-id");
    return saved ? JSON.parse(saved) : habits[0]?.id || null;
  });

  const [habitData, setHabitData] = useState(() => {
    const saved = localStorage.getItem("habit-calendar-data");
    return saved ? JSON.parse(saved) : {};
  });

  const [sportSessions, setSportSessions] = useState(() => {
    const saved = localStorage.getItem("sport-sessions");
    return saved ? JSON.parse(saved) : [];
  });

  const selectedHabit =
    habits.find((habit) => habit.id === selectedHabitId) || habits[0] || null;

  useEffect(() => {
    localStorage.setItem("habit-list", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("habit-calendar-data", JSON.stringify(habitData));
  }, [habitData]);

  useEffect(() => {
    localStorage.setItem("selected-habit-id", JSON.stringify(selectedHabitId));
  }, [selectedHabitId]);

  useEffect(() => {
    localStorage.setItem("sport-sessions", JSON.stringify(sportSessions));
  }, [sportSessions]);

  useEffect(() => {
    localStorage.setItem("active-view", activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  function addHabit() {
    const trimmed = newHabitName.trim();

    if (!trimmed) {
      return;
    }

    const newHabit = {
      id: Date.now(),
      name: trimmed,
      createdAt: Date.now(),
      targetDays: 90,
      countdownEnabled: false,
      countdownShowSeconds: true,
    };

    setHabits((prev) => [...prev, newHabit]);
    setSelectedHabitId(newHabit.id);
    setNewHabitName("");
    setIsAddingHabit(false);
  }

  function deleteHabit() {
    if (!selectedHabit) {
      return;
    }

    const remainingHabits = habits.filter(
      (habit) => habit.id !== selectedHabit.id
    );

    setHabits(remainingHabits);
    setSelectedHabitId(remainingHabits[0]?.id || null);
    setSettingsOpen(false);
  }

  function buildExportJson() {
    const data = {
      habits,
      habitData,
      selectedHabitId,
      sportSessions,
    };

    return JSON.stringify(data, null, 2);
  }

  function exportData() {
    setExportJson(buildExportJson());
  }

  function downloadExportData() {
    const json = exportJson || buildExportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "habit-tracker-backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function copyExportData() {
    const json = exportJson || buildExportJson();

    try {
      await navigator.clipboard.writeText(json);
      alert("Backup JSON copied to clipboard");
    } catch {
      alert("Copy failed. You can manually select and copy the JSON text.");
    }
  }

  function importData(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);

        setHabits(parsed.habits || []);
        setHabitData(parsed.habitData || {});
        setSelectedHabitId(parsed.selectedHabitId || null);
        setSportSessions(parsed.sportSessions || []);

        setSettingsOpen(false);
      } catch {
        alert("Invalid backup file");
      }
    };

    reader.readAsText(file);
  }

  function updateTargetDays(value) {
    if (!selectedHabit) {
      return;
    }

    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === selectedHabit.id
          ? {
              ...habit,
              targetDays: Math.max(1, Number(value) || 1),
            }
          : habit
      )
    );
  }

  function updateSelectedHabit(updates) {
    if (!selectedHabit) {
      return;
    }

    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === selectedHabit.id ? { ...habit, ...updates } : habit
      )
    );
  }

  function logRelapse() {
    if (!selectedHabit) {
      return;
    }

    const todayDate = getDateOnly(today);
    const creationDate = getDateOnly(new Date(selectedHabit.createdAt));
    const isStartDay = todayDate.getTime() === creationDate.getTime();

    if (isStartDay) {
      return;
    }
    
    const todayKey = getDateKey(selectedHabit.id, todayDate);

    setHabitData((prev) => ({
      ...prev,
      [todayKey]: "fail",
    }));
  }

  return (
    <div
      data-theme={theme}
      className="theme-root h-screen overflow-hidden bg-[#0b1020] text-white flex p-6 gap-6"
    >
      <aside
        className={`${sidebarOpen ? "w-72" : "w-20"} h-full min-h-0 shrink-0 transition-all duration-300 bg-[#161d38] border border-[#232c52] rounded-[32px] p-4 flex flex-col shadow-2xl overflow-hidden`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mb-6 w-12 h-12 rounded-2xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
          title="Menu"
        >
          <PanelLeft />
        </button>

        <nav className="flex flex-col gap-3">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const selected = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`rounded-2xl px-4 py-4 text-left transition-all duration-200 border cursor-pointer flex items-center gap-3 ${
                  selected
                    ? "bg-[#315843] border-[#5fa37c]"
                    : "bg-[#232c52] border-[#303b6e] hover:bg-[#2f3b70]"
                }`}
                title={item.label}
              >
                <Icon size={22} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {activeView === "habits" && (
          <div className="group mt-8 min-h-0 flex flex-1 flex-col border-t border-[#303b6e] pt-5">
            <div className="mb-3 flex items-center justify-between gap-3 pl-2 pr-3">
              {sidebarOpen && (
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Mes habitudes
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsAddingHabit(true)}
                disabled={isAddingHabit}
                className={`ml-auto w-8 h-8 shrink-0 transition flex items-center justify-center text-gray-400 hover:text-white focus-visible:opacity-100 ${
                  isAddingHabit
                    ? "pointer-events-none opacity-0"
                    : "opacity-0 group-hover:opacity-100"
                }`}
                title="Ajouter une habitude"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="sidebar-habits-scroll min-h-0 overflow-y-auto pr-4 flex flex-col gap-3">
              {habits.map((habit) => {
                const selected = selectedHabit?.id === habit.id;

                return (
                  <button
                    key={habit.id}
                    onClick={() => setSelectedHabitId(habit.id)}
                    className={`mr-1 shrink-0 rounded-2xl px-4 py-4 text-left transition-all duration-200 border cursor-pointer origin-left hover:scale-[1.015] ${
                      selected
                        ? "bg-[#294a3b] border-[#5fa37c]"
                        : "bg-[#232c52] border-[#303b6e] hover:bg-[#2f3b70]"
                    }`}
                    title={habit.name}
                  >
                    {sidebarOpen ? habit.name : habit.name.charAt(0)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-auto shrink-0 pt-4">
          <button
            type="button"
            onClick={() => setGlobalSettingsOpen(true)}
            className="w-full rounded-2xl px-4 py-4 bg-[#232c52] border border-[#303b6e] hover:bg-[#2f3b70] transition flex items-center justify-center gap-3"
            title="Parametres"
          >
            <Settings size={22} />
            {sidebarOpen && <span>Parametres</span>}
          </button>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {activeView === "dashboard" && (
          <DashboardView
            habits={habits}
            habitData={habitData}
            sportSessions={sportSessions}
            onOpenHabits={() => setActiveView("habits")}
            onOpenSport={() => setActiveView("sport")}
          />
        )}

        {activeView === "habits" && (
          <HabitsView
            selectedHabit={selectedHabit}
            habitData={habitData}
            setHabitData={setHabitData}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            setHabits={setHabits}
            updateTargetDays={updateTargetDays}
            updateSelectedHabit={updateSelectedHabit}
            exportData={exportData}
            exportJson={exportJson}
            setExportJson={setExportJson}
            importData={importData}
            copyExportData={copyExportData}
            downloadExportData={downloadExportData}
            deleteHabit={deleteHabit}
            logRelapse={logRelapse}
          />
        )}

        {activeView === "sport" && (
          <SportView
            sportSessions={sportSessions}
            setSportSessions={setSportSessions}
          />
        )}
      </main>

      {globalSettingsOpen && (
        <GlobalSettingsModal
          theme={theme}
          setTheme={setTheme}
          exportData={exportData}
          exportJson={exportJson}
          setExportJson={setExportJson}
          importData={importData}
          copyExportData={copyExportData}
          downloadExportData={downloadExportData}
          onClose={() => setGlobalSettingsOpen(false)}
        />
      )}

      {isAddingHabit && (
        <AddHabitModal
          newHabitName={newHabitName}
          setNewHabitName={setNewHabitName}
          addHabit={addHabit}
          onClose={() => {
            setIsAddingHabit(false);
            setNewHabitName("");
          }}
        />
      )}
    </div>
  );
}

function AddHabitModal({ newHabitName, setNewHabitName, addHabit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm bg-[#161d38] border border-[#303b6e] rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <div className="text-lg font-semibold">Nouvelle habitude</div>
            <div className="text-sm text-gray-300 mt-1">
              Ajoute une habitude a suivre
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <label className="text-sm text-gray-300 block mb-2">
          Nom de l'habitude
        </label>

        <input
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addHabit();
            }

            if (e.key === "Escape") {
              onClose();
            }
          }}
          autoFocus
          placeholder="Habit name"
          className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none text-white"
        />

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#6a3140] hover:bg-[#7a394a] transition rounded-2xl py-3 font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={addHabit}
            className="bg-[#315843] hover:bg-[#3d6b51] transition rounded-2xl py-3 font-medium"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function GlobalSettingsModal({
  theme,
  setTheme,
  exportData,
  exportJson,
  setExportJson,
  importData,
  copyExportData,
  downloadExportData,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-[#161d38] border border-[#303b6e] rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <div className="text-lg font-semibold">Parametres</div>
            <div className="text-sm text-gray-300 mt-1">
              Preferences generales de l'application
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <label className="text-sm text-gray-300 block mb-2">Theme</label>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = theme === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={`rounded-2xl border px-3 py-3 transition flex flex-col items-center gap-2 text-sm font-medium ${
                  selected
                    ? "bg-[#315843] border-[#5fa37c] text-white"
                    : "bg-[#232c52] border-[#4d5a8f] hover:bg-[#303b6e] text-gray-300"
                }`}
                title={option.label}
              >
                <Icon size={18} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#303b6e] pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="font-semibold">Backup global</div>
              <div className="text-sm text-gray-300 mt-1">
                Exporte et importe toutes tes donnees.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportData}
                className="bg-[#315843] hover:bg-[#3d6b51] transition rounded-xl px-4 py-2 font-medium"
              >
                Export
              </button>

              <label className="bg-[#242d56] hover:bg-[#2d3769] transition rounded-xl px-4 py-2 font-medium text-center cursor-pointer">
                Import

                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={importData}
                />
              </label>
            </div>
          </div>

          {exportJson && (
            <div className="bg-[#0b1020] border border-[#303b6e] rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="font-medium">Export JSON global</div>
                <button
                  type="button"
                  onClick={() => setExportJson("")}
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Close
                </button>
              </div>

              <textarea
                readOnly
                value={exportJson}
                className="w-full h-36 bg-[#161d38] border border-[#303b6e] rounded-xl p-3 text-xs text-gray-200 outline-none resize-none"
              />

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={copyExportData}
                  className="bg-[#242d56] hover:bg-[#2d3769] transition rounded-xl py-2 font-medium"
                >
                  Copy JSON
                </button>

                <button
                  type="button"
                  onClick={downloadExportData}
                  className="bg-[#315843] hover:bg-[#3d6b51] transition rounded-xl py-2 font-medium"
                >
                  Download JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getHabitOverview(habits, habitData) {
  let wins = 0;
  let relapses = 0;

  habits.forEach((habit) => {
    Object.entries(habitData).forEach(([key, state]) => {
      if (!key.startsWith(`${habit.id}-`)) {
        return;
      }

      if (state === "success") {
        wins++;
      }

      if (state === "fail") {
        relapses++;
      }
    });
  });

  return {
    habitsCount: habits.length,
    wins,
    relapses,
    trackedDays: wins + relapses,
  };
}

function getSportOverview(sportSessions) {
  const uniqueExercises = new Set();
  let totalEntries = 0;
  const bestByExercise = {};

  sportSessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      uniqueExercises.add(exercise.name);
      totalEntries++;

      const performanceValue =
        exercise.type === "cardio"
          ? exercise.distanceKm || exercise.durationMinutes || 0
          : exercise.value || 0;
      const currentBest = bestByExercise[exercise.name];

      if (!currentBest || performanceValue > currentBest.performanceValue) {
        bestByExercise[exercise.name] = {
          ...exercise,
          name: exercise.name,
          detail: exercise.detail,
          performanceValue,
          sessionTitle: session.title,
          date: session.date,
        };
      }
    });
  });

  return {
    sessionsCount: sportSessions.length,
    exerciseCount: uniqueExercises.size,
    totalEntries,
    bestScores: Object.values(bestByExercise),
    lastSession: sportSessions[sportSessions.length - 1],
  };
}

function getSportExerciseOptions(sportSessions) {
  const names = new Set(DEFAULT_MUSCU_EXERCISES);

  sportSessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      if (exercise.name) {
        names.add(exercise.name);
      }
    });
  });

  return [...names].sort((a, b) => a.localeCompare(b));
}

function isCardioExercise(exerciseName) {
  return CARDIO_EXERCISES.has(exerciseName);
}

function formatSportValue(value) {
  return Number.isInteger(value) ? value : String(value).replace(".", ",");
}

function formatSportMetric(value, suffix) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return `${formatSportValue(value)} ${suffix}`;
}

function parseSportNumber(value) {
  const normalized = String(value).trim().replace(",", ".");

  if (!normalized) {
    return NaN;
  }

  return Number(normalized);
}

function getSportPerformanceLabel(exercise) {
  if (exercise.type === "cardio") {
    return (
      formatSportMetric(exercise.distanceKm, "km") ||
      formatSportMetric(exercise.durationMinutes, "min") ||
      "-"
    );
  }

  return formatSportValue(exercise.value);
}

function getSportMetricLabels(exercise) {
  if (exercise.type === "cardio") {
    return [
      formatSportMetric(exercise.durationMinutes, "min"),
      formatSportMetric(exercise.distanceKm, "km"),
      formatSportMetric(exercise.speedKmh, "km/h"),
      formatSportMetric(exercise.inclinePercent, "% pente"),
    ].filter(Boolean);
  }

  return [
    `${exercise.series || 1} serie${(exercise.series || 1) > 1 ? "s" : ""}`,
  ];
}

function DashboardView({
  habits,
  habitData,
  sportSessions,
  onOpenHabits,
  onOpenSport,
}) {
  const habitOverview = getHabitOverview(habits, habitData);
  const sportOverview = getSportOverview(sportSessions);

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      <div className="mb-8 flex flex-col gap-2">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9de2ba]">
          Accueil
        </div>
        <h1 className="text-5xl font-bold tracking-tight">
          Dashboard global
        </h1>
        <p className="text-gray-300 max-w-2xl">
          Vue rapide de tes habitudes et de ton activite sport.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <DashboardStatCard
          icon={ListChecks}
          label="Habitudes"
          value={habitOverview.habitsCount}
          tone="green"
        />
        <DashboardStatCard
          icon={Check}
          label="Wins"
          value={habitOverview.wins}
          tone="green"
        />
        <DashboardStatCard
          icon={X}
          label="Relapses"
          value={habitOverview.relapses}
          tone="red"
        />
        <DashboardStatCard
          icon={Dumbbell}
          label="Seances muscu"
          value={sportOverview.sessionsCount}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Synthese habitudes</h2>
              <p className="text-sm text-gray-300 mt-1">
                {habitOverview.trackedDays} journees suivies au total
              </p>
            </div>

            <button
              onClick={onOpenHabits}
              className="rounded-2xl px-4 py-3 bg-[#232c52] hover:bg-[#303b6e] transition font-medium"
            >
              Ouvrir
            </button>
          </div>

          <div className="space-y-3">
            {habits.length > 0 ? (
              habits.map((habit) => (
                <HabitDashboardRow
                  key={habit.id}
                  habit={habit}
                  habitData={habitData}
                />
              ))
            ) : (
              <div className="text-gray-300 bg-[#101735] border border-[#303b6e] rounded-2xl p-5">
                Aucune habitude pour le moment.
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Sport</h2>
              <p className="text-sm text-gray-300 mt-1">
                Muscu suivie pour ton profil
              </p>
            </div>

            <button
              onClick={onOpenSport}
              className="rounded-2xl px-4 py-3 bg-[#232c52] hover:bg-[#303b6e] transition font-medium"
            >
              Ouvrir
            </button>
          </div>

          {sportOverview.lastSession && (
            <div className="bg-[#101735] border border-[#303b6e] rounded-2xl p-5">
              <div className="flex items-center gap-3 text-[#9de2ba] font-semibold mb-2">
                <CalendarDays size={18} />
                Derniere seance
              </div>
              <div className="text-3xl font-bold">
                {sportOverview.lastSession.title}
              </div>
              <div className="text-gray-300 mt-2">
                {sportOverview.lastSession.exercises.length} exercices notes
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DashboardStatCard({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    green: "text-[#9de2ba] bg-[#203d33] border-[#315843]",
    red: "text-[#ffb0be] bg-[#3d252d] border-[#6a3140]",
    blue: "text-[#b7c7ff] bg-[#202948] border-[#303b6e]",
  };

  return (
    <div className="bg-[#161d38] border border-[#232c52] rounded-3xl p-5 shadow-2xl">
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${toneClasses[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="text-4xl font-bold">{value}</div>
      <div className="text-sm text-gray-300 mt-1">{label}</div>
    </div>
  );
}

function HabitDashboardRow({ habit, habitData }) {
  const stats = getHabitOverview([habit], habitData);

  return (
    <div className="bg-[#101735] border border-[#303b6e] rounded-2xl p-4 grid grid-cols-[1fr_auto] gap-4 items-center">
      <div>
        <div className="font-semibold">{habit.name}</div>
        <div className="text-xs text-gray-400 mt-1">
          Objectif {habit.targetDays || 90} jours
        </div>
      </div>

      <div className="flex gap-3 text-sm font-semibold">
        <span className="text-[#9de2ba]">{stats.wins} W</span>
        <span className="text-[#ffb0be]">{stats.relapses} R</span>
      </div>
    </div>
  );
}

function HabitsView({
  selectedHabit,
  habitData,
  setHabitData,
  settingsOpen,
  setSettingsOpen,
  setHabits,
  updateTargetDays,
  updateSelectedHabit,
  exportData,
  exportJson,
  setExportJson,
  importData,
  copyExportData,
  downloadExportData,
  deleteHabit,
  logRelapse,
}) {
  return (
    <div className="w-full max-w-7xl mx-auto py-2">
      {selectedHabit ? (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9de2ba]">
                Habitudes
              </div>
              <h1 className="text-3xl font-bold mt-1">{selectedHabit.name}</h1>
            </div>

            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-12 h-12 rounded-2xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>

          {settingsOpen && (
            <div className="mb-6 bg-[#161d38] border border-[#303b6e] rounded-3xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-lg font-semibold">
                  Habit Settings
                </div>

                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="w-9 h-9 rounded-xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <label className="text-sm text-gray-300 block mb-2">
                Habit Name
              </label>

              <input
                type="text"
                value={selectedHabit.name}
                onChange={(e) => {
                  setHabits((prev) =>
                    prev.map((habit) =>
                      habit.id === selectedHabit.id
                        ? {
                            ...habit,
                            name: e.target.value,
                          }
                        : habit
                    )
                  );
                }}
                className="w-full mb-5 bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none"
              />

              <label className="text-sm text-gray-300 block mb-2">
                Goal Duration (days)
              </label>

              <input
                type="number"
                min="1"
                value={selectedHabit.targetDays || 90}
                onChange={(e) => updateTargetDays(e.target.value)}
                className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none"
              />

              <div className="mt-5 space-y-3">
                <label className="flex items-center justify-between gap-4 bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 cursor-pointer">
                  <span className="flex items-center gap-3 font-medium">
                    <Clock size={18} />
                    Countdown
                  </span>

                  <input
                    type="checkbox"
                    checked={Boolean(selectedHabit.countdownEnabled)}
                    onChange={(e) =>
                      updateSelectedHabit({
                        countdownEnabled: e.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-[#5fa37c]"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 cursor-pointer">
                  <span className="font-medium">Show seconds</span>

                  <input
                    type="checkbox"
                    checked={selectedHabit.countdownShowSeconds !== false}
                    disabled={!selectedHabit.countdownEnabled}
                    onChange={(e) =>
                      updateSelectedHabit({
                        countdownShowSeconds: e.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-[#5fa37c] disabled:opacity-40"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={exportData}
                  className="bg-[#315843] hover:bg-[#3d6b51] transition rounded-2xl py-3 font-medium"
                >
                  Export
                </button>

                <label className="bg-[#242d56] hover:bg-[#2d3769] transition rounded-2xl py-3 font-medium text-center cursor-pointer">
                  Import

                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={importData}
                  />
                </label>
              </div>

              {exportJson && (
                <div className="mt-5 bg-[#0b1020] border border-[#303b6e] rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-medium">Export JSON</div>
                    <button
                      onClick={() => setExportJson("")}
                      className="text-sm text-gray-300 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={exportJson}
                    className="w-full h-40 bg-[#161d38] border border-[#303b6e] rounded-xl p-3 text-xs text-gray-200 outline-none resize-none"
                  />

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                      onClick={copyExportData}
                      className="bg-[#242d56] hover:bg-[#2d3769] transition rounded-xl py-2 font-medium"
                    >
                      Copy JSON
                    </button>

                    <button
                      onClick={downloadExportData}
                      className="bg-[#315843] hover:bg-[#3d6b51] transition rounded-xl py-2 font-medium"
                    >
                      Download JSON
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={deleteHabit}
                className="w-full mt-4 bg-[#6a3140] hover:bg-[#7a394a] transition rounded-2xl py-3 font-medium"
              >
                Delete Habit
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,0.9fr)_minmax(560px,1.1fr)] gap-8 items-start">
            <div className="min-w-0">
              <HabitLifetimeStats
                selectedHabit={selectedHabit}
                habitData={habitData}
              />

              <HabitProgressBar
                selectedHabit={selectedHabit}
                habitData={habitData}
              />

              <LastRelapseCounter
                selectedHabit={selectedHabit}
                habitData={habitData}
              />

              <div className="mb-6 mt-6">
                <button
                  onClick={logRelapse}
                  className="w-full bg-[#3d3131] hover:bg-[#4b3b3b] transition rounded-3xl py-5 text-lg font-medium shadow-lg border border-[#6e5858]"
                >
                  Log Relapse
                </button>
              </div>
            </div>

            <div className="min-w-0 flex justify-center">
              <HabitCalendar
                selectedHabit={selectedHabit}
                habitData={habitData}
                setHabitData={setHabitData}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-8 text-center shadow-2xl">
          <h1 className="text-3xl font-bold mb-3">No habit yet</h1>
          <p className="text-gray-300">
            Use Add Habit in the sidebar to create one.
          </p>
        </div>
      )}
    </div>
  );
}

function createEmptySportForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    title: "",
    type: "Muscu",
    exercises: [
      {
        id: Date.now(),
        name: "",
        detail: "",
        series: "1",
        value: "",
        durationMinutes: "",
        distanceKm: "",
        speedKmh: "",
        inclinePercent: "",
      },
    ],
  };
}

function sessionToSportForm(session) {
  return {
    ...session,
    exercises: session.exercises.map((exercise, index) => ({
      id: `${session.id}-${index}`,
      name: exercise.name,
      detail: exercise.detail || "",
      series: String(exercise.series || 1),
      value:
        exercise.value === undefined ? "" : String(exercise.value).replace(".", ","),
      durationMinutes:
        exercise.durationMinutes === undefined
          ? ""
          : String(exercise.durationMinutes).replace(".", ","),
      distanceKm:
        exercise.distanceKm === undefined
          ? ""
          : String(exercise.distanceKm).replace(".", ","),
      speedKmh:
        exercise.speedKmh === undefined
          ? ""
          : String(exercise.speedKmh).replace(".", ","),
      inclinePercent:
        exercise.inclinePercent === undefined
          ? ""
          : String(exercise.inclinePercent).replace(".", ","),
    })),
  };
}

function getDefaultSportTitle(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function sortSportSessions(sessions) {
  return [...sessions].sort((a, b) => a.date.localeCompare(b.date));
}

function getSessionSportType(exercises) {
  const hasCardio = exercises.some((exercise) => exercise.type === "cardio");
  const hasStrength = exercises.some((exercise) => exercise.type !== "cardio");

  if (hasCardio && hasStrength) {
    return "Sport";
  }

  return hasCardio ? "Cardio" : "Muscu";
}

function SportView({ sportSessions, setSportSessions }) {
  const overview = getSportOverview(sportSessions);
  const exerciseOptions = getSportExerciseOptions(sportSessions);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [sportForm, setSportForm] = useState(() => createEmptySportForm());

  function openCreateForm() {
    setEditingSessionId(null);
    setSportForm(createEmptySportForm());
    setFormOpen(true);
  }

  function openEditForm(session) {
    setEditingSessionId(session.id);
    setSportForm(sessionToSportForm(session));
    setFormOpen(true);
  }

  function closeSportForm() {
    setEditingSessionId(null);
    setSportForm(createEmptySportForm());
    setFormOpen(false);
  }

  function updateSportFormField(field, value) {
    setSportForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateSportExercise(exerciseId, field, value) {
    setSportForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              [field]: value,
            }
          : exercise
      ),
    }));
  }

  function addSportExercise() {
    setSportForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: Date.now(),
          name: "",
          detail: "",
          series: "1",
          value: "",
          durationMinutes: "",
          distanceKm: "",
          speedKmh: "",
          inclinePercent: "",
        },
      ],
    }));
  }

  function removeSportExercise(exerciseId) {
    setSportForm((prev) => ({
      ...prev,
      exercises:
        prev.exercises.length === 1
          ? prev.exercises
          : prev.exercises.filter((exercise) => exercise.id !== exerciseId),
    }));
  }

  function saveSportSession() {
    const exercises = sportForm.exercises
      .map((exercise) => {
        const value = parseSportNumber(exercise.value);
        const series = Math.max(1, Number(exercise.series) || 1);
        const durationMinutes = parseSportNumber(exercise.durationMinutes);
        const distanceKm = parseSportNumber(exercise.distanceKm);
        const speedKmh = parseSportNumber(exercise.speedKmh);
        const inclinePercent = parseSportNumber(exercise.inclinePercent);
        const cardio = isCardioExercise(exercise.name);

        const savedExercise = {
          name: exercise.name.trim(),
          detail: exercise.detail.trim(),
          type: cardio ? "cardio" : "strength",
        };

        if (cardio) {
          if (Number.isFinite(durationMinutes)) {
            savedExercise.durationMinutes = durationMinutes;
          }

          if (Number.isFinite(distanceKm)) {
            savedExercise.distanceKm = distanceKm;
          }

          if (Number.isFinite(speedKmh)) {
            savedExercise.speedKmh = speedKmh;
          }

          if (Number.isFinite(inclinePercent)) {
            savedExercise.inclinePercent = inclinePercent;
          }
        } else {
          savedExercise.series = series;
          savedExercise.value = value;
        }

        return savedExercise;
      })
      .filter((exercise) => {
        if (!exercise.name) {
          return false;
        }

        if (exercise.type === "cardio") {
          return Number.isFinite(exercise.durationMinutes);
        }

        return Number.isFinite(exercise.value);
      })
      .map((exercise) => {
        if (!exercise.detail) {
          const exerciseWithoutDetail = { ...exercise };
          delete exerciseWithoutDetail.detail;
          return exerciseWithoutDetail;
        }

        return exercise;
      });

    if (!sportForm.date || exercises.length === 0) {
      alert("Ajoute une date et au moins une ligne valide.");
      return;
    }

    const savedSession = {
      id: editingSessionId || `${sportForm.date}-${Date.now()}`,
      date: sportForm.date,
      title: sportForm.title.trim() || getDefaultSportTitle(sportForm.date),
      type: getSessionSportType(exercises),
      exercises,
    };

    setSportSessions((prev) => {
      if (editingSessionId) {
        return sortSportSessions(
          prev.map((session) =>
            session.id === editingSessionId ? savedSession : session
          )
        );
      }

      return sortSportSessions([...prev, savedSession]);
    });

    closeSportForm();
  }

  function deleteSportSession(sessionId) {
    if (!confirm("Supprimer cette seance ?")) {
      return;
    }

    setSportSessions((prev) =>
      prev.filter((session) => session.id !== sessionId)
    );

    if (editingSessionId === sessionId) {
      closeSportForm();
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b7c7ff]">
            Sport
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            Sport
          </h1>
          <p className="text-gray-300 max-w-2xl">
            Ajoute, modifie et consulte tes seances de muscu et cardio.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-2xl px-5 py-4 bg-[#315843] hover:bg-[#3d6b51] transition font-semibold flex items-center gap-3"
        >
          <Plus size={20} />
          Ajouter seance
        </button>
      </div>

      {formOpen && (
        <section className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl mb-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {editingSessionId ? "Modifier la seance" : "Ajouter une seance"}
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                Muscu: series et score. Cardio: temps, distance, vitesse et pente.
              </p>
            </div>

            <button
              onClick={closeSportForm}
              className="w-11 h-11 rounded-2xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
              title="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 mb-5">
            <label className="block">
              <span className="text-sm text-gray-300 block mb-2">Date</span>
              <input
                type="date"
                value={sportForm.date}
                onChange={(e) => updateSportFormField("date", e.target.value)}
                className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-300 block mb-2">Titre</span>
              <input
                type="text"
                value={sportForm.title}
                onChange={(e) => updateSportFormField("title", e.target.value)}
                placeholder="Mardi 7 Juillet"
                className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none"
              />
            </label>
          </div>

          <div className="space-y-3">
            {sportForm.exercises.map((exercise) => {
              const cardio = isCardioExercise(exercise.name);

              return (
                <div
                  key={exercise.id}
                  className="bg-[#101735] border border-[#303b6e] rounded-2xl p-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_44px] gap-3">
                    <select
                      value={exercise.name}
                      onChange={(e) =>
                        updateSportExercise(exercise.id, "name", e.target.value)
                      }
                      className="bg-[#232c52] border border-[#4d5a8f] rounded-xl px-4 py-3 outline-none"
                    >
                      <option value="">Exercice</option>
                      {exerciseOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={exercise.detail}
                      onChange={(e) =>
                        updateSportExercise(
                          exercise.id,
                          "detail",
                          e.target.value
                        )
                      }
                      placeholder="Detail optionnel"
                      className="bg-[#232c52] border border-[#4d5a8f] rounded-xl px-4 py-3 outline-none"
                    />

                    <button
                      onClick={() => removeSportExercise(exercise.id)}
                      className="h-12 rounded-xl bg-[#6a3140] hover:bg-[#7a394a] transition flex items-center justify-center"
                      title="Supprimer exercice"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {cardio ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={exercise.durationMinutes}
                        onChange={(e) =>
                          updateSportExercise(
                            exercise.id,
                            "durationMinutes",
                            e.target.value
                          )
                        }
                        placeholder="Temps (min)"
                        className="bg-[#232c52] border border-[#4d5a8f] rounded-xl px-4 py-3 outline-none"
                      />

                      <input
                        type="text"
                        inputMode="decimal"
                        value={exercise.distanceKm}
                        onChange={(e) =>
                          updateSportExercise(
                            exercise.id,
                            "distanceKm",
                            e.target.value
                          )
                        }
                        placeholder="Distance (km)"
                        className="bg-[#232c52] border border-[#4d5a8f] rounded-xl px-4 py-3 outline-none"
                      />

                      <input
                        type="text"
                        inputMode="decimal"
                        value={exercise.speedKmh}
                        onChange={(e) =>
                          updateSportExercise(
                            exercise.id,
                            "speedKmh",
                            e.target.value
                          )
                        }
                        placeholder="Vitesse (km/h)"
                        className="bg-[#232c52] border border-[#4d5a8f] rounded-xl px-4 py-3 outline-none"
                      />

                      <input
                        type="text"
                        inputMode="decimal"
                        value={exercise.inclinePercent}
                        onChange={(e) =>
                          updateSportExercise(
                            exercise.id,
                            "inclinePercent",
                            e.target.value
                          )
                        }
                        placeholder="Pente (%)"
                        className="bg-[#232c52] border border-[#4d5a8f] rounded-xl px-4 py-3 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-[110px_140px] gap-3 mt-3">
                      <input
                        type="number"
                        min="1"
                        value={exercise.series}
                        onChange={(e) =>
                          updateSportExercise(
                            exercise.id,
                            "series",
                            e.target.value
                          )
                        }
                        placeholder="Series"
                        className="bg-[#232c52] border border-[#4d5a8f] rounded-xl px-4 py-3 outline-none"
                      />

                      <input
                        type="text"
                        inputMode="decimal"
                        value={exercise.value}
                        onChange={(e) =>
                          updateSportExercise(
                            exercise.id,
                            "value",
                            e.target.value
                          )
                        }
                        placeholder="Score"
                        className="bg-[#232c52] border border-[#4d5a8f] rounded-xl px-4 py-3 outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={addSportExercise}
              className="rounded-2xl px-4 py-3 bg-[#232c52] hover:bg-[#303b6e] transition font-medium flex items-center gap-2"
            >
              <Plus size={18} />
              Ajouter exercice
            </button>

            <button
              onClick={saveSportSession}
              className="rounded-2xl px-5 py-3 bg-[#315843] hover:bg-[#3d6b51] transition font-semibold"
            >
              Enregistrer
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DashboardStatCard
          icon={CalendarDays}
          label="Seances"
          value={overview.sessionsCount}
          tone="blue"
        />
        <DashboardStatCard
          icon={Activity}
          label="Exercices"
          value={overview.exerciseCount}
          tone="green"
        />
        <DashboardStatCard
          icon={Trophy}
          label="Performances"
          value={overview.totalEntries}
          tone="green"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-6 mb-6">
        <section className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl">
          <div className="flex items-center gap-3 text-[#9de2ba] font-semibold mb-3">
            <CalendarDays size={18} />
            Derniere seance
          </div>

          {overview.lastSession ? (
            <>
              <h2 className="text-3xl font-bold">
                {overview.lastSession.title}
              </h2>
              <div className="text-gray-300 mt-2">
                {overview.lastSession.exercises.length} exercices notes
              </div>
            </>
          ) : (
            <div className="text-gray-300">Aucune seance pour le moment.</div>
          )}
        </section>

        <section className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold">
                Meilleur score par exercice
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                Base perso, sans comparaison entre profils.
              </p>
            </div>
            <Trophy className="text-[#9de2ba]" size={24} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.bestScores.map((score) => (
              <div
                key={score.name}
                className="bg-[#101735] border border-[#303b6e] rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{score.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {score.sessionTitle}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[#9de2ba]">
                    {getSportPerformanceLabel(score)}
                  </div>
                </div>
                {score.detail && (
                  <div className="text-xs text-gray-400 mt-3">
                    {score.detail}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {getSportMetricLabels(score).join(" / ")}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        {sportSessions.map((session) => (
          <section
            key={session.id}
            className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-sm font-semibold text-[#9de2ba]">
                  {session.type}
                </div>
                <h2 className="text-3xl font-bold mt-1">{session.title}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditForm(session)}
                  className="w-11 h-11 rounded-2xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
                  title="Modifier"
                >
                  <Edit3 size={18} />
                </button>

                <button
                  onClick={() => deleteSportSession(session.id)}
                  className="w-11 h-11 rounded-2xl bg-[#6a3140] hover:bg-[#7a394a] transition flex items-center justify-center"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>

                <div className="rounded-2xl bg-[#232c52] border border-[#303b6e] px-4 py-3 text-sm text-gray-300">
                  {session.exercises.length} exercices
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {session.exercises.map((exercise) => (
                <div
                  key={`${session.id}-${exercise.name}`}
                  className="bg-[#101735] border border-[#303b6e] rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-xl font-bold">{exercise.name}</div>
                      {exercise.detail && (
                        <div className="text-sm text-gray-400 mt-1">
                          {exercise.detail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl bg-[#232c52] px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-300">
                        {exercise.type === "cardio" ? "Cardio" : "Score"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {getSportMetricLabels(exercise).join(" / ")}
                      </div>
                    </div>
                    <span className="text-[#9de2ba] text-2xl font-bold">
                      {getSportPerformanceLabel(exercise)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function HabitProgressBar({ selectedHabit, habitData }) {
  const targetDays = selectedHabit.targetDays || 90;
  const countdownEnabled = Boolean(selectedHabit.countdownEnabled);
  const countdownShowSeconds = selectedHabit.countdownShowSeconds !== false;
  const [now, setNow] = useState(() => Date.now());
  const creationDate = getDateOnly(new Date(selectedHabit.createdAt));

  const firstCycleDate = new Date(creationDate);
  firstCycleDate.setDate(firstCycleDate.getDate() + 1);

  const today = getDateOnly(new Date());

  const totalDaysSinceStart = Math.max(
    0,
    Math.floor((today - firstCycleDate) / MS_PER_DAY)
  );

  const currentCycleIndex = Math.floor(
    totalDaysSinceStart / targetDays
  );

  const currentCycleStart = new Date(firstCycleDate);
  currentCycleStart.setDate(
    currentCycleStart.getDate() + currentCycleIndex * targetDays
  );

  const currentCycleEnd = new Date(currentCycleStart);
  currentCycleEnd.setDate(currentCycleEnd.getDate() + targetDays);

  useEffect(() => {
    if (!countdownEnabled) {
      return undefined;
    }

    const interval = setInterval(
      () => setNow(Date.now()),
      countdownShowSeconds ? 1000 : 60000
    );

    return () => clearInterval(interval);
  }, [countdownEnabled, countdownShowSeconds]);

  let successCount = 0;

  const currentDate = new Date(currentCycleStart);

  while (currentDate <= today) {
    const key = getDateKey(selectedHabit.id, currentDate);

    if (habitData[key] === "success") {
      successCount++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const progress = Math.min(100, (successCount / targetDays) * 100);
  const countdown = formatCountdown(
    currentCycleEnd.getTime() - now,
    countdownShowSeconds
  );

  return (
    <div className="bg-[#161d38] border border-[#303b6e] rounded-3xl p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="text-lg font-semibold">Goal Progress</div>
        <div className="text-sm text-gray-300">
          {successCount} / {targetDays} days
        </div>
      </div>

      <div className="w-full h-5 bg-[#232c52] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#5fa37c] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {countdownEnabled && (
        <div className="mt-4 flex items-center justify-center rounded-2xl bg-[#232c52] border border-[#303b6e] px-4 py-3">
          <div className="font-mono text-2xl font-bold text-[#9de2ba] tabular-nums">
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
}

function LastRelapseCounter({ selectedHabit, habitData }) {
  const today = getDateOnly(new Date());

  let lastRelapseDate = null;

  Object.entries(habitData).forEach(([key, value]) => {
    if (value !== "fail") {
      return;
    }

    if (!key.startsWith(`${selectedHabit.id}-`)) {
      return;
    }

    const datePart = key.replace(`${selectedHabit.id}-`, "");
    const relapseDate = getDateOnly(new Date(datePart));

    if (!lastRelapseDate || relapseDate > lastRelapseDate) {
      lastRelapseDate = relapseDate;
    }
  });

  let streakDays;

  if (lastRelapseDate) {
    // On ne compte que les journées complètement terminées après le relapse.
    // Exemple : relapse hier, aujourd'hui vient de commencer => 0.
    streakDays = Math.max(
      0,
      Math.floor((today - lastRelapseDate) / (1000 * 60 * 60 * 24)) - 1
    );
  } else {
    const creationDate = getDateOnly(
      new Date(selectedHabit.createdAt)
    );

    const startDate = new Date(creationDate);
    startDate.setDate(startDate.getDate() + 1);

    streakDays = Math.max(
      0,
      Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
    );
  }

  return (
    <div className="bg-[#161d38] border border-[#303b6e] rounded-3xl p-5 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">
            Days Since Last Relapse
          </div>

          <div className="text-sm text-gray-300 mt-1">
            Current streak
          </div>
        </div>

        <div className="text-5xl font-bold text-[#9de2ba]">
          {streakDays}
        </div>
      </div>
    </div>
  );
}

function HabitCalendar({ selectedHabit, habitData, setHabitData }) {
  const today = getDateOnly(new Date());

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const creationDate = getDateOnly(new Date(selectedHabit.createdAt));
  const startDate = new Date(creationDate);
  startDate.setDate(startDate.getDate() + 1);

  useEffect(() => {
    const currentDay = getDateOnly(new Date());
    const habitCreationDate = getDateOnly(new Date(selectedHabit.createdAt));
    const firstTrackableDay = new Date(habitCreationDate);
    firstTrackableDay.setDate(firstTrackableDay.getDate() + 1);

    const lastCompletedDay = new Date(currentDay);
    lastCompletedDay.setDate(currentDay.getDate() - 1);

    if (lastCompletedDay < firstTrackableDay) {
      return;
    }

    setHabitData((prev) => {
      let hasChanges = false;
      const updated = { ...prev };
      const currentDate = new Date(firstTrackableDay);

      while (currentDate <= lastCompletedDay) {
        const key = getDateKey(selectedHabit.id, currentDate);

        if (!updated[key]) {
          updated[key] = "success";
          hasChanges = true;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (!hasChanges) {
        return prev;
      }

      return updated;
    });
  }, [selectedHabit.id, selectedHabit.createdAt, setHabitData]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const normalizedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const calendarCells = useMemo(() => {
    const cells = [];

    for (let i = 0; i < normalizedFirstDay; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }

    return cells;
  }, [daysInMonth, normalizedFirstDay]);

  function getCalendarKey(day) {
    return getDateKey(selectedHabit.id, getDayDate(currentMonth, day));
  }

  const currentMonthStats = useMemo(() => {
    let success = 0;
    let fail = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const key = getDateKey(selectedHabit.id, getDayDate(currentMonth, day));
      const state = habitData[key];

      if (state === "success") {
        success++;
      }

      if (state === "fail") {
        fail++;
      }
    }

    return {
      success,
      fail,
      total: success + fail,
    };
  }, [habitData, currentMonth, selectedHabit.id, daysInMonth]);

  function toggleDay(day) {
    const key = getCalendarKey(day);

    setHabitData((prev) => {
      const current = prev[key];
      const updated = { ...prev };

      if (current === "success") {
        updated[key] = "fail";
      } else if (current === "fail") {
        delete updated[key];
      } else {
        updated[key] = "success";
      }

      return updated;
    });
  }

  function previousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  return (
    <div className="w-full max-w-[620px] bg-[#161d38] rounded-[32px] p-6 shadow-2xl border border-[#232c52] min-h-[720px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Calendar</h2>
        </div>

        <div className="text-sm text-gray-300">{monthName}</div>
      </div>

      <div className="grid grid-cols-[repeat(7,minmax(40px,68px))] justify-center gap-2 mb-3 text-gray-300 text-center text-sm">
        {weekDays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(7,minmax(40px,68px))] justify-center gap-2">
        {calendarCells.map((day, index) => {
          if (!day) {
            return <div key={index} />;
          }

          const date = getDayDate(currentMonth, day);
          const key = getDateKey(selectedHabit.id, date);
          const state = habitData[key];

          const isBeforeStart = date < startDate;
          const isStartDay = date.getTime() === creationDate.getTime();
          const isToday = date.getTime() === today.getTime();

          let styles = "bg-[#2a3257] border border-[#49538a] text-[#8c96c9]";

          if (isBeforeStart) {
            styles =
              "bg-[#1a1f36] border border-[#2a3154] text-[#4f5888] opacity-50";
          }

          if (!isBeforeStart && state === "success") {
            styles = "bg-[#315843] border border-[#5fa37c] text-[#9de2ba]";
          }

          if (!isBeforeStart && state === "fail") {
            styles = "bg-[#6a3140] border border-[#d16a7f] text-[#ffb0be]";
          }

          return (
            <button
              key={key}
              onClick={() => {
                if (isBeforeStart || isStartDay) {
                  return;
                }

                toggleDay(day);
              }}
              className={`relative aspect-square rounded-xl transition-all duration-200 flex items-center justify-center text-base font-medium ${styles} ${
                isBeforeStart || isStartDay
                  ? "cursor-not-allowed"
                  : "hover:scale-105"
              } ${isToday ? "ring-2 ring-white" : ""}`}
            >
              {!state && !isStartDay && <span>{day}</span>}

              {isStartDay && (
                <Flag className="absolute w-4 h-4 text-[#ffd166]" />
              )}

              {!isBeforeStart && state === "success" && (
                <Check className="absolute w-5 h-5" strokeWidth={3} />
              )}

              {!isBeforeStart && state === "fail" && (
                <X className="absolute w-5 h-5" strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-10 mt-12 text-lg text-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-[#5fa37c]" />
          Win
        </div>

        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-[#d16a7f]" />
          Relapse
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <div className="bg-[#232c52] border border-[#303b6e] rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-[#9de2ba]">
            {currentMonthStats.success}
          </div>
          <div className="text-sm text-gray-300 mt-1">Wins</div>
        </div>

        <div className="bg-[#232c52] border border-[#303b6e] rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-[#ffb0be]">
            {currentMonthStats.fail}
          </div>
          <div className="text-sm text-gray-300 mt-1">Relapses</div>
        </div>

        <div className="bg-[#232c52] border border-[#303b6e] rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-white">
            {currentMonthStats.total}
          </div>
          <div className="text-sm text-gray-300 mt-1">Tracked</div>
        </div>
      </div>

      <div className="mt-auto flex justify-between pt-10">
        <button
          onClick={previousMonth}
          className="w-14 h-14 rounded-full bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
        >
          <ChevronLeft size={28} />
        </button>

        <button
          onClick={nextMonth}
          className="w-14 h-14 rounded-full bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
}

function HabitLifetimeStats({ selectedHabit, habitData }) {
  const [cycleHistoryOpen, setCycleHistoryOpen] = useState(false);
  const today = getDateOnly(new Date());
  const creationDate = getDateOnly(new Date(selectedHabit.createdAt));
  const startDate = new Date(creationDate);
  startDate.setDate(startDate.getDate() + 1);

  const startDateTime = startDate.getTime();
  const todayTime = today.getTime();
  const targetDays = selectedHabit.targetDays || 90;

  const totalStats = (() => {
    let success = 0;
    let fail = 0;

    Object.entries(habitData).forEach(([key, state]) => {
      if (!key.startsWith(`${selectedHabit.id}-`)) {
        return;
      }

      const date = getDateOnly(new Date(key.replace(`${selectedHabit.id}-`, "")));

      if (date.getTime() < startDateTime) {
        return;
      }

      if (state === "success") {
        success++;
      }

      if (state === "fail") {
        fail++;
      }
    });

    return {
      success,
      fail,
      total: success + fail,
    };
  })();

  const cycleHistory = (() => {
    const totalDaysSinceStart = Math.max(
      0,
      Math.floor((todayTime - startDateTime) / MS_PER_DAY)
    );
    const currentCycleIndex = Math.floor(totalDaysSinceStart / targetDays);
    const cycles = Array.from({ length: currentCycleIndex + 1 }, (_, index) => {
      const cycleStart = new Date(startDateTime);
      cycleStart.setDate(cycleStart.getDate() + index * targetDays);

      const cycleEnd = new Date(cycleStart);
      cycleEnd.setDate(cycleEnd.getDate() + targetDays - 1);

      return {
        id: index + 1,
        start: cycleStart,
        end: cycleEnd,
        success: 0,
        fail: 0,
      };
    });

    Object.entries(habitData).forEach(([key, state]) => {
      if (!key.startsWith(`${selectedHabit.id}-`)) {
        return;
      }

      if (state !== "success" && state !== "fail") {
        return;
      }

      const date = getDateOnly(new Date(key.replace(`${selectedHabit.id}-`, "")));

      if (date.getTime() < startDateTime) {
        return;
      }

      const cycleIndex = Math.floor(
        Math.floor((date.getTime() - startDateTime) / MS_PER_DAY) / targetDays
      );
      const cycle = cycles[cycleIndex];

      if (!cycle) {
        return;
      }

      if (state === "success") {
        cycle.success++;
      } else {
        cycle.fail++;
      }
    });

    return cycles.map((cycle) => ({
      ...cycle,
      total: cycle.success + cycle.fail,
    }));
  })();

  return (
    <div className="bg-[#161d38] rounded-[32px] p-6 shadow-2xl border border-[#232c52] mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Lifetime Stats</h2>
        <div className="text-sm text-gray-300">
          {targetDays}-day cycles
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#232c52] border border-[#303b6e] rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-[#9de2ba]">
            {totalStats.success}
          </div>
          <div className="text-sm text-gray-300 mt-1">Wins</div>
        </div>

        <div className="bg-[#232c52] border border-[#303b6e] rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-[#ffb0be]">
            {totalStats.fail}
          </div>
          <div className="text-sm text-gray-300 mt-1">Relapses</div>
        </div>

        <div className="bg-[#232c52] border border-[#303b6e] rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-white">
            {totalStats.total}
          </div>
          <div className="text-sm text-gray-300 mt-1">Tracked</div>
        </div>
      </div>

      <div className="mt-5 bg-[#101735] border border-[#303b6e] rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setCycleHistoryOpen((open) => !open)}
          className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-[#182047] transition"
        >
          <span className="font-semibold">Cycle history</span>
          <ChevronRight
            size={22}
            className={`transition-transform ${
              cycleHistoryOpen ? "rotate-90" : ""
            }`}
          />
        </button>

        {cycleHistoryOpen && (
          <div className="border-t border-[#303b6e] divide-y divide-[#303b6e]">
            {cycleHistory.map((cycle) => (
              <div
                key={cycle.id}
                className="px-4 py-4 grid grid-cols-[1fr_auto] gap-4 items-center"
              >
                <div>
                  <div className="font-semibold">Cycle {cycle.id}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {cycle.start.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {cycle.end.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <span className="text-[#9de2ba] font-semibold">
                    {cycle.success} W
                  </span>
                  <span className="text-[#ffb0be] font-semibold">
                    {cycle.fail} R
                  </span>
                  <span className="text-gray-300 font-semibold">
                    {cycle.total} T
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
