import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import type { CalendarDayRevenue } from '../../types';
import { api } from '../../services/api';

interface CalendarBentoWidgetProps {
  onSelectDate: (dateStr: string) => void;
  selectedDate?: string | null;
}

export const CalendarBentoWidget: React.FC<CalendarBentoWidgetProps> = ({
  onSelectDate,
  selectedDate
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [monthData, setMonthData] = useState<CalendarDayRevenue[]>([]);

  // Generate Year options: 1921 to 2099
  const years = Array.from({ length: 2099 - 1921 + 1 }, (_, i) => 1921 + i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchCalendar = async (yr: number, mo: number) => {
    try {
      const data = await api.admin.getCalendarMonth(yr, mo);
      setMonthData(data);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    }
  };

  useEffect(() => {
    fetchCalendar(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      if (currentYear > 1921) {
        setCurrentYear(currentYear - 1);
        setCurrentMonth(12);
      }
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      if (currentYear < 2099) {
        setCurrentYear(currentYear + 1);
        setCurrentMonth(1);
      }
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const jumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Determine starting blank days for month grid
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun
  const totalMonthRevenue = monthData.reduce((acc, d) => acc + Number(d.total_revenue), 0);
  const totalMonthBills = monthData.reduce((acc, d) => acc + d.bills_count, 0);

  return (
    <div className="bento-card p-6 flex flex-col gap-4">
      {/* Header with Title & Year/Month selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--bento-card-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400 border border-sky-500/25">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
                Revenue Calendar
                <span className="text-xs px-2 py-0.5 rounded-full bento-pill-blue font-medium">
                  1921 - 2099
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Click any day to inspect itemized bills, staff performance & modifiers
              </p>
            </div>
          </div>
        </div>

        {/* Year Dropdown & Month Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={jumpToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500/8 dark:bg-white/5 hover:bg-sky-500/15 text-[var(--text-main)] border border-[var(--bento-card-border)] transition cursor-pointer"
          >
            Today
          </button>

          <button
            onClick={handlePrevMonth}
            disabled={currentYear === 1921 && currentMonth === 1}
            className="p-1.5 rounded-xl bg-sky-500/8 dark:bg-white/5 hover:bg-sky-500/15 text-[var(--text-main)] border border-[var(--bento-card-border)] transition disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Selector */}
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="bg-white dark:bg-slate-900 text-sm font-semibold text-sky-700 dark:text-sky-300 border border-sky-400/30 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-sky-500 transition shadow-sm"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1} className="bg-white dark:bg-slate-900 text-[var(--text-main)]">
                {m}
              </option>
            ))}
          </select>

          {/* Year Selector (1921 to 2099) */}
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="bg-white dark:bg-slate-900 text-sm font-semibold text-sky-700 dark:text-sky-300 border border-sky-400/30 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-sky-500 transition shadow-sm"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-slate-900 text-[var(--text-main)]">
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            disabled={currentYear === 2099 && currentMonth === 12}
            className="p-1.5 rounded-xl bg-sky-500/8 dark:bg-white/5 hover:bg-sky-500/15 text-[var(--text-main)] border border-[var(--bento-card-border)] transition disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Metrics Header Banner */}
      <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-sky-500/6 dark:bg-white/[0.03] border border-[var(--bento-card-border)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Month Total: <strong className="text-[var(--text-main)] font-bold">₹{totalMonthRevenue.toLocaleString()}</strong></span>
        </div>
        <div className="text-[var(--text-muted)]">
          Bills: <strong className="text-[var(--text-main)]">{totalMonthBills}</strong>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider py-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Leading blanks */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`blank-${i}`} className="h-16 rounded-xl bg-sky-500/[0.02] dark:bg-white/[0.01]" />
        ))}

        {/* Days of month */}
        {monthData.map((dayItem) => {
          const dayNum = parseInt(dayItem.date.split('-')[2], 10);
          const hasRevenue = Number(dayItem.total_revenue) > 0;
          const isSelected = selectedDate === dayItem.date;
          const isToday =
            today.getFullYear() === currentYear &&
            today.getMonth() + 1 === currentMonth &&
            today.getDate() === dayNum;

          let badgeStyle = 'bg-white dark:bg-slate-900/40 border-[var(--bento-card-border)] text-[var(--text-muted)] hover:border-sky-400/50 hover:bg-sky-500/5';
          if (isSelected) {
            badgeStyle = 'bg-sky-500/15 border-sky-500 text-sky-900 dark:text-white shadow-md shadow-sky-500/20';
          } else if (dayItem.intensity === 'high') {
            badgeStyle = 'bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20';
          } else if (dayItem.intensity === 'medium') {
            badgeStyle = 'bg-sky-500/12 border-sky-500/35 text-sky-800 dark:text-sky-300 hover:bg-sky-500/20';
          } else if (dayItem.intensity === 'low') {
            badgeStyle = 'bg-blue-500/8 border-blue-500/25 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15';
          }

          return (
            <button
              key={dayItem.date}
              onClick={() => onSelectDate(dayItem.date)}
              className={`h-16 rounded-xl border p-1.5 flex flex-col justify-between items-start transition relative group text-left cursor-pointer ${badgeStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold ${isToday ? 'px-1.5 py-0.5 rounded-full bg-sky-600 text-white' : ''}`}>
                  {dayNum}
                </span>
                {hasRevenue && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                )}
              </div>

              {hasRevenue ? (
                <div className="w-full truncate">
                  <p className="text-[11px] font-extrabold truncate text-[var(--text-main)]">
                    ₹{Number(dayItem.total_revenue).toLocaleString()}
                  </p>
                  <p className="text-[9px] opacity-70 truncate">
                    {dayItem.bills_count} bills
                  </p>
                </div>
              ) : (
                <span className="text-[9px] opacity-40">--</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] border-t border-[var(--bento-card-border)] pt-3 flex-wrap">
        <span className="font-semibold">Intensity:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-sky-500/8 border border-sky-500/25" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-sky-500/15 border border-sky-500/35" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500/15 border border-emerald-500/35" />
          <span>High (Peak)</span>
        </div>
      </div>
    </div>
  );
};
