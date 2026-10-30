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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Revenue Calendar
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  1921 - 2099
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Click any day to inspect itemized bills, staff performance & modifiers
              </p>
            </div>
          </div>
        </div>

        {/* Year Dropdown & Month Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={jumpToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
          >
            Today
          </button>

          <button
            onClick={handlePrevMonth}
            disabled={currentYear === 1921 && currentMonth === 1}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Selector */}
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="bg-[#1a1638] text-sm font-semibold text-purple-200 border border-purple-500/30 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-purple-400 transition"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1} className="bg-[#120f2b] text-white">
                {m}
              </option>
            ))}
          </select>

          {/* Year Selector (1921 to 2099) */}
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="bg-[#1a1638] text-sm font-semibold text-purple-200 border border-purple-500/30 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-purple-400 transition"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-[#120f2b] text-white">
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            disabled={currentYear === 2099 && currentMonth === 12}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Stats bar */}
      <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-2 text-slate-300">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Month Total: <strong className="text-white">₹{totalMonthRevenue.toLocaleString()}</strong></span>
        </div>
        <div className="text-slate-400">
          Bills: <strong className="text-slate-200">{totalMonthBills}</strong>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Leading blanks */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`blank-${i}`} className="h-16 rounded-xl bg-white/[0.01]" />
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

          let badgeStyle = 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-purple-500/40 hover:bg-purple-900/10';
          if (isSelected) {
            badgeStyle = 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-500/20';
          } else if (dayItem.intensity === 'high') {
            badgeStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25';
          } else if (dayItem.intensity === 'medium') {
            badgeStyle = 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25';
          } else if (dayItem.intensity === 'low') {
            badgeStyle = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20';
          }

          return (
            <button
              key={dayItem.date}
              onClick={() => onSelectDate(dayItem.date)}
              className={`h-16 rounded-xl border p-1.5 flex flex-col justify-between items-start transition relative group text-left ${badgeStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold ${isToday ? 'px-1.5 py-0.5 rounded-full bg-purple-500 text-white' : ''}`}>
                  {dayNum}
                </span>
                {hasRevenue && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>

              {hasRevenue ? (
                <div className="w-full">
                  <div className="text-[11px] font-extrabold text-white truncate">
                    ₹{Number(dayItem.total_revenue) >= 1000
                      ? `${(Number(dayItem.total_revenue) / 1000).toFixed(1)}k`
                      : Number(dayItem.total_revenue)}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {dayItem.bills_count} bill{dayItem.bills_count > 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400">—</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
