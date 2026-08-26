import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bitcoin,
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
  Landmark,
  Link2,
  Clock,
  MapPin,
  LayoutDashboard,
  ListChecks,
  Moon,
  Palette,
  Sun,
  Trash2,
  Trophy,
  Wallet,
  WalletCards,
} from "lucide-react";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const ALL_WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0];
const WEEK_DAY_OPTIONS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
];

const MAIN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "habits", label: "Habitudes", icon: ListChecks },
  { id: "sport", label: "Sport", icon: Dumbbell },
  { id: "finance", label: "Finance", icon: WalletCards },
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

function getHabitActiveDays(habit) {
  return Array.isArray(habit.activeWeekDays) && habit.activeWeekDays.length > 0
    ? habit.activeWeekDays
    : ALL_WEEK_DAYS;
}

function isHabitDayActive(habit, date) {
  return getHabitActiveDays(habit).includes(date.getDay());
}

function getHabitBestStreak(habit, habitData, referenceDate = new Date()) {
  const today = getDateOnly(referenceDate);
  const creationDate = getDateOnly(new Date(habit.createdAt));
  const currentDate = new Date(creationDate);
  currentDate.setDate(currentDate.getDate() + 1);

  let currentStreak = 0;
  let bestStreak = 0;

  while (currentDate <= today) {
    if (!isHabitDayActive(habit, currentDate)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const key = getDateKey(habit.id, currentDate);

    if (habitData[key] === "success") {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return bestStreak;
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
        activeWeekDays: [...ALL_WEEK_DAYS],
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

  const [agendaEvents, setAgendaEvents] = useState(() => {
    const saved = localStorage.getItem("agenda-events");
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
    localStorage.setItem("agenda-events", JSON.stringify(agendaEvents));
  }, [agendaEvents]);

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
      activeWeekDays: [...ALL_WEEK_DAYS],
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
      agendaEvents,
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
        setAgendaEvents(parsed.agendaEvents || []);

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
                const streakDays = getHabitBestStreak(habit, habitData, today);

                return (
                  <button
                    key={habit.id}
                    onClick={() => setSelectedHabitId(habit.id)}
                    className={`mr-1 shrink-0 rounded-2xl px-4 py-4 text-left transition-all duration-200 border cursor-pointer origin-left hover:scale-[1.015] ${
                      selected
                        ? "bg-[#294a3b] border-[#5fa37c]"
                        : "bg-[#232c52] border-[#303b6e] hover:bg-[#2f3b70]"
                    }`}
                    title={`${habit.name} · record de ${streakDays} jour${
                      streakDays === 1 ? "" : "s"
                    } consécutif${streakDays === 1 ? "" : "s"}`}
                  >
                    {sidebarOpen ? (
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate">{habit.name}</span>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${
                            selected
                              ? "bg-[#315843] border-[#5fa37c] text-[#9de2ba]"
                              : "bg-[#161d38] border-[#303b6e] text-gray-300"
                          }`}
                          aria-label={`Record de ${streakDays} jour${
                            streakDays === 1 ? "" : "s"
                          } consécutif${streakDays === 1 ? "" : "s"}`}
                        >
                          {streakDays} j
                        </span>
                      </span>
                    ) : (
                      habit.name.charAt(0)
                    )}
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

        {activeView === "agenda" && (
          <AgendaView events={agendaEvents} setEvents={setAgendaEvents} />
        )}

        {activeView === "finance" && <FinanceView />}
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

function replaceCoinbaseSources(sources, source, data) {
  const previousGroupId = source.exchangeSessionId;
  const remainingSources = sources.filter((item) =>
    item.id !== source.id && (!previousGroupId || item.exchangeSessionId !== previousGroupId)
  );
  const exchangeSessionId = `coinbase-${Date.now()}`;
  const coinbaseSources = data.accounts.map((account, index) => ({
    ...source,
    id: index === 0 ? source.id : `${source.id}-${account.accountId}`,
    accountName: account.name,
    exchangeAccountId: account.accountId,
    exchangeSessionId,
    assetAmount: account.assetAmount,
    assetCurrency: account.assetCurrency,
    balance: account.euroValue,
    currency: "EUR",
    connectionStatus: "connected",
    lastSyncAt: data.syncedAt,
  }));
  return [...remainingSources, ...coinbaseSources];
}

function replaceEthereumSources(sources, source, data) {
  const previousGroupId = source.walletSessionId;
  const remainingSources = sources.filter((item) =>
    item.id !== source.id && (!previousGroupId || item.walletSessionId !== previousGroupId)
  );
  const walletSessionId = `ethereum-${source.walletAddress.toLowerCase()}`;
  const addressLabel = `${source.walletAddress.slice(0, 6)}…${source.walletAddress.slice(-4)}`;
  const walletSources = data.accounts.map((account, index) => ({
    ...source,
    id: index === 0 ? source.id : `${source.id}-${account.accountId}`,
    accountName: `${account.name} · ${addressLabel}`,
    walletAccountId: account.accountId,
    walletSessionId,
    assetNetworkId: account.networkId,
    assetNetworkName: account.networkName,
    assetAmount: account.assetAmount,
    assetCurrency: account.assetCurrency,
    balance: account.euroValue,
    currency: "EUR",
    connectionStatus: "connected",
    lastSyncAt: data.syncedAt,
  }));
  return [...remainingSources, ...walletSources];
}

function replaceAptosSources(sources, source, data) {
  const previousGroupId = source.walletSessionId;
  const remainingSources = sources.filter((item) =>
    item.id !== source.id && (!previousGroupId || item.walletSessionId !== previousGroupId)
  );
  const walletSessionId = `aptos-${source.walletAddress.toLowerCase()}`;
  const addressLabel = `${source.walletAddress.slice(0, 6)}…${source.walletAddress.slice(-4)}`;
  const walletSources = data.accounts.map((account, index) => ({
    ...source,
    id: index === 0 ? source.id : `${source.id}-${account.accountId}`,
    accountName: `${account.name} · ${addressLabel}`,
    walletAccountId: account.accountId,
    walletSessionId,
    assetNetworkId: account.networkId,
    assetNetworkName: account.networkName,
    assetAmount: account.assetAmount,
    assetCurrency: account.assetCurrency,
    balance: account.euroValue,
    currency: "EUR",
    connectionStatus: "connected",
    lastSyncAt: data.syncedAt,
  }));
  return [...remainingSources, ...walletSources];
}

function replaceBitcoinSources(sources, source, data) {
  const previousGroupId = source.walletSessionId;
  const remainingSources = sources.filter((item) =>
    item.id !== source.id && (!previousGroupId || item.walletSessionId !== previousGroupId)
  );
  const walletSessionId = `bitcoin-${source.walletAddress.toLowerCase()}`;
  const addressLabel = `${source.walletAddress.slice(0, 6)}…${source.walletAddress.slice(-4)}`;
  const walletSources = data.accounts.map((account, index) => ({
    ...source,
    id: index === 0 ? source.id : `${source.id}-${account.accountId}`,
    accountName: `${account.name} · ${addressLabel}`,
    walletAccountId: account.accountId,
    walletSessionId,
    assetNetworkId: account.networkId,
    assetNetworkName: account.networkName,
    assetAmount: account.assetAmount,
    assetCurrency: account.assetCurrency,
    balance: account.euroValue,
    currency: "EUR",
    connectionStatus: "connected",
    lastSyncAt: data.syncedAt,
  }));
  return [...remainingSources, ...walletSources];
}

function replaceSolanaSources(sources, source, data) {
  const previousGroupId = source.walletSessionId;
  const remainingSources = sources.filter((item) =>
    item.id !== source.id && (!previousGroupId || item.walletSessionId !== previousGroupId)
  );
  const walletSessionId = `solana-${source.walletAddress}`;
  const addressLabel = `${source.walletAddress.slice(0, 6)}…${source.walletAddress.slice(-4)}`;
  const walletSources = data.accounts.map((account, index) => ({
    ...source,
    id: index === 0 ? source.id : `${source.id}-${account.accountId}`,
    accountName: `${account.name} · ${addressLabel}`,
    walletAccountId: account.accountId,
    walletSessionId,
    assetNetworkId: account.networkId,
    assetNetworkName: account.networkName,
    assetAmount: account.assetAmount,
    assetCurrency: account.assetCurrency,
    balance: account.euroValue,
    currency: "EUR",
    connectionStatus: "connected",
    lastSyncAt: data.syncedAt,
  }));
  return [...remainingSources, ...walletSources];
}

function replaceBankSources(sources, source, data) {
  const existingGroup = sources.filter((item) => item.bankSessionId === data.sessionId);
  const remainingSources = sources.filter((item) => item.bankSessionId !== data.sessionId);
  const bankSources = data.accounts.map((account, index) => {
    const existing = existingGroup.find((item) => item.bankAccountId === account.accountId) || source;
    return {
      ...existing,
      id: existing.bankAccountId === account.accountId ? existing.id : `${source.id}-${account.accountId || index}`,
      accountName: account.name || existing.accountName,
      lastFour: account.iban?.slice(-4) || existing.lastFour,
      balance: account.balance,
      currency: account.currency,
      accountTypeCode: account.accountTypeCode,
      bankAccountId: account.accountId,
      bankSessionId: data.sessionId,
      connectionStatus: "connected",
      lastSyncAt: data.syncedAt,
    };
  });
  return [...remainingSources, ...bankSources];
}

function readStoredFinanceSources() {
  try {
    const saved = localStorage.getItem("finance-sources");
    if (!saved) return [];
    return JSON.parse(saved).filter((source) => !(
      source.category === "wallet" && (source.bankSessionId || source.bankAccountId)
    ));
  } catch {
    return [];
  }
}

const AGENDA_COLORS = {
  personnel: { label: "Personnel", dot: "bg-[#8b7cf6]", pill: "bg-[#342d65] text-[#c9c1ff]" },
  travail: { label: "Travail", dot: "bg-[#5fa37c]", pill: "bg-[#294a3b] text-[#9de2ba]" },
  sport: { label: "Sport", dot: "bg-[#e0a85b]", pill: "bg-[#5a4028] text-[#ffd79d]" },
  islam: { label: "Islam", dot: "bg-[#38bdf8]", pill: "bg-[#173b52] text-[#9bddff]" },
};

function agendaDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function AgendaView({ events, setEvents }) {
  const today = getDateOnly(new Date());
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(agendaDateKey(today));
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("personnel");

  const firstDayOffset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const sortedEvents = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const selectedEvents = sortedEvents.filter((event) => event.date === selectedDate);
  const selectedDateObject = new Date(`${selectedDate}T12:00:00`);

  function openNewEvent(date = selectedDate) {
    setSelectedDate(date);
    setTitle("");
    setTime("09:00");
    setLocation("");
    setCategory("personnel");
    setFormOpen(true);
  }

  function addEvent(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setEvents((current) => [...current, {
      id: Date.now(),
      title: title.trim(),
      date: selectedDate,
      time,
      location: location.trim(),
      category,
    }]);
    setFormOpen(false);
  }

  return (
    <div className="min-h-full pb-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#9de2ba]">Organisation</div>
          <h1 className="text-4xl font-bold">Mon agenda</h1>
          <p className="mt-2 text-gray-400">Planifiez vos rendez-vous et gardez votre semaine en vue.</p>
        </div>
        <button onClick={() => openNewEvent()} className="flex items-center gap-2 rounded-2xl bg-[#315843] px-5 py-3 font-semibold text-white transition hover:bg-[#3d6b51]">
          <Plus size={20} /> Nouvel événement
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[32px] border border-[#232c52] bg-[#161d38] p-5 shadow-2xl sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#232c52] transition hover:bg-[#303b6e]" aria-label="Mois précédent"><ChevronLeft /></button>
            <div className="text-center">
              <h2 className="text-2xl font-bold capitalize">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2>
              <button onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(agendaDateKey(today)); }} className="mt-1 text-sm font-semibold text-[#9de2ba]">Aujourd'hui</button>
            </div>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#232c52] transition hover:bg-[#303b6e]" aria-label="Mois suivant"><ChevronRight /></button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => <div key={day} className="pb-2 text-center text-xs font-bold uppercase tracking-wider text-gray-400">{day}</div>)}
            {cells.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="min-h-20 rounded-2xl bg-[#101735]/40 sm:min-h-28" />;
              const key = agendaDateKey(date);
              const dayEvents = sortedEvents.filter((event) => event.date === key);
              const selected = key === selectedDate;
              const isToday = key === agendaDateKey(today);
              return (
                <button key={key} onClick={() => setSelectedDate(key)} onDoubleClick={() => openNewEvent(key)} className={`min-h-20 rounded-2xl border p-2 text-left align-top transition sm:min-h-28 sm:p-3 ${selected ? "border-[#5fa37c] bg-[#294a3b]" : "border-[#303b6e] bg-[#101735] hover:bg-[#232c52]"}`}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-[#5fa37c] text-white" : ""}`}>{date.getDate()}</span>
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => <div key={event.id} className="flex items-center gap-1.5 truncate text-[11px] text-gray-300"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${AGENDA_COLORS[event.category]?.dot}`} /><span className="truncate">{event.time} {event.title}</span></div>)}
                    {dayEvents.length > 2 && <div className="text-[11px] text-gray-400">+ {dayEvents.length - 2} autre{dayEvents.length > 3 ? "s" : ""}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-[32px] border border-[#232c52] bg-[#161d38] p-6 shadow-2xl">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div><div className="text-sm capitalize text-gray-400">{selectedDateObject.toLocaleDateString("fr-FR", { weekday: "long" })}</div><h2 className="text-2xl font-bold capitalize">{selectedDateObject.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</h2></div>
            <button onClick={() => openNewEvent()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#232c52] hover:bg-[#303b6e]" aria-label="Ajouter"><Plus size={19} /></button>
          </div>
          <div className="space-y-3">
            {selectedEvents.length === 0 && <div className="rounded-2xl border border-dashed border-[#303b6e] px-4 py-10 text-center"><CalendarDays className="mx-auto mb-3 text-gray-400" /><p className="font-semibold">Journée libre</p><p className="mt-1 text-sm text-gray-400">Ajoutez votre premier événement.</p></div>}
            {selectedEvents.map((event) => (
              <article key={event.id} className="group rounded-2xl border border-[#303b6e] bg-[#101735] p-4">
                <div className="flex items-start gap-3"><span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${AGENDA_COLORS[event.category]?.dot}`} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{event.title}</h3><button onClick={() => setEvents((current) => current.filter((item) => item.id !== event.id))} className="text-gray-400 opacity-0 transition hover:text-[#ffb0be] group-hover:opacity-100" aria-label="Supprimer"><Trash2 size={17} /></button></div><div className="mt-2 flex items-center gap-2 text-sm text-gray-400"><Clock size={15} /> {event.time}</div>{event.location && <div className="mt-1 flex items-center gap-2 text-sm text-gray-400"><MapPin size={15} /> <span className="truncate">{event.location}</span></div>}<span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${AGENDA_COLORS[event.category]?.pill}`}>{AGENDA_COLORS[event.category]?.label}</span></div></div>
              </article>
            ))}
          </div>
        </aside>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setFormOpen(false)}>
          <form onSubmit={addEvent} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-[28px] border border-[#303b6e] bg-[#161d38] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold">Nouvel événement</h2><p className="mt-1 text-sm text-gray-400">{selectedDateObject.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl p-2 text-gray-400 hover:bg-[#232c52] hover:text-white"><X /></button></div>
            <label className="mb-4 block"><span className="mb-2 block text-sm font-semibold text-gray-300">Titre</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Rendez-vous médecin" className="w-full rounded-2xl border border-[#303b6e] bg-[#101735] px-4 py-3 outline-none focus:border-[#5fa37c]" /></label>
            <div className="mb-4 grid grid-cols-2 gap-3"><label><span className="mb-2 block text-sm font-semibold text-gray-300">Date</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded-2xl border border-[#303b6e] bg-[#101735] px-4 py-3 outline-none focus:border-[#5fa37c]" /></label><label><span className="mb-2 block text-sm font-semibold text-gray-300">Heure</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-full rounded-2xl border border-[#303b6e] bg-[#101735] px-4 py-3 outline-none focus:border-[#5fa37c]" /></label></div>
            <label className="mb-4 block"><span className="mb-2 block text-sm font-semibold text-gray-300">Lieu <span className="font-normal text-gray-400">(facultatif)</span></span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ex. Cabinet, visioconférence…" className="w-full rounded-2xl border border-[#303b6e] bg-[#101735] px-4 py-3 outline-none focus:border-[#5fa37c]" /></label>
            <label className="mb-6 block"><span className="mb-2 block text-sm font-semibold text-gray-300">Catégorie</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-2xl border border-[#303b6e] bg-[#101735] px-4 py-3 outline-none focus:border-[#5fa37c]">{Object.entries(AGENDA_COLORS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
            <button type="submit" className="w-full rounded-2xl bg-[#315843] px-5 py-3 font-semibold transition hover:bg-[#3d6b51]">Ajouter à l'agenda</button>
          </form>
        </div>
      )}
    </div>
  );
}

function FinanceView() {
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [accountSetupOpen, setAccountSetupOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [phantomSetupOpen, setPhantomSetupOpen] = useState(false);
  const [metamaskSetupOpen, setMetamaskSetupOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [connectingSourceId, setConnectingSourceId] = useState(null);
  const [bankError, setBankError] = useState("");
  const autoSyncStarted = useRef(false);
  const automaticAssetsSyncStarted = useRef(false);
  const syncBankSourceRef = useRef(null);
  const connectFinanceSourceRef = useRef(null);
  const [financeSources, setFinanceSources] = useState(readStoredFinanceSources);

  useEffect(() => {
    localStorage.setItem("finance-sources", JSON.stringify(financeSources));
  }, [financeSources]);

  useEffect(() => {
    syncBankSourceRef.current = syncBankSource;
    connectFinanceSourceRef.current = connectFinanceSource;
  });

  useEffect(() => {
    if (automaticAssetsSyncStarted.current) return;
    const staleAfter = 15 * 60 * 1000;
    const isStale = (source) =>
      Date.now() - new Date(source.lastSyncAt || 0).getTime() >= staleAfter;

    const bankSources = new Map();
    const walletSources = new Map();
    financeSources.forEach((source) => {
      if (
        source.category === "bank" &&
        source.bankSessionId &&
        source.connectionStatus === "connected" &&
        isStale(source)
      ) {
        bankSources.set(source.bankSessionId, source);
      }
      if (source.category === "wallet" && source.walletAddress && isStale(source)) {
        const key = `${source.walletScannerId || source.networkId}-${source.walletAddress}`;
        if (!walletSources.has(key)) walletSources.set(key, source);
      }
    });
    if (!bankSources.size && !walletSources.size) return;

    automaticAssetsSyncStarted.current = true;
    void (async () => {
      for (const source of bankSources.values()) await syncBankSourceRef.current(source);
      for (const source of walletSources.values()) await connectFinanceSourceRef.current(source);
    })();
  }, [financeSources]);

  useEffect(() => {
    if (autoSyncStarted.current) return;
    const coinbaseSource = financeSources.find(
      (source) => source.exchangeId === "coinbase" && source.connectionStatus === "connected"
    );
    if (!coinbaseSource) return;

    const lastSyncTime = new Date(coinbaseSource.lastSyncAt || 0).getTime();
    if (Date.now() - lastSyncTime < 15 * 60 * 1000) return;

    autoSyncStarted.current = true;
    fetch("/api/coinbase/sync", { method: "POST" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Synchronisation Coinbase impossible");
        if (!data.accounts?.length) throw new Error("Aucun actif avec un solde disponible n’a été trouvé sur Coinbase");
        return data;
      })
      .then((data) => {
        setBankError("");
        setFinanceSources((sources) => replaceCoinbaseSources(sources, coinbaseSource, data));
      })
      .catch((error) => setBankError(error.message))
      .finally(() => setConnectingSourceId(null));
  }, [financeSources]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    const state = query.get("state");

    if (window.location.pathname !== "/bank-callback" || !code || !state) {
      return;
    }

    // Le code OAuth est à usage unique. Nettoyer l'URL immédiatement empêche
    // React StrictMode de traiter deux fois le même retour en développement.
    window.history.replaceState({}, "", "/");

    fetch("/api/bank/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    })
      .then(async (response) => {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) throw new Error(data.error || "Synchronisation impossible");
        if (!data.accounts.length) throw new Error("Aucun compte autorisé n’a été trouvé");
        return data;
      })
      .then((data) => {
        setBankError("");
        setFinanceSources((sources) => {
          const replacedSource = sources.find((source) => source.id === data.sourceId);
          if (!replacedSource || replacedSource.category !== "bank") return sources;
          const previousSessionId = replacedSource?.bankSessionId;

          return sources.flatMap((source) => {
            if (previousSessionId && source.bankSessionId === previousSessionId && source.id !== data.sourceId) return [];
            if (source.id !== data.sourceId) return source;

            return data.accounts.map((account, index) => ({
              ...source,
              id: index === 0 ? source.id : `${source.id}-${account.accountId}`,
              accountName: account.name || source.accountName,
              lastFour: account.iban?.slice(-4) || source.lastFour,
              balance: account.balance,
              currency: account.currency,
              accountTypeCode: account.accountTypeCode,
              bankAccountId: account.accountId,
              bankSessionId: data.sessionId,
              connectionStatus: "connected",
              lastSyncAt: new Date().toISOString(),
            }));
          });
        });
      })
      .catch((error) => setBankError(error.message))
      .finally(() => setConnectingSourceId(null));
  }, []);

  const isCardSource = (source) =>
    source.accountTypeCode === "CARD" || /^carte\b/i.test(source.accountName || "");

  const connectedBalance = financeSources.reduce(
    (total, source) => total + (Number.isFinite(source.balance) && !isCardSource(source) ? source.balance : 0),
    0
  );
  const connectedSources = financeSources.filter((source) =>
    Number.isFinite(source.balance) && !isCardSource(source)
  );
  const financeGroups = (() => {
    const groups = new Map();
    financeSources.forEach((source) => {
      const providerId = source.category === "bank"
        ? source.bankId || source.name
        : source.category === "exchange"
          ? source.exchangeId || source.name
          : source.category === "wallet"
            ? source.walletId || source.name
            : source.id;
      const groupId = `${source.category}-${providerId}`;
      if (!groups.has(groupId)) groups.set(groupId, {
        id: groupId,
        name: source.name,
        category: source.category,
        sources: [],
      });
      groups.get(groupId).sources.push(source);
    });
    const categoryOrder = { bank: 0, exchange: 1, wallet: 2 };
    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        sources: [...group.sources].sort((a, b) => {
          const cardDifference = Number(isCardSource(a)) - Number(isCardSource(b));
          if (cardDifference) return cardDifference;
          const networkDifference = (a.assetNetworkName || "").localeCompare(
            b.assetNetworkName || "",
            "fr",
            { sensitivity: "base" }
          );
          if (networkDifference) return networkDifference;
          return (a.accountName || "").localeCompare(
            b.accountName || "",
            "fr",
            { sensitivity: "base" }
          );
        }),
      }))
      .sort((a, b) => {
        const categoryDifference = (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99);
        return categoryDifference || a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      });
  })();
  const formattedTotal = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(connectedBalance);

  function openBankSetup(bank) {
    setSelectedBank(bank);
    setSourceModalOpen(false);
    setAccountSetupOpen(true);
  }

  function saveBankAccount(account) {
    if (!selectedBank) return;

    setFinanceSources((sources) => [
      ...sources,
      {
        id: `${selectedBank.id}-${Date.now()}`,
        category: "bank",
        bankId: selectedBank.id,
        name: selectedBank.name,
        accountName: account.accountName,
        accountType: account.accountType,
        lastFour: account.lastFour,
        connectionStatus: "pending",
      },
    ]);
    setAccountSetupOpen(false);
  }

  function addCoinbaseSource() {
    setFinanceSources((sources) => {
      if (sources.some((source) => source.exchangeId === "coinbase")) return sources;
      return [...sources, {
        id: `coinbase-${Date.now()}`,
        category: "exchange",
        exchangeId: "coinbase",
        name: "Coinbase",
        accountName: "Portefeuille Coinbase",
        connectionStatus: "pending",
      }];
    });
    setSourceModalOpen(false);
  }

  function openWalletSetup() {
    setSourceModalOpen(false);
    setWalletSetupOpen(true);
  }

  function saveEthereumWallet(address) {
    setFinanceSources((sources) => [...sources, {
      id: `trust-wallet-ethereum-${Date.now()}`,
      category: "wallet",
      walletId: "trust-wallet",
      networkId: "ethereum",
      walletScannerId: "evm",
      name: "Trust Wallet",
      accountName: "Ethereum",
      walletAddress: address,
      connectionStatus: "pending",
    }]);
    setWalletSetupOpen(false);
  }

  function saveAptosWallet(address) {
    setFinanceSources((sources) => [...sources, {
      id: `trust-wallet-aptos-${Date.now()}`,
      category: "wallet",
      walletId: "trust-wallet",
      networkId: "aptos",
      walletScannerId: "aptos",
      name: "Trust Wallet",
      accountName: "Aptos",
      walletAddress: address,
      connectionStatus: "pending",
    }]);
    setWalletSetupOpen(false);
  }

  function saveBitcoinWallet(address) {
    setFinanceSources((sources) => [...sources, {
      id: `trust-wallet-bitcoin-${Date.now()}`,
      category: "wallet",
      walletId: "trust-wallet",
      networkId: "bitcoin",
      walletScannerId: "bitcoin",
      name: "Trust Wallet",
      accountName: "Bitcoin",
      walletAddress: address,
      connectionStatus: "pending",
    }]);
    setWalletSetupOpen(false);
  }

  function saveTrustWallet(network, address) {
    if (network === "aptos") saveAptosWallet(address);
    else if (network === "bitcoin") saveBitcoinWallet(address);
    else saveEthereumWallet(address);
  }

  function openPhantomSetup() {
    setSourceModalOpen(false);
    setPhantomSetupOpen(true);
  }

  function savePhantomWallet(network, address) {
    setFinanceSources((sources) => [...sources, {
      id: `phantom-${network}-${Date.now()}`,
      category: "wallet",
      walletId: "phantom",
      networkId: network === "solana" ? "solana" : "ethereum",
      walletScannerId: network,
      name: "Phantom",
      accountName: network === "solana" ? "Solana" : "Réseaux EVM",
      walletAddress: address,
      connectionStatus: "pending",
    }]);
    setPhantomSetupOpen(false);
  }

  function openMetamaskSetup() {
    setSourceModalOpen(false);
    setMetamaskSetupOpen(true);
  }

  function saveMetamaskWallet(network, address) {
    setFinanceSources((sources) => [...sources, {
      id: `metamask-${network}-${Date.now()}`,
      category: "wallet",
      walletId: "metamask",
      networkId: network === "evm" ? "ethereum" : network,
      walletScannerId: network,
      name: "MetaMask",
      accountName: network === "evm" ? "Réseaux EVM" : network === "solana" ? "Solana" : "Bitcoin",
      walletAddress: address,
      connectionStatus: "pending",
    }]);
    setMetamaskSetupOpen(false);
  }

  function removeFinanceGroup(group) {
    const sourceIds = new Set(group.sources.map((source) => source.id));
    setFinanceSources((sources) =>
      sources.filter((source) => !sourceIds.has(source.id))
    );
  }

  async function connectFinanceSource(source, { allowBankAuthorization = false } = {}) {
    if (source.category === "exchange" && source.exchangeId === "coinbase") {
      return syncCoinbaseSource(source);
    }
    if (source.category === "wallet") {
      if (!source.walletAddress) {
        setBankError(`${source.name} : adresse publique manquante`);
        return;
      }
      const scannerId = source.walletScannerId || (
        source.networkId === "aptos" ? "aptos" :
        source.networkId === "bitcoin" ? "bitcoin" :
        source.networkId === "solana" ? "solana" : "evm"
      );
      if (scannerId === "aptos") return syncAptosSource(source);
      if (scannerId === "bitcoin") return syncBitcoinSource(source);
      if (scannerId === "solana") return syncSolanaSource(source);
      if (scannerId === "evm") return syncEthereumSource(source);
      setBankError(`${source.name} : réseau wallet non pris en charge`);
      return;
    }
    if (source.category !== "bank") {
      setBankError("Cette source ne peut pas être synchronisée");
      return;
    }
    if (!allowBankAuthorization) {
      setBankError(`${source.name} : clique sur Reconnecter pour ouvrir l’autorisation bancaire`);
      return;
    }

    setConnectingSourceId(source.id);
    setBankError("");

    try {
      const response = await fetch("/api/bank/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: source.id,
          bankId:
            source.bankId ||
            (source.name === "La Banque Postale"
              ? "la-banque-postale"
              : "boursobank"),
        }),
      });
      const responseText = await response.text();
      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Le serveur bancaire a renvoyé une réponse invalide");
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            (response.status >= 500
              ? "Le serveur bancaire local ne répond pas. Redémarre l’application avec npm run dev."
              : "Impossible de démarrer la connexion")
        );
      }

      if (!data.link) {
        throw new Error("La connexion bancaire n’a pas renvoyé de lien sécurisé");
      }

      window.location.assign(data.link);
    } catch (error) {
      setBankError(error.message);
      setConnectingSourceId(null);
    }
  }

  async function syncFinanceGroup(group) {
    if (group.sources[0]?.category !== "wallet") {
      return connectFinanceSource(group.sources[0]);
    }
    const sourcesByAddress = new Map();
    group.sources.forEach((source) => {
      const key = `${source.walletScannerId || source.networkId}-${source.walletAddress}`;
      const current = sourcesByAddress.get(key);
      if (!current || source.connectionStatus !== "connected") sourcesByAddress.set(key, source);
    });
    for (const source of sourcesByAddress.values()) {
      await connectFinanceSource(source);
    }
  }

  async function syncBankSource(source) {
    setConnectingSourceId(source.id);
    setBankError("");
    try {
      const response = await fetch("/api/bank/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: source.bankSessionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Synchronisation bancaire impossible");
      if (!data.accounts?.length) throw new Error("Aucun compte bancaire n’a été trouvé");
      setFinanceSources((sources) => replaceBankSources(sources, source, data));
    } catch (error) {
      setBankError(`${source.name} : ${error.message}`);
      setFinanceSources((sources) => sources.map((item) =>
        item.bankSessionId === source.bankSessionId
          ? { ...item, connectionStatus: "reconnect-required" }
          : item
      ));
    } finally {
      setConnectingSourceId(null);
    }
  }

  async function syncCoinbaseSource(source) {
    setConnectingSourceId(source.id);
    setBankError("");
    try {
      const response = await fetch("/api/coinbase/sync", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Synchronisation Coinbase impossible");
      if (!data.accounts?.length) throw new Error("Aucun actif avec un solde disponible n’a été trouvé sur Coinbase");

      setFinanceSources((sources) => replaceCoinbaseSources(sources, source, data));
    } catch (error) {
      setBankError(error.message);
    } finally {
      setConnectingSourceId(null);
    }
  }

  async function syncEthereumSource(source) {
    setConnectingSourceId(source.id);
    setBankError("");
    try {
      const response = await fetch("/api/wallet/ethereum/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: source.walletAddress }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Synchronisation Ethereum impossible");
      if (!data.accounts?.length) throw new Error("Aucun actif Ethereum n’a été trouvé");
      setFinanceSources((sources) => replaceEthereumSources(sources, source, data));
    } catch (error) {
      setBankError(error.message);
    } finally {
      setConnectingSourceId(null);
    }
  }

  async function syncAptosSource(source) {
    setConnectingSourceId(source.id);
    setBankError("");
    try {
      const response = await fetch("/api/wallet/aptos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: source.walletAddress }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Synchronisation Aptos impossible");
      setFinanceSources((sources) => replaceAptosSources(sources, source, data));
    } catch (error) {
      setBankError(error.message);
    } finally {
      setConnectingSourceId(null);
    }
  }

  async function syncBitcoinSource(source) {
    setConnectingSourceId(source.id);
    setBankError("");
    try {
      const response = await fetch("/api/wallet/bitcoin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: source.walletAddress }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Synchronisation Bitcoin impossible");
      setFinanceSources((sources) => replaceBitcoinSources(sources, source, data));
    } catch (error) {
      setBankError(error.message);
    } finally {
      setConnectingSourceId(null);
    }
  }

  async function syncSolanaSource(source) {
    setConnectingSourceId(source.id);
    setBankError("");
    try {
      const response = await fetch("/api/wallet/solana/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: source.walletAddress }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Synchronisation Solana impossible");
      if (!data.accounts?.length) throw new Error("Aucun actif Solana n’a été trouvé");
      setFinanceSources((sources) => replaceSolanaSources(sources, source, data));
    } catch (error) {
      setBankError(error.message);
    } finally {
      setConnectingSourceId(null);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9de2ba]">
            Patrimoine
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Finance</h1>
          <p className="text-gray-300 max-w-2xl">
            Regroupe tes banques, exchanges crypto et wallets au même endroit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSourceModalOpen(true)}
          className="w-fit shrink-0 rounded-2xl px-5 py-3 bg-[#315843] border border-[#5fa37c] hover:bg-[#3d6b51] transition font-semibold flex items-center gap-2"
        >
          <Plus size={19} /> Ajouter une source
        </button>
      </div>

      {bankError && (
        <div className="mb-6 rounded-2xl bg-[#3d252d] border border-[#d16a7f] px-5 py-4 text-[#ffb0be] flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold">Synchronisation impossible</div>
            <div className="text-sm mt-1">{bankError}</div>
          </div>
          <button type="button" onClick={() => setBankError("")} title="Fermer"><X size={18} /></button>
        </div>
      )}

      {financeSources.length === 0 ? (
        <section className="bg-[#161d38] border border-dashed border-[#303b6e] rounded-[32px] px-6 py-16 shadow-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-[#232c52] border border-[#303b6e] flex items-center justify-center text-[#9de2ba] mb-5">
            <WalletCards size={29} />
          </div>
          <h2 className="text-2xl font-bold">Aucune source financière</h2>
          <p className="text-gray-300 max-w-md mt-2 mb-6">
            Ajoute ta première banque ou un autre portefeuille pour commencer.
          </p>
          <button
            type="button"
            onClick={() => setSourceModalOpen(true)}
            className="rounded-2xl px-5 py-3 bg-[#232c52] border border-[#303b6e] hover:bg-[#303b6e] transition font-semibold flex items-center gap-2"
          >
            <Plus size={19} /> Ajouter ma première source
          </button>
        </section>
      ) : (
        <>
          <section className="relative overflow-hidden bg-[#161d38] border border-[#232c52] rounded-[32px] p-7 shadow-2xl mb-6">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#315843] opacity-30 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 text-sm text-gray-300 mb-4">
                <span className="w-10 h-10 rounded-2xl bg-[#232c52] border border-[#303b6e] flex items-center justify-center text-[#9de2ba]">
                  <WalletCards size={20} />
                </span>
                Capital total
              </div>
              <div className="text-5xl sm:text-6xl font-bold tracking-tight">
                {connectedSources.length ? formattedTotal : "Solde indisponible"}
              </div>
              {!connectedSources.length && (
                <div className="text-sm text-gray-400 mt-3">
                  Le montant apparaîtra après la connexion des comptes.
                </div>
              )}
            </div>
          </section>

          <div className="mb-4">
            <h2 className="text-2xl font-bold">Mes sources</h2>
            <p className="text-sm text-gray-300 mt-1">
              {financeGroups.length} établissement{financeGroups.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-4">
            {financeGroups.map((group) => {
              const mainSource = group.sources.find((source) => !isCardSource(source)) || group.sources[0];
              const isExchange = mainSource.category === "exchange";
              const isWallet = mainSource.category === "wallet";
              const isConnected = group.sources.some((source) => source.connectionStatus === "connected");
              const isConnecting = group.sources.some((source) => source.id === connectingSourceId);
              const groupBalance = group.sources.reduce(
                (total, source) => total + (Number.isFinite(source.balance) && !isCardSource(source) ? source.balance : 0),
                0
              );
              const hasGroupBalance = group.sources.some(
                (source) => Number.isFinite(source.balance) && !isCardSource(source)
              );

              return (
              <section key={group.id} className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#202948] border border-[#303b6e] flex items-center justify-center text-[#b7c7ff]">
                      {isExchange ? <Bitcoin size={26} /> : isWallet ? <Wallet size={26} /> : <Landmark size={26} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{group.name}</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        {group.sources.length} {isExchange || isWallet ? "actif" : "élément bancaire"}{group.sources.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="text-2xl font-bold">
                        {hasGroupBalance
                          ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: mainSource.currency || "EUR" }).format(groupBalance)
                          : "Solde indisponible"}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {isConnected ? "Source connectée en lecture seule" : "Connexion requise"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFinanceGroup(group)}
                      className="w-10 h-10 shrink-0 rounded-xl bg-[#6a3140] hover:bg-[#7a394a] transition flex items-center justify-center"
                      title="Supprimer cet établissement"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <div className="mt-6 overflow-hidden rounded-2xl border border-[#232c52]">
                  {group.sources.map((source, sourceIndex) => {
                    const isCard = isCardSource(source);
                    return (
                      <div key={source.id} className={`flex flex-col gap-3 bg-[#101735] px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${sourceIndex > 0 ? "border-t border-[#232c52]" : ""}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 shrink-0 rounded-xl bg-[#202948] flex items-center justify-center text-[#b7c7ff]">
                            {isExchange ? <Bitcoin size={18} /> : isWallet ? <Wallet size={18} /> : isCard ? <WalletCards size={18} /> : <Landmark size={18} />}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{source.accountName}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {isExchange || isWallet
                                ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 8 }).format(source.assetAmount || 0)} ${source.assetCurrency || ""}`
                                : isCard ? "Carte associée" : "Compte bancaire"}
                              {!isExchange && source.lastFour ? ` · •••• ${source.lastFour}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="font-semibold">
                            {Number.isFinite(source.balance)
                              ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: source.currency || "EUR" }).format(source.balance)
                              : "Solde indisponible"}
                          </div>
                          {isCard && <div className="text-xs text-gray-400 mt-1">Non comptabilisée dans le capital</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-5 border-t border-[#303b6e] flex items-center gap-2 text-sm text-gray-300">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#5fa37c]" : "bg-[#ffd166]"}`} />
                  <span className="flex-1">
                    {isConnected ? `Synchronisé avec ${group.name}` : "Compte paramétré · Connexion bancaire requise"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isWallet) return syncFinanceGroup(group);
                      if (mainSource.category === "bank" && mainSource.connectionStatus === "connected" && mainSource.bankSessionId) {
                        return syncBankSource(mainSource);
                      }
                      return connectFinanceSource(mainSource, { allowBankAuthorization: true });
                    }}
                    disabled={isConnecting}
                    className="rounded-xl px-4 py-2 bg-[#315843] border border-[#5fa37c] hover:bg-[#3d6b51] disabled:opacity-60 disabled:cursor-wait transition font-semibold flex items-center gap-2"
                  >
                    <Link2 size={16} />
                    {isConnecting
                      ? "Synchronisation…"
                      : isConnected
                        ? "Synchroniser"
                        : mainSource.connectionStatus === "reconnect-required"
                          ? "Reconnecter"
                          : "Connecter"}
                  </button>
                </div>
              </section>
              );
            })}
          </div>
        </>
      )}

      {sourceModalOpen && (
        <AddFinanceSourceModal
          onSelectBank={openBankSetup}
          onSelectCoinbase={addCoinbaseSource}
          onSelectWallet={openWalletSetup}
          onSelectPhantom={openPhantomSetup}
          onSelectMetamask={openMetamaskSetup}
          onClose={() => setSourceModalOpen(false)}
        />
      )}

      {accountSetupOpen && (
        <BankAccountSetupModal
          bank={selectedBank}
          onSave={saveBankAccount}
          onClose={() => setAccountSetupOpen(false)}
        />
      )}

      {walletSetupOpen && (
        <TrustWalletSetupModal
          onSave={saveTrustWallet}
          onClose={() => setWalletSetupOpen(false)}
        />
      )}
      {phantomSetupOpen && (
        <PhantomWalletSetupModal
          onSave={savePhantomWallet}
          onClose={() => setPhantomSetupOpen(false)}
        />
      )}
      {metamaskSetupOpen && (
        <MetamaskWalletSetupModal
          onSave={saveMetamaskWallet}
          onClose={() => setMetamaskSetupOpen(false)}
        />
      )}
    </div>
  );
}

