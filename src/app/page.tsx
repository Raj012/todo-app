"use client";

import { useState, useRef } from "react";
import type { Todo, UserStats } from "@/types/todo";

// ── Daily motivational quotes ────────────────────────────────────────────────
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Small steps every day lead to big results.", author: "Unknown" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Schedule your priorities, don't prioritize your schedule.", author: "Stephen Covey" },
  { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker" },
  { text: "You are never too old to set another goal or dream a new dream.", author: "C.S. Lewis" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Dreams don't work unless you do.", author: "John C. Maxwell" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
];

function getDailyQuote() {
  const yearStart = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - yearStart.getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// ── Badges ───────────────────────────────────────────────────────────────────
const BADGES = [
  { id: "first",    icon: "🌱", label: "First Step",  desc: "Complete your first task", threshold: 1,  streak: false },
  { id: "five",     icon: "✋", label: "High Five",   desc: "Complete 5 tasks",         threshold: 5,  streak: false },
  { id: "ten",      icon: "🎯", label: "Perfect Ten", desc: "Complete 10 tasks",        threshold: 10, streak: false },
  { id: "twentyfive",icon:"⚡", label: "On Fire",     desc: "Complete 25 tasks",        threshold: 25, streak: false },
  { id: "fifty",    icon: "👑", label: "Legendary",   desc: "Complete 50 tasks",        threshold: 50, streak: false },
  { id: "streak3",  icon: "🔥", label: "On a Roll",   desc: "3-day streak",             threshold: 3,  streak: true  },
  { id: "streak7",  icon: "💎", label: "Unstoppable", desc: "7-day streak",             threshold: 7,  streak: true  },
  { id: "streak30", icon: "🚀", label: "Rocket Mode", desc: "30-day streak",            threshold: 30, streak: true  },
];

// ── XP & levelling ───────────────────────────────────────────────────────────
const XP_PER_LEVEL = 100;

function xpForTask(streak: number) {
  return 10 + Math.min(streak * 2, 20); // 10–30 XP per task
}

function getLevel(xp: number) { return 1 + Math.floor(xp / XP_PER_LEVEL); }
function getXPInLevel(xp: number) { return xp % XP_PER_LEVEL; }

// ── Stats computation ────────────────────────────────────────────────────────
function computeStats(
  todos: Todo[],
  prev: UserStats,
): { stats: UserStats; isNewCompletion: boolean } {
  const totalCompleted = todos.filter((t) => t.completed).length;
  const isNewCompletion = totalCompleted > prev.totalCompleted;

  const today = new Date().toDateString();
  const lastDate = prev.lastCompletedDate
    ? new Date(prev.lastCompletedDate).toDateString()
    : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let currentStreak = prev.currentStreak;
  if (lastDate === today) {
    // streak already counted today – no change
  } else if (isNewCompletion && lastDate === yesterday) {
    currentStreak = prev.currentStreak + 1;
  } else if (isNewCompletion) {
    currentStreak = 1;
  }

  const longestStreak = Math.max(prev.longestStreak, currentStreak);
  const badges = BADGES.filter((b) =>
    b.streak ? currentStreak >= b.threshold : totalCompleted >= b.threshold,
  ).map((b) => b.id);

  return {
    stats: {
      totalCompleted,
      currentStreak,
      longestStreak,
      badges,
      lastCompletedDate: isNewCompletion ? new Date() : prev.lastCompletedDate,
    },
    isNewCompletion,
  };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [xp, setXP] = useState(0);
  const [stats, setStats] = useState<UserStats>({
    totalCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
  });
  const [xpPopup, setXPPopup] = useState<{ id: string; amount: number } | null>(null);
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null);
  const popupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quote = getDailyQuote();
  const level = getLevel(xp);
  const xpInLevel = getXPInLevel(xp);
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;

  function addTodo() {
    const title = input.trim();
    if (!title) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), title, completed: false, createdAt: new Date() },
      ...prev,
    ]);
    setInput("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) => {
      const toggling = prev.find((t) => t.id === id);
      const updated = prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : undefined }
          : t,
      );

      setStats((prevStats) => {
        const { stats: newStats, isNewCompletion } = computeStats(updated, prevStats);

        if (isNewCompletion) {
          const earned = xpForTask(newStats.currentStreak);
          setXP((prevXP) => {
            const newXP = prevXP + earned;
            if (getLevel(newXP) > getLevel(prevXP)) {
              if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
              setLevelUpMsg(`Level ${getLevel(newXP)} reached!`);
              levelUpTimer.current = setTimeout(() => setLevelUpMsg(null), 3000);
            }
            return newXP;
          });
          if (popupTimer.current) clearTimeout(popupTimer.current);
          setXPPopup({ id, amount: earned });
          popupTimer.current = setTimeout(() => setXPPopup(null), 1500);
        } else if (toggling?.completed) {
          // unchecking – subtract XP
          const earned = xpForTask(prevStats.currentStreak);
          setXP((prevXP) => Math.max(0, prevXP - earned));
        }

        return newStats;
      });

      return updated;
    });
  }

  function deleteTodo(id: string) {
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      const updated = prev.filter((t) => t.id !== id);
      if (todo?.completed) {
        setStats((s) => computeStats(updated, s).stats);
        setXP((prevXP) => Math.max(0, prevXP - xpForTask(stats.currentStreak)));
      }
      return updated;
    });
  }

  const pending = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Tasks</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex flex-col items-center bg-violet-600 text-white rounded-2xl px-5 py-2 shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
            <span className="text-xs font-semibold uppercase tracking-widest opacity-75">Level</span>
            <span className="text-3xl font-black leading-none">{level}</span>
          </div>
        </div>

        {/* ── XP / Stats card ── */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{xp} XP total</span>
            <span className="text-zinc-400 dark:text-zinc-500">{xpInLevel} / {XP_PER_LEVEL} to Level {level + 1}</span>
          </div>
          <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="flex gap-6 mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>✅ <strong className="text-zinc-800 dark:text-zinc-200">{stats.totalCompleted}</strong> done</span>
            <span>🔥 <strong className="text-zinc-800 dark:text-zinc-200">{stats.currentStreak}</strong>-day streak</span>
            <span>🏆 Best <strong className="text-zinc-800 dark:text-zinc-200">{stats.longestStreak}</strong></span>
          </div>
        </div>

        {/* ── Level-up toast ── */}
        {levelUpMsg && (
          <div className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-2xl px-5 py-3 text-center font-bold shadow-lg animate-bounce">
            🎉 {levelUpMsg}
          </div>
        )}

        {/* ── Daily quote ── */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">Daily Inspiration</p>
          <p className="text-base font-medium leading-relaxed italic">"{quote.text}"</p>
          <p className="text-sm opacity-70 mt-2">— {quote.author}</p>
        </div>

        {/* ── Input ── */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="What do you want to accomplish?"
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
          />
          <button
            onClick={addTodo}
            className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 active:scale-95 transition-all shadow-md shadow-violet-200 dark:shadow-violet-900/30"
          >
            + Add
          </button>
        </div>

        {/* ── Pending tasks ── */}
        {pending.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 px-1">
              Tasks ({pending.length})
            </h2>
            <ul className="space-y-2">
              {pending.map((todo) => (
                <li
                  key={todo.id}
                  className="relative flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 border border-zinc-100 dark:border-zinc-700 shadow-sm"
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-500 flex-shrink-0 hover:border-violet-500 transition-colors"
                  />
                  <span className="flex-1 text-zinc-800 dark:text-zinc-100">{todo.title}</span>
                  {xpPopup?.id === todo.id && (
                    <span className="absolute right-12 text-violet-500 font-bold text-sm animate-bounce pointer-events-none">
                      +{xpPopup.amount} XP
                    </span>
                  )}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-zinc-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 transition-colors text-xl leading-none"
                    aria-label="Delete"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Completed tasks ── */}
        {done.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 px-1">
              Completed ({done.length})
            </h2>
            <ul className="space-y-2">
              {done.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 border border-zinc-100 dark:border-zinc-700 shadow-sm opacity-60"
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="w-5 h-5 rounded-full bg-violet-500 border-2 border-violet-500 flex-shrink-0 flex items-center justify-center text-white text-xs"
                  >
                    ✓
                  </button>
                  <span className="flex-1 line-through text-zinc-500 dark:text-zinc-400">{todo.title}</span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-zinc-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 transition-colors text-xl leading-none"
                    aria-label="Delete"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {todos.length === 0 && (
          <p className="text-center text-zinc-400 dark:text-zinc-600 py-10">
            Add a task to get started and earn XP!
          </p>
        )}

        {/* ── Achievements ── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 px-1">
            Achievements
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map((b) => {
              const earned = stats.badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  title={b.desc}
                  className={`flex flex-col items-center gap-1 rounded-xl p-3 border text-center transition-all ${
                    earned
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 shadow-sm"
                      : "bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700 opacity-40 grayscale"
                  }`}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
