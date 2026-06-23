import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
                onClick={() => setSelectedHabitId(habit.id)}
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
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="w-12 h-12 rounded-2xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center"
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
    <div className="bg-[#161d38] rounded-[32px] p-6 shadow-2xl border border-[#232c52] mt-6">
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