function AddFinanceSourceModal({ onSelectBank, onSelectCoinbase, onSelectWallet, onSelectPhantom, onSelectMetamask, onClose }) {
  const categories = [
    { id: "bank", label: "Banque", icon: Landmark, available: true },
    { id: "exchange", label: "Exchange crypto", icon: Bitcoin, available: true },
    { id: "wallet", label: "Wallet", icon: Wallet, available: true },
  ];
  const banks = [
    { id: "la-banque-postale", name: "La Banque Postale" },
    { id: "boursobank", name: "BoursoBank" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#161d38] border border-[#303b6e] rounded-[32px] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-2xl font-bold">Ajouter une source</div>
            <div className="text-sm text-gray-300 mt-1">Choisis le type de capital à suivre.</div>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 shrink-0 rounded-xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center" title="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className={`rounded-2xl border p-4 ${category.available ? "bg-[#294a3b] border-[#5fa37c]" : "bg-[#101735] border-[#303b6e] opacity-60"}`}>
                <Icon size={22} className="mb-3" />
                <div className="font-semibold text-sm">{category.label}</div>
                {!category.available && <div className="text-xs text-gray-400 mt-1">Bientôt</div>}
              </div>
            );
          })}
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 mb-3">Exchanges disponibles</div>
        <button
          type="button"
          onClick={onSelectCoinbase}
          className="w-full rounded-2xl bg-[#232c52] border border-[#303b6e] hover:bg-[#303b6e] transition p-4 flex items-center gap-4 text-left mb-7"
        >
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-[#202948] border border-[#303b6e] flex items-center justify-center text-[#b7c7ff]">
            <Bitcoin size={23} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Coinbase</span>
            <span className="block text-sm text-gray-300 mt-1">Synchronisation locale en lecture seule</span>
          </span>
          <ChevronRight size={20} />
        </button>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 mb-3">Wallets disponibles</div>
        <button
          type="button"
          onClick={onSelectWallet}
          className="w-full rounded-2xl bg-[#232c52] border border-[#303b6e] hover:bg-[#303b6e] transition p-4 flex items-center gap-4 text-left mb-7"
        >
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-[#202948] border border-[#303b6e] flex items-center justify-center text-[#b7c7ff]">
            <Wallet size={23} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Trust Wallet</span>
            <span className="block text-sm text-gray-300 mt-1">Ajoute une ou plusieurs adresses publiques</span>
          </span>
          <ChevronRight size={20} />
        </button>
        <button
          type="button"
          onClick={onSelectPhantom}
          className="w-full rounded-2xl bg-[#232c52] border border-[#303b6e] hover:bg-[#303b6e] transition p-4 flex items-center gap-4 text-left mb-7"
        >
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-[#202948] border border-[#303b6e] flex items-center justify-center text-[#b7c7ff]"><Wallet size={23} /></span>
          <span className="flex-1">
            <span className="block font-semibold">Phantom</span>
            <span className="block text-sm text-gray-300 mt-1">Solana et réseaux EVM en lecture seule</span>
          </span>
          <ChevronRight size={20} />
        </button>
        <button
          type="button"
          onClick={onSelectMetamask}
          className="w-full rounded-2xl bg-[#232c52] border border-[#303b6e] hover:bg-[#303b6e] transition p-4 flex items-center gap-4 text-left mb-7"
        >
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-[#202948] border border-[#303b6e] flex items-center justify-center text-[#b7c7ff]"><Wallet size={23} /></span>
          <span className="flex-1">
            <span className="block font-semibold">MetaMask</span>
            <span className="block text-sm text-gray-300 mt-1">Ethereum, BNB Chain, Sei et autres réseaux EVM</span>
          </span>
          <ChevronRight size={20} />
        </button>

        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 mb-3">Banques disponibles</div>
        <div className="space-y-3">
          {banks.map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => onSelectBank(bank)}
              className="w-full rounded-2xl bg-[#232c52] border border-[#303b6e] hover:bg-[#303b6e] transition p-4 flex items-center gap-4 text-left"
            >
              <span className="w-12 h-12 shrink-0 rounded-2xl bg-[#202948] border border-[#303b6e] flex items-center justify-center text-[#b7c7ff]">
                <Landmark size={23} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{bank.name}</span>
                <span className="block text-sm text-gray-300 mt-1">Configurer un compte</span>
              </span>
              <ChevronRight size={20} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustWalletSetupModal({ onSave, onClose }) {
  const [network, setNetwork] = useState("evm");
  const [address, setAddress] = useState("");
  const normalizedAddress = address.trim();
  const isValid = network === "aptos"
    ? /^0x[a-fA-F0-9]{1,64}$/.test(normalizedAddress)
    : network === "bitcoin"
      ? /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71})$/i.test(normalizedAddress)
      : /^0x[a-fA-F0-9]{40}$/.test(normalizedAddress);

  function submitWallet(event) {
    event.preventDefault();
    if (isValid) onSave(network, normalizedAddress);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form onSubmit={submitWallet} className="w-full max-w-xl bg-[#161d38] border border-[#303b6e] rounded-[32px] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#9de2ba] mb-2">
              <Wallet size={17} /> Trust Wallet
            </div>
            <div className="text-2xl font-bold">Ajouter une adresse</div>
            <div className="text-sm text-gray-300 mt-1">Tu peux revenir ici autant de fois que nécessaire pour ajouter tes différentes adresses Trust Wallet.</div>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 shrink-0 rounded-xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center" title="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <button type="button" onClick={() => { setNetwork("evm"); setAddress(""); }} className={`rounded-2xl border px-4 py-3 font-semibold transition ${network === "evm" ? "bg-[#315843] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e]"}`}>Réseaux EVM</button>
          <button type="button" onClick={() => { setNetwork("aptos"); setAddress(""); }} className={`rounded-2xl border px-4 py-3 font-semibold transition ${network === "aptos" ? "bg-[#315843] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e]"}`}>Aptos</button>
          <button type="button" onClick={() => { setNetwork("bitcoin"); setAddress(""); }} className={`rounded-2xl border px-4 py-3 font-semibold transition ${network === "bitcoin" ? "bg-[#315843] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e]"}`}>Bitcoin</button>
        </div>
        <label className="text-sm text-gray-300 block mb-2" htmlFor="trust-wallet-address">Adresse publique {network === "aptos" ? "Aptos" : network === "bitcoin" ? "Bitcoin" : "EVM"}</label>
        <input
          id="trust-wallet-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none text-white"
          placeholder="0x…"
          spellCheck="false"
          autoComplete="off"
        />
        {normalizedAddress && !isValid && <div className="text-sm text-[#ffb0be] mt-2">Cette adresse {network === "aptos" ? "Aptos" : network === "bitcoin" ? "Bitcoin" : "EVM"} n’est pas valide.</div>}

        <div className="mt-5 rounded-2xl bg-[#101735] border border-[#303b6e] p-4 text-sm text-gray-300 flex gap-3">
          <Link2 size={19} className="shrink-0 text-[#9de2ba]" />
          <p>Ne renseigne jamais ta phrase secrète ni ta clé privée. Une adresse publique permet seulement de consulter les fonds visibles sur la blockchain.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button type="button" onClick={onClose} className="bg-[#232c52] hover:bg-[#303b6e] transition rounded-2xl py-3 font-medium">Retour</button>
          <button type="submit" disabled={!isValid} className="bg-[#315843] border border-[#5fa37c] hover:bg-[#3d6b51] disabled:opacity-50 disabled:cursor-not-allowed transition rounded-2xl py-3 font-semibold">Ajouter</button>
        </div>
      </form>
    </div>
  );
}

function PhantomWalletSetupModal({ onSave, onClose }) {
  const [network, setNetwork] = useState("solana");
  const [address, setAddress] = useState("");
  const normalizedAddress = address.trim();
  const isValid = network === "solana"
    ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(normalizedAddress)
    : /^0x[a-fA-F0-9]{40}$/.test(normalizedAddress);

  function submitWallet(event) {
    event.preventDefault();
    if (isValid) onSave(network, normalizedAddress);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form onSubmit={submitWallet} className="w-full max-w-xl bg-[#161d38] border border-[#303b6e] rounded-[32px] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#9de2ba] mb-2"><Wallet size={17} /> Phantom</div>
            <div className="text-2xl font-bold">Ajouter une adresse Phantom</div>
            <div className="text-sm text-gray-300 mt-1">L’adresse Solana détecte automatiquement SOL et tes jetons SPL.</div>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 shrink-0 rounded-xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center" title="Fermer"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button type="button" onClick={() => { setNetwork("solana"); setAddress(""); }} className={`rounded-2xl border px-4 py-3 font-semibold transition ${network === "solana" ? "bg-[#315843] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e]"}`}>Solana</button>
          <button type="button" onClick={() => { setNetwork("evm"); setAddress(""); }} className={`rounded-2xl border px-4 py-3 font-semibold transition ${network === "evm" ? "bg-[#315843] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e]"}`}>Réseaux EVM</button>
        </div>
        <label className="text-sm text-gray-300 block mb-2" htmlFor="phantom-wallet-address">Adresse publique {network === "solana" ? "Solana" : "EVM"}</label>
        <input id="phantom-wallet-address" value={address} onChange={(event) => setAddress(event.target.value)} className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none text-white" placeholder={network === "solana" ? "Adresse Solana…" : "0x…"} spellCheck="false" autoComplete="off" />
        {normalizedAddress && !isValid && <div className="text-sm text-[#ffb0be] mt-2">Cette adresse {network === "solana" ? "Solana" : "EVM"} n’est pas valide.</div>}
        <div className="mt-5 rounded-2xl bg-[#101735] border border-[#303b6e] p-4 text-sm text-gray-300 flex gap-3"><Link2 size={19} className="shrink-0 text-[#9de2ba]" /><p>Utilise uniquement ton adresse publique. Ne communique jamais ta phrase secrète ni ta clé privée.</p></div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button type="button" onClick={onClose} className="bg-[#232c52] hover:bg-[#303b6e] transition rounded-2xl py-3 font-medium">Retour</button>
          <button type="submit" disabled={!isValid} className="bg-[#315843] border border-[#5fa37c] hover:bg-[#3d6b51] disabled:opacity-50 disabled:cursor-not-allowed transition rounded-2xl py-3 font-semibold">Ajouter</button>
        </div>
      </form>
    </div>
  );
}

function MetamaskWalletSetupModal({ onSave, onClose }) {
  const [network, setNetwork] = useState("evm");
  const [address, setAddress] = useState("");
  const normalizedAddress = address.trim();
  const isValid = network === "solana"
    ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(normalizedAddress)
    : network === "bitcoin"
      ? /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71})$/i.test(normalizedAddress)
      : /^0x[a-fA-F0-9]{40}$/.test(normalizedAddress);

  function submitWallet(event) {
    event.preventDefault();
    if (isValid) onSave(network, normalizedAddress);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form onSubmit={submitWallet} className="w-full max-w-xl bg-[#161d38] border border-[#303b6e] rounded-[32px] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#9de2ba] mb-2"><Wallet size={17} /> MetaMask</div>
            <div className="text-2xl font-bold">Ajouter MetaMask</div>
            <div className="text-sm text-gray-300 mt-1">Ajoute séparément tes adresses EVM, Solana ou Bitcoin. Elles resteront réunies dans une seule carte MetaMask.</div>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 shrink-0 rounded-xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center" title="Fermer"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button type="button" onClick={() => { setNetwork("evm"); setAddress(""); }} className={`rounded-2xl border px-4 py-3 font-semibold transition ${network === "evm" ? "bg-[#315843] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e]"}`}>Réseaux EVM</button>
          <button type="button" onClick={() => { setNetwork("solana"); setAddress(""); }} className={`rounded-2xl border px-4 py-3 font-semibold transition ${network === "solana" ? "bg-[#315843] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e]"}`}>Solana</button>
          <button type="button" onClick={() => { setNetwork("bitcoin"); setAddress(""); }} className={`rounded-2xl border px-4 py-3 font-semibold transition ${network === "bitcoin" ? "bg-[#315843] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e]"}`}>Bitcoin</button>
        </div>
        <label className="text-sm text-gray-300 block mb-2" htmlFor="metamask-wallet-address">Adresse publique {network === "evm" ? "EVM" : network === "solana" ? "Solana" : "Bitcoin"}</label>
        <input id="metamask-wallet-address" value={address} onChange={(event) => setAddress(event.target.value)} className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none text-white" placeholder={network === "evm" ? "0x…" : network === "solana" ? "Adresse Solana…" : "bc1…"} spellCheck="false" autoComplete="off" />
        {normalizedAddress && !isValid && <div className="text-sm text-[#ffb0be] mt-2">Cette adresse {network === "evm" ? "EVM" : network === "solana" ? "Solana" : "Bitcoin"} n’est pas valide.</div>}
        <div className="mt-5 rounded-2xl bg-[#101735] border border-[#303b6e] p-4 text-sm text-gray-300 flex gap-3"><Link2 size={19} className="shrink-0 text-[#9de2ba]" /><p>Colle uniquement ton adresse publique. Ne renseigne jamais ta phrase secrète ni ta clé privée.</p></div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button type="button" onClick={onClose} className="bg-[#232c52] hover:bg-[#303b6e] transition rounded-2xl py-3 font-medium">Retour</button>
          <button type="submit" disabled={!isValid} className="bg-[#315843] border border-[#5fa37c] hover:bg-[#3d6b51] disabled:opacity-50 disabled:cursor-not-allowed transition rounded-2xl py-3 font-semibold">Ajouter</button>
        </div>
      </form>
    </div>
  );
}

function BankAccountSetupModal({ bank, onSave, onClose }) {
  const accountTypes = [
    { id: "checking", label: "Compte courant" },
    { id: "livret-a", label: "Livret A" },
    { id: "ldds", label: "LDDS" },
    { id: "savings", label: "Autre compte épargne" },
  ];
  const [accountType, setAccountType] = useState("checking");
  const [accountName, setAccountName] = useState("Compte courant");
  const [lastFour, setLastFour] = useState("");

  function chooseAccountType(type) {
    setAccountType(type.id);
    setAccountName(type.label);
  }

  function submitAccount(event) {
    event.preventDefault();
    const trimmedName = accountName.trim();

    if (!trimmedName) {
      return;
    }

    onSave({
      accountType,
      accountName: trimmedName,
      lastFour: lastFour.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form onSubmit={submitAccount} className="w-full max-w-xl bg-[#161d38] border border-[#303b6e] rounded-[32px] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#9de2ba] mb-2">
              <Landmark size={17} /> {bank?.name || "Banque"}
            </div>
            <div className="text-2xl font-bold">Choisir le compte</div>
            <div className="text-sm text-gray-300 mt-1">
              Ces informations préparent l’affichage avant la connexion bancaire.
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 shrink-0 rounded-xl bg-[#232c52] hover:bg-[#303b6e] transition flex items-center justify-center" title="Fermer">
            <X size={18} />
          </button>
        </div>

        <label className="block text-sm font-semibold mb-3">Type de compte</label>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {accountTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => chooseAccountType(type)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${accountType === type.id ? "bg-[#294a3b] border-[#5fa37c]" : "bg-[#232c52] border-[#303b6e] hover:bg-[#303b6e]"}`}
            >
              <span className="font-semibold text-sm">{type.label}</span>
            </button>
          ))}
        </div>

        <label className="text-sm text-gray-300 block mb-2" htmlFor="finance-account-name">Nom d’affichage</label>
        <input
          id="finance-account-name"
          value={accountName}
          onChange={(event) => setAccountName(event.target.value)}
          className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none text-white mb-5"
          placeholder="Ex. Compte principal"
        />

        <label className="text-sm text-gray-300 block mb-2" htmlFor="finance-account-last-four">
          4 derniers chiffres du compte <span className="text-gray-400">(facultatif)</span>
        </label>
        <input
          id="finance-account-last-four"
          value={lastFour}
          onChange={(event) => setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          maxLength={4}
          className="w-full bg-[#232c52] border border-[#4d5a8f] rounded-2xl px-4 py-3 outline-none text-white"
          placeholder="1234"
        />

        <div className="mt-5 rounded-2xl bg-[#101735] border border-[#303b6e] p-4 text-sm text-gray-300 flex gap-3">
          <Link2 size={19} className="shrink-0 text-[#9de2ba]" />
          <p>Aucun identifiant bancaire n’est demandé ni enregistré à cette étape. La connexion sécurisée sera ajoutée ensuite.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button type="button" onClick={onClose} className="bg-[#232c52] hover:bg-[#303b6e] transition rounded-2xl py-3 font-medium">Retour</button>
          <button type="submit" className="bg-[#315843] border border-[#5fa37c] hover:bg-[#3d6b51] transition rounded-2xl py-3 font-semibold">Ajouter le compte</button>
        </div>
      </form>
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

      const date = getDateOnly(new Date(key.replace(`${habit.id}-`, "")));
      if (!isHabitDayActive(habit, date)) {
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
  const financeSources = readStoredFinanceSources();
  const capitalTotal = financeSources.reduce((total, source) => {
    const isCard = source.accountTypeCode === "CARD" || /^carte\b/i.test(source.accountName || "");
    return total + (Number.isFinite(source.balance) && !isCard ? source.balance : 0);
  }, 0);
  const formattedCapital = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(capitalTotal);

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
          Vue rapide de tes habitudes, de ton activite sport et de ton patrimoine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
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
        <DashboardStatCard
          icon={Wallet}
          label="Capital total"
          value={formattedCapital}
          tone="green"
          compact
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6 mt-6">
        <HabitRadarChart habits={habits} habitData={habitData} />
        <HabitWinLossProgress habits={habits} habitData={habitData} />
      </div>
    </div>
  );
}

function getHabitRadarAxes(habits, habitData) {
  const axes = habits.slice(0, 8).map((habit) => {
    const stats = getHabitOverview([habit], habitData);
    const rate = stats.trackedDays > 0 ? (stats.wins / stats.trackedDays) * 100 : 0;

    return {
      label: habit.name,
      value: rate,
    };
  });

  if (axes.length === 1) {
    const habit = habits[0];
    const stats = getHabitOverview([habit], habitData);
    const target = Math.max(1, habit.targetDays || 90);

    axes.push(
      { label: "Jours suivis", value: Math.min(100, (stats.trackedDays / target) * 100) },
      { label: "Objectif wins", value: Math.min(100, (stats.wins / target) * 100) }
    );
  } else if (axes.length === 2) {
    const average = (axes[0].value + axes[1].value) / 2;
    axes.push({ label: "Moyenne", value: average });
  }

  return axes;
}

function HabitRadarChart({ habits, habitData }) {
  const axes = getHabitRadarAxes(habits, habitData);
  const centerX = 210;
  const centerY = 150;
  const radius = 104;
  const labelRadius = 134;

  const getPoint = (index, pointRadius) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / axes.length;
    return {
      x: centerX + Math.cos(angle) * pointRadius,
      y: centerY + Math.sin(angle) * pointRadius,
    };
  };

  const toPoints = (scale) =>
    axes
      .map((_, index) => {
        const point = getPoint(index, radius * scale);
        return `${point.x},${point.y}`;
      })
      .join(" ");

  const dataPoints = axes
    .map((axis, index) => {
      const point = getPoint(index, radius * (axis.value / 100));
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <section className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl">
      <div className="mb-2">
        <h2 className="text-2xl font-bold">Radar des habitudes</h2>
        <p className="text-sm text-gray-300 mt-1">Taux de reussite par habitude</p>
      </div>

      {axes.length >= 3 ? (
        <svg
          viewBox="0 0 420 310"
          className="w-full max-h-[340px]"
          role="img"
          aria-label="Graphique radar du taux de reussite des habitudes"
        >
          <defs>
            <linearGradient id="habit-radar-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9de2ba" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#5fa37c" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
            <polygon
              key={scale}
              points={toPoints(scale)}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1"
              opacity={scale === 1 ? 0.9 : 0.55}
            />
          ))}

          {axes.map((axis, index) => {
            const end = getPoint(index, radius);
            const label = getPoint(index, labelRadius);
            const anchor = label.x < centerX - 8 ? "end" : label.x > centerX + 8 ? "start" : "middle";
            const shortLabel = axis.label.length > 16 ? `${axis.label.slice(0, 14)}…` : axis.label;

            return (
              <g key={`${axis.label}-${index}`}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={end.x}
                  y2={end.y}
                  stroke="var(--border-strong)"
                  strokeWidth="1"
                  opacity="0.7"
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill="var(--text-secondary)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {shortLabel}
                </text>
              </g>
            );
          })}

          <polygon
            points={dataPoints}
            fill="url(#habit-radar-fill)"
            stroke="var(--accent-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {axes.map((axis, index) => {
            const point = getPoint(index, radius * (axis.value / 100));
            return (
              <circle
                key={`point-${axis.label}-${index}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="var(--accent-text)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      ) : (
        <div className="h-72 flex items-center justify-center text-gray-300">
          Ajoute une habitude pour afficher le graphique.
        </div>
      )}

      {habits.length > 8 && (
        <p className="text-xs text-gray-400 text-center">Les 8 premieres habitudes sont affichees.</p>
      )}
    </section>
  );
}

function HabitWinLossProgress({ habits, habitData }) {
  const trackedHabitRates = habits
    .map((habit) => {
      const stats = getHabitOverview([habit], habitData);

      return stats.trackedDays > 0
        ? (stats.wins / stats.trackedDays) * 100
        : null;
    })
    .filter((rate) => rate !== null);

  const winPercent = trackedHabitRates.length > 0
    ? trackedHabitRates.reduce((total, rate) => total + rate, 0) / trackedHabitRates.length
    : 0;
  const lossPercent = trackedHabitRates.length > 0 ? 100 - winPercent : 0;
  const formatPercent = (value) =>
    value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

  return (
    <section className="bg-[#161d38] border border-[#232c52] rounded-[32px] p-6 shadow-2xl flex flex-col">
      <div>
        <h2 className="text-2xl font-bold">Bilan global</h2>
        <p className="text-sm text-gray-300 mt-1">Moyenne des taux de reussite de chaque habitude</p>
      </div>

      <div className="flex-1 flex flex-col justify-center py-10">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-4xl font-bold tabular-nums">{formatPercent(winPercent)}%</div>
            <div className="text-sm text-gray-300 mt-1">de reussite moyenne</div>
          </div>
          <div className="text-right text-sm text-gray-300">
            {trackedHabitRates.length} habitude{trackedHabitRates.length === 1 ? "" : "s"} prise{trackedHabitRates.length === 1 ? "" : "s"} en compte
          </div>
        </div>

        <div
          className="h-7 w-full overflow-hidden rounded-full bg-[#232c52] flex"
          role="img"
          aria-label={`${formatPercent(winPercent)} pour cent de reussite moyenne et ${formatPercent(lossPercent)} pour cent d'echec moyen`}
        >
          <div
            className="h-full bg-[#5fa37c] transition-all duration-500"
            style={{ width: `${winPercent}%` }}
            title={`${formatPercent(winPercent)} % de reussite moyenne`}
          />
          <div
            className="h-full bg-[#d16a7f] transition-all duration-500"
            style={{ width: `${lossPercent}%` }}
            title={`${formatPercent(lossPercent)} % d'echec moyen`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-[#203d33] border border-[#315843] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[#9de2ba] font-semibold">
              <span className="w-3 h-3 rounded-full bg-[#5fa37c]" />
              Taux de reussite
            </div>
            <div className="text-3xl font-bold mt-2 tabular-nums">{formatPercent(winPercent)}%</div>
          </div>
          <div className="bg-[#3d252d] border border-[#6a3140] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[#ffb0be] font-semibold">
              <span className="w-3 h-3 rounded-full bg-[#d16a7f]" />
              Taux d'echec
            </div>
            <div className="text-3xl font-bold mt-2 tabular-nums">{formatPercent(lossPercent)}%</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardStatCard({ icon: Icon, label, value, tone, compact = false }) {
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
      <div className={`${compact ? "text-3xl" : "text-4xl"} font-bold break-words`}>{value}</div>
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

              <div className="mt-5">
                <div className="text-sm text-gray-300 mb-2">
                  Jours comptabilisés
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {WEEK_DAY_OPTIONS.map((day) => {
                    const activeDays = getHabitActiveDays(selectedHabit);
                    const isActive = activeDays.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          if (isActive && activeDays.length === 1) {
                            return;
                          }

                          updateSelectedHabit({
                            activeWeekDays: isActive
                              ? activeDays.filter((value) => value !== day.value)
                              : [...activeDays, day.value],
                          });
                        }}
                        className={`rounded-xl border px-1 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "bg-[#315843] border-[#5fa37c] text-[#9de2ba]"
                            : "bg-[#1a1f36] border-[#2a3154] text-[#68719b]"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Les autres jours seront grisés et ignorés dans les statistiques.
                </p>
              </div>

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

        if (isHabitDayActive(selectedHabit, currentDate) && !updated[key]) {
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
  }, [selectedHabit, setHabitData]);

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
      const date = getDayDate(currentMonth, day);
      if (!isHabitDayActive(selectedHabit, date)) {
        continue;
      }
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
  }, [habitData, currentMonth, selectedHabit, daysInMonth]);

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
          const isInactiveDay = !isHabitDayActive(selectedHabit, date);

          let styles = "bg-[#2a3257] border border-[#49538a] text-[#8c96c9]";

          if (isBeforeStart) {
            styles =
              "bg-[#1a1f36] border border-[#2a3154] text-[#4f5888] opacity-50";
          }

          if (!isBeforeStart && isInactiveDay) {
            styles =
              "bg-[#171b2d] border border-[#252b47] text-[#555d7d] opacity-55";
          }

          if (!isBeforeStart && !isInactiveDay && state === "success") {
            styles = "bg-[#315843] border border-[#5fa37c] text-[#9de2ba]";
          }

          if (!isBeforeStart && !isInactiveDay && state === "fail") {
            styles = "bg-[#6a3140] border border-[#d16a7f] text-[#ffb0be]";
          }

          return (
            <button
              key={key}
              onClick={() => {
                if (isBeforeStart || isStartDay || isInactiveDay) {
                  return;
                }

                toggleDay(day);
              }}
              className={`relative aspect-square rounded-xl transition-all duration-200 flex items-center justify-center text-base font-medium ${styles} ${
                isBeforeStart || isStartDay || isInactiveDay
                  ? "cursor-not-allowed"
                  : "hover:scale-105"
              } ${isToday ? "ring-2 ring-white" : ""}`}
            >
              {(!state || isInactiveDay) && !isStartDay && <span>{day}</span>}

              {isStartDay && (
                <Flag className="absolute w-4 h-4 text-[#ffd166]" />
              )}

              {!isBeforeStart && !isInactiveDay && state === "success" && (
                <Check className="absolute w-5 h-5" strokeWidth={3} />
              )}

              {!isBeforeStart && !isInactiveDay && state === "fail" && (
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

      if (
        date.getTime() < startDateTime ||
        !isHabitDayActive(selectedHabit, date)
      ) {
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

      if (
        date.getTime() < startDateTime ||
        !isHabitDayActive(selectedHabit, date)
      ) {
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
