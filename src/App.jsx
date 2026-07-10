import { useEffect, useMemo, useState } from "react";
import "./flowers/style.css";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  PanelLeft,
  Plus,
  Settings,
  Flag,
  Clock,
  ArrowLeft,
  Square,
  SlidersHorizontal,
  Shield,
  Play,
  Pause,
} from "lucide-react";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MAX_RENDERED_FLOWERS = 1000;

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

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
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

function getHabitStartDate(selectedHabit) {
  const creationDate = getDateOnly(new Date(selectedHabit.createdAt));
  const startDate = new Date(creationDate);
  startDate.setDate(startDate.getDate() + 1);
  return startDate;
}

function getCurrentCycleStats(selectedHabit, habitData) {
  const targetDays = selectedHabit.targetDays || 90;
  const firstCycleDate = getHabitStartDate(selectedHabit);
  const today = getDateOnly(new Date());
  const totalDaysSinceStart = Math.max(
    0,
    Math.floor((today - firstCycleDate) / MS_PER_DAY)
  );
  const currentCycleIndex = Math.floor(totalDaysSinceStart / targetDays);
  const currentCycleStart = new Date(firstCycleDate);
  currentCycleStart.setDate(
    currentCycleStart.getDate() + currentCycleIndex * targetDays
  );

  let successCount = 0;
  const currentDate = new Date(currentCycleStart);

  while (currentDate <= today) {
    const key = getDateKey(selectedHabit.id, currentDate);

    if (habitData[key] === "success") {
      successCount++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    successCount,
    targetDays,
    progress: Math.min(100, (successCount / targetDays) * 100),
  };
}

function getLifetimeStats(selectedHabit, habitData) {
  const startDateTime = getHabitStartDate(selectedHabit).getTime();
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
}

function getSuccessMilestoneFlowers(selectedHabit, habitData, previewEndDate) {
  const startDate = getHabitStartDate(selectedHabit);
  const today = getDateOnly(new Date());
  const endDate = previewEndDate
    ? getDateOnly(previewEndDate)
    : getDateOnly(new Date());
  const todayKey = getDateKey(selectedHabit.id, endDate);

  if (endDate.getTime() === today.getTime() && !habitData[todayKey]) {
    endDate.setDate(endDate.getDate() - 1);
  }

  const flowers = [];
  let consecutiveSuccessDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const key = getDateKey(selectedHabit.id, currentDate);
    const state = habitData[key];

    if (state === "success") {
      consecutiveSuccessDays++;

      if (consecutiveSuccessDays % 5 === 0) {
        let variant = "gold";

        if (consecutiveSuccessDays % 60 === 0) {
          variant = "rose";
        } else if (consecutiveSuccessDays % 30 === 0) {
          variant = "purple";
        } else if (consecutiveSuccessDays % 10 === 0) {
          variant = "blue";
        }

        flowers.push(variant);
      }
    } else if (state === "fail") {
      consecutiveSuccessDays = 0;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return flowers;
}

function buildAdminFullSuccessScenario(baseHabit, daysPassed) {
  const totalDays = Math.max(1, Number(daysPassed) || 1);
  const today = getDateOnly(new Date());
  const startDate = addDays(today, -(totalDays - 1));
  const createdAt = addDays(startDate, -1).getTime();
  const habit = {
    ...baseHabit,
    createdAt,
  };
  const data = {};
  const currentDate = new Date(startDate);

  while (currentDate <= today) {
    data[getDateKey(habit.id, currentDate)] = "success";
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    habit,
    habitData: data,
    startDate,
  };
}

export default function HabitTrackerApp() {
  const today = new Date();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [canvasMode, setCanvasMode] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [exportJson, setExportJson] = useState("");

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

  if (canvasMode && selectedHabit) {
    return (
      <HabitCanvas
        selectedHabit={selectedHabit}
        habitData={habitData}
        onBack={() => setCanvasMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-white flex p-6 gap-6">
      <aside
        className={`${sidebarOpen ? "w-72" : "w-20"} transition-all duration-300 bg-[#161d38] border border-[#232c52] rounded-[32px] p-4 flex flex-col shadow-2xl`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mb-6 w-12 h-12 rounded-2xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
        >
          <PanelLeft />
        </button>

        <div className="flex flex-col gap-3">
          {habits.map((habit) => {
            const selected = selectedHabit?.id === habit.id;

            return (
              <button
                key={habit.id}
                onClick={() => {
                  setSelectedHabitId(habit.id);
                  setCanvasMode(false);
                }}
                className={`rounded-2xl px-4 py-4 text-left transition-all duration-200 border cursor-pointer hover:scale-[1.02] ${
                  selected
                    ? "bg-[#315843] border-[#5fa37c]"
                    : "bg-[#232c52] border-[#303b6e] hover:bg-[#2f3b70]"
                }`}
              >
                {sidebarOpen ? habit.name : habit.name.charAt(0)}
              </button>
            );
          })}

          {isAddingHabit ? (
            <div className="bg-[#232c52] border border-[#4d5a8f] rounded-2xl p-3 flex flex-col gap-3">
              <input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addHabit();
                  }
                }}
                autoFocus
                placeholder="Habit name"
                className="bg-[#161d38] border border-[#4d5a8f] rounded-xl px-3 py-3 outline-none text-white"
              />

              <div className="flex gap-2">
                <button
                  onClick={addHabit}
                  className="flex-1 bg-[#315843] hover:bg-[#3d6b51] transition rounded-xl py-2"
                >
                  Create
                </button>

                <button
                  onClick={() => {
                    setIsAddingHabit(false);
                    setNewHabitName("");
                  }}
                  className="flex-1 bg-[#6a3140] hover:bg-[#7a394a] transition rounded-xl py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingHabit(true)}
              className="rounded-2xl px-4 py-4 bg-[#242d56] border border-[#4d5a8f] hover:bg-[#2d3769] transition flex items-center justify-center gap-2"
            >
              <Plus />
              {sidebarOpen && <span>Add Habit</span>}
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {selectedHabit ? (
            <>
              <div className="mb-6 flex justify-end gap-3">
                <button
                  onClick={() => setCanvasMode(true)}
                  className="w-12 h-12 rounded-2xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
                  title="Canvas mode"
                >
                  <Square size={20} />
                </button>

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
                  <div className="text-lg font-semibold mb-4">
                    Habit Settings
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

              <HabitCalendar
                selectedHabit={selectedHabit}
                habitData={habitData}
                setHabitData={setHabitData}
              />
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
      </main>
    </div>
  );
}

function HabitProgressBar({ selectedHabit, habitData }) {
  const countdownEnabled = Boolean(selectedHabit.countdownEnabled);
  const countdownShowSeconds = selectedHabit.countdownShowSeconds !== false;
  const [now, setNow] = useState(() => Date.now());
  const { successCount, targetDays, progress } = getCurrentCycleStats(
    selectedHabit,
    habitData
  );
  const currentCycleEnd = getHabitStartDate(selectedHabit);
  const totalDaysSinceStart = Math.max(
    0,
    Math.floor((getDateOnly(new Date()) - currentCycleEnd) / MS_PER_DAY)
  );
  const currentCycleIndex = Math.floor(totalDaysSinceStart / targetDays);
  currentCycleEnd.setDate(
    currentCycleEnd.getDate() + (currentCycleIndex + 1) * targetDays
  );

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

function HabitCanvas({ selectedHabit, habitData, onBack }) {
  const [adminMode, setAdminMode] = useState(false);
  const [adminDays, setAdminDays] = useState(100);
  const adminScenario = buildAdminFullSuccessScenario(selectedHabit, adminDays);
  const canvasHabit = adminMode ? adminScenario.habit : selectedHabit;
  const canvasHabitData = adminMode ? adminScenario.habitData : habitData;
  const lifetimeStats = getLifetimeStats(canvasHabit, canvasHabitData);
  const cycleStats = getCurrentCycleStats(canvasHabit, canvasHabitData);
  const timelineStartDate = getHabitStartDate(canvasHabit);
  const timelineToday = getDateOnly(new Date());
  const maxTimelineDay = Math.max(
    0,
    Math.floor((timelineToday - timelineStartDate) / MS_PER_DAY)
  );
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [previewDay, setPreviewDay] = useState(maxTimelineDay);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [previewSpeed, setPreviewSpeed] = useState(1);
  const activePreviewDay = Math.min(previewDay, maxTimelineDay);
  const previewDate = addDays(timelineStartDate, activePreviewDay);
  const flowers = getSuccessMilestoneFlowers(
    canvasHabit,
    canvasHabitData,
    previewDate
  );

  useEffect(() => {
    if (!timelinePlaying || activePreviewDay >= maxTimelineDay) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setPreviewDay((day) => {
        const nextDay = Math.min(maxTimelineDay, day + previewSpeed);

        if (nextDay >= maxTimelineDay) {
          setTimelinePlaying(false);
        }

        return nextDay;
      });
    }, 320);

    return () => clearTimeout(timeout);
  }, [timelinePlaying, activePreviewDay, maxTimelineDay, previewSpeed]);

  function startTimelinePlayback() {
    if (activePreviewDay < maxTimelineDay) {
      setTimelinePlaying(true);
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <FlowerEnvironment flowers={flowers} />

      <button
        onClick={onBack}
        className="absolute left-6 top-6 z-10 w-12 h-12 border border-[#303030] bg-[#080808] hover:bg-[#161616] transition flex items-center justify-center"
        title="Back"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="absolute right-6 top-6 z-10 max-w-[calc(100vw-120px)]">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="text-[11px] uppercase tracking-wide text-white/45">
              Wins
            </span>
            <span className="text-xl font-bold text-[#9de2ba]">
              {lifetimeStats.success}
            </span>
          </div>

          <div className="h-7 w-px bg-white/10" />

          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="text-[11px] uppercase tracking-wide text-white/45">
              Relapses
            </span>
            <span className="text-xl font-bold text-[#ff9dac]">
              {lifetimeStats.fail}
            </span>
          </div>

          <div className="h-7 w-px bg-white/10" />

          <div className="relative h-8 w-56 overflow-hidden rounded-full border border-white/10 bg-white/[0.08]">
            <div
              className="absolute inset-y-0 left-0 bg-[#5fa37c]"
              style={{ width: `${cycleStats.progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center px-3 text-sm font-semibold text-white drop-shadow">
              {cycleStats.successCount} / {cycleStats.targetDays} days
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-6 top-24 z-10 w-64 rounded-2xl border border-white/10 bg-black/55 p-4 shadow-2xl backdrop-blur-md">
        <label className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-white/85">
            <Shield size={16} />
            Admin mode
          </span>
          <input
            type="checkbox"
            checked={adminMode}
            onChange={(event) => {
              setAdminMode(event.target.checked);
              setPreviewDay(
                event.target.checked ? Math.max(0, adminDays - 1) : maxTimelineDay
              );
              setTimelinePlaying(false);
            }}
            className="h-5 w-5 accent-[#9de2ba]"
          />
        </label>

        {adminMode && (
          <div className="mt-4">
            <label className="text-xs uppercase tracking-wide text-white/45">
              Full success days
            </label>
            <input
              type="number"
              min="1"
              value={adminDays}
              onChange={(event) => {
                const nextAdminDays = Math.max(
                  1,
                  Number(event.target.value) || 1
                );
                setAdminDays(nextAdminDays);
                setPreviewDay(Math.max(0, nextAdminDays - 1));
                setTimelinePlaying(false);
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-white outline-none focus:border-[#9de2ba]"
            />
            <div className="mt-2 text-xs text-white/45">
              {adminScenario.startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              to today
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setTimelineOpen((open) => !open)}
        className="absolute bottom-6 left-6 z-10 w-12 h-12 border border-white/10 bg-black/55 hover:bg-white/10 transition flex items-center justify-center backdrop-blur-md"
        title="Timeline"
      >
        <SlidersHorizontal size={22} />
      </button>

      {timelineOpen && (
        <div className="absolute bottom-6 left-24 right-6 z-10 rounded-2xl border border-white/10 bg-black/55 px-5 py-4 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-white/85">
              {previewDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              onClick={() => {
                if (activePreviewDay >= maxTimelineDay) {
                  setPreviewDay(0);
                  setTimelinePlaying(true);
                  return;
                }

                setTimelinePlaying((playing) => !playing);
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10"
            >
              {timelinePlaying ? <Pause size={14} /> : <Play size={14} />}
              {timelinePlaying ? "Pause" : "Play"}
            </button>
          </div>

          <div className="mb-3 flex items-center justify-end gap-2">
            {[1, 5, 20, 100].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setPreviewSpeed(speed)}
                className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                  previewSpeed === speed
                    ? "border-[#9de2ba] bg-[#9de2ba] text-black"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/10"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max={maxTimelineDay}
            value={activePreviewDay}
            onChange={(event) => {
              setTimelinePlaying(false);
              setPreviewDay(Number(event.target.value));
            }}
            onPointerUp={startTimelinePlayback}
            onMouseUp={startTimelinePlayback}
            onTouchEnd={startTimelinePlayback}
            className="w-full accent-[#9de2ba]"
          />
        </div>
      )}
    </div>
  );
}

function FlowerEnvironment({ flowers }) {
  const visibleFlowers = getVisibleFlowers(flowers);
  const denseScene = flowers.length > 30;
  const heavyScene = flowers.length > 80;
  const gardenScale = getGardenScale(flowers.length);
  const layoutFlowerCount = Math.min(flowers.length, MAX_RENDERED_FLOWERS);

  return (
    <div
      className={`flower-canvas absolute inset-0 ${
        denseScene ? "flower-canvas-dense" : ""
      } ${heavyScene ? "flower-canvas-heavy" : ""}`}
    >
      <div
        className="ground"
        style={{
          transform: `scale(${gardenScale})`,
        }}
      >
        {visibleFlowers.map((flower) => (
          <div
            key={flower.sourceIndex}
            className={`flower-container flower-${flower.variant} animate`}
            style={getFlowerLayoutStyle(
              flower.sourceIndex,
              layoutFlowerCount,
              flower.variant
            )}
          >
            <Flower />
          </div>
        ))}
      </div>
    </div>
  );
}

function getVisibleFlowers(flowers) {
  return flowers
    .slice(0, MAX_RENDERED_FLOWERS)
    .map((variant, sourceIndex) => ({
      variant,
      sourceIndex,
    }));
}

function getGardenScale(flowerCount) {
  if (flowerCount <= 48) {
    return 1;
  }

  if (flowerCount <= 160) {
    const pressure = (flowerCount - 48) / 112;
    return 1 - pressure * 0.2;
  }

  if (flowerCount <= 520) {
    const pressure = (flowerCount - 160) / 360;
    return 0.8 - pressure * 0.18;
  }

  const pressure = Math.min(1, (flowerCount - 520) / 520);
  return 0.62 - pressure * 0.1;
}

function getFlowerLayoutStyle(sourceIndex, totalFlowers, variant) {
  const depthCount = 4;
  const depth = sourceIndex % depthCount;
  const layerIndex = Math.floor(sourceIndex / depthCount);
  const seed = (sourceIndex * 9301 + 49297) % 233280;
  const golden = 0.61803398875;
  const xUnit = (layerIndex * golden + depth * 0.19) % 1;
  const sideBias = layerIndex % 6 === 0 ? 0.04 : layerIndex % 6 === 3 ? -0.04 : 0;
  const left = 3 + xUnit * 94 + sideBias * 100;
  const stack = Math.floor(layerIndex / 18);
  const depthBand = Math.floor(layerIndex / 6) % depthCount;
  const jitterX = ((seed % 100) / 100 - 0.5) * 1.4;
  const jitterY = (((seed * 17) % 100) / 100 - 0.5) * 2.4;
  const topByDepth = [52, 82, 113, 146];
  const widthByDepth = [4.8, 5.8, 6.8, 7.8];
  const opacityByDepth = [0.56, 0.72, 0.88, 1];
  const glowByDepth = [4, 6, 8, 10];
  const top = topByDepth[(depth + depthBand) % depthCount] - stack * 9.5 + jitterY;
  const width = widthByDepth[depth] * (0.88 + ((seed % 7) * 0.04));
  const denseGlowScale = totalFlowers > 60 ? 0.18 : totalFlowers > 30 ? 0.45 : 1;
  const glowColor = variant === "blue" ? "#66ccff88" : "#ffd85f88";

  return {
    left: `${Math.max(1, Math.min(99, left + jitterX))}%`,
    top: `${top}%`,
    width: `${width}%`,
    zIndex: depth * 1000 + layerIndex,
    opacity: opacityByDepth[depth],
    filter: `drop-shadow(0 0 ${
      glowByDepth[depth] * denseGlowScale
    }cqi ${glowColor})`,
  };
}

function Flower() {
  return (
    <>
      <div className="flower-top">
        <div className="flower-petal flower-petal__1" />
        <div className="flower-petal flower-petal__2" />
        <div className="flower-petal flower-petal__3" />
        <div className="flower-petal flower-petal__4" />
        <div className="flower-petal flower-petal__5" />
        <div className="flower-petal flower-petal__6" />
        <div className="flower-petal flower-petal__7" />
        <div className="flower-petal flower-petal__8" />
        <div className="flower-circle" />
        <div className="flower-light flower-light__1" />
        <div className="flower-light flower-light__2" />
        <div className="flower-light flower-light__3" />
        <div className="flower-light flower-light__4" />
        <div className="flower-light flower-light__5" />
        <div className="flower-light flower-light__6" />
        <div className="flower-light flower-light__7" />
        <div className="flower-light flower-light__8" />
      </div>

      <div className="flower-bottom">
        <div className="flower-stem" />
        <div className="flower-leaf flower-leaf__1" />
        <div className="flower-leaf flower-leaf__2" />
        <div className="flower-leaf flower-leaf__3" />
        <div className="flower-leaf flower-leaf__4" />
        <div className="flower-leaf flower-leaf__5" />
        <div className="flower-leaf flower-leaf__6" />
        <div className="flower-grass flower-grass__1" />
        <div className="flower-grass flower-grass__2" />
        <div className="flower-grass flower-grass__3" />
        <div className="flower-grass flower-grass__4" />
      </div>
    </>
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
    <div className="bg-[#161d38] rounded-[32px] p-6 shadow-2xl border border-[#232c52] min-h-[720px] flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">
            {selectedHabit.name}
          </h1>
        </div>

        <div className="text-lg text-gray-300 mt-3">{monthName}</div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-3 text-gray-300 text-center text-lg">
        {weekDays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
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
              className={`relative aspect-square rounded-2xl transition-all duration-200 flex items-center justify-center text-xl font-medium ${styles} ${
                isBeforeStart || isStartDay
                  ? "cursor-not-allowed"
                  : "hover:scale-105"
              } ${isToday ? "ring-2 ring-white" : ""}`}
            >
              {!state && !isStartDay && <span>{day}</span>}

              {isStartDay && (
                <Flag className="absolute w-6 h-6 text-[#ffd166]" />
              )}

              {!isBeforeStart && state === "success" && (
                <Check className="absolute w-7 h-7" strokeWidth={3} />
              )}

              {!isBeforeStart && state === "fail" && (
                <X className="absolute w-7 h-7" strokeWidth={3} />
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
    <div className="bg-[#161d38] rounded-[32px] p-6 shadow-2xl border border-[#232c52] mt-6 mb-6">
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
