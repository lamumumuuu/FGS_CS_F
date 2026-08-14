// app/announcement/components/TimeWheelPicker.tsx

/**
 * 转轮（密码锁）样式的时间选择器（紧凑版）
 *
 * 用于替代原生 datetime-local 输入框，外观类似手机密码锁/转轮选择器。
 * 包含 4 列：年、月、日、时，每列可上下滚动（点击箭头或点击相邻项）选择数值。
 * 选中项居中高亮（放大、加粗、深色文字），上下各显示 2 个相邻项（缩小、半透明）。
 *
 * 配色沿用羊皮纸风格：背景 #ecdbb5，选中项 #2d1f10，边框 #3d2b1f。
 *
 * 为缩小整体高度，已做以下调整：
 * - 可见项数量由 5 减为 3
 * - 单项高度由 36px 减为 26px
 * - 箭头按钮和内边距缩小
 * - 单位标签更紧凑
 */

"use client";

import { useMemo, useRef, useEffect, useCallback } from "react";

interface TimeWheelPickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  label?: string;
}

interface WheelColumnProps {
  options: number[];
  current: number;
  onSelect: (val: number) => void;
  unit: string;
  format?: (val: number) => string;
}

const COLORS = {
  bg: "#ecdbb5",
  selected: "#2d1f10",
  border: "#3d2b1f",
  muted: "#6b5740",
};

// 紧凑调整：可见项 3 项，每项高 26px
const VISIBLE_COUNT = 3;
const ITEM_HEIGHT = 26;

function WheelColumn({ options, current, onSelect, unit, format }: WheelColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatLabel = format || ((val: number) => String(val));
  const currentIndex = Math.max(0, options.indexOf(current));

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const targetOffset = currentIndex * ITEM_HEIGHT;
    container.scrollTo({ top: targetOffset, behavior: "smooth" });
  }, [currentIndex]);

  const handleScroll = useCallback(() => {
    const container = listRef.current;
    if (!container) return;

    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const scrollTop = container.scrollTop;
      const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(options.length - 1, nearestIndex));
      const nearestValue = options[clampedIndex];
      if (nearestValue !== current) {
        onSelect(nearestValue);
      }
      container.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: "smooth" });
    }, 120);
  }, [options, current, onSelect]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const idx = options.indexOf(current);
      if (idx === -1) return;
      const nextIdx = (idx + direction + options.length) % options.length;
      onSelect(options[nextIdx]);
    },
    [options, current, onSelect]
  );

  const handleClick = useCallback(
    (val: number) => {
      onSelect(val);
    },
    [onSelect]
  );

  return (
    <div className="flex flex-col items-center select-none">
      {/* 上箭头（缩小） */}
      <button
        type="button"
        onClick={() => step(1)}
        className="w-full flex items-center justify-center py-0.5 text-[#3d2b1f] hover:bg-[#dcc7a0] rounded-t transition-colors"
        aria-label={`增加${unit}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* 可滚动数值列表（高度变小） */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="w-full overflow-y-scroll"
        style={{
          height: ITEM_HEIGHT * VISIBLE_COUNT,
          scrollSnapType: "y mandatory",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)",
        }}
      >
        {/* 顶部占位：因为当前项需要居中，占位高度为 (VISIBLE_COUNT - 1) / 2 项 */}
        <div style={{ height: ITEM_HEIGHT }} />
        {options.map((val) => {
          const isSelected = val === current;
          const distance = Math.abs(options.indexOf(val) - currentIndex);
          return (
            <div
              key={val}
              onClick={() => handleClick(val)}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
              }}
              className={`flex items-center justify-center cursor-pointer transition-all duration-150 ${
                isSelected
                  ? "text-base font-bold"
                  : distance === 1
                  ? "text-sm opacity-50"
                  : "text-xs opacity-25"
              }`}
            >
              <span style={{ color: isSelected ? COLORS.selected : COLORS.muted }}>
                {formatLabel(val)}
              </span>
            </div>
          );
        })}
        <div style={{ height: ITEM_HEIGHT }} />
      </div>

      {/* 下箭头（缩小） */}
      <button
        type="button"
        onClick={() => step(-1)}
        className="w-full flex items-center justify-center py-0.5 text-[#3d2b1f] hover:bg-[#dcc7a0] rounded-b transition-colors"
        aria-label={`减少${unit}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 单位标签（更紧凑） */}
      <div className="text-[10px] text-[#6b5740] mt-0.5 font-medium">{unit}</div>
    </div>
  );
}

/** 解析 YYYY-MM-DDTHH:00 字符串为各部分数值 */
function parseValue(value: string): { year: number; month: number; day: number; hour: number } {
  const now = new Date();
  const fallback = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
  };
  if (!value) return fallback;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})/);
  if (!match) return fallback;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
    hour: parseInt(match[4], 10),
  };
}

/** 解析 min 字符串为各部分最小值 */
function parseMin(min?: string): { year: number; month: number; day: number; hour: number } | null {
  if (!min) return null;
  const match = min.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
    hour: parseInt(match[4], 10),
  };
}

export default function TimeWheelPicker({ value, onChange, min, label }: TimeWheelPickerProps) {
  const parts = parseValue(value);
  const minParts = parseMin(min);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y <= currentYear + 5; y++) list.push(y);
    return list;
  }, [currentYear]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const isBeforeMin = useCallback(
    (y: number, mo: number, d: number, h: number) => {
      if (!minParts) return false;
      if (y !== minParts.year) return y < minParts.year;
      if (mo !== minParts.month) return mo < minParts.month;
      if (d !== minParts.day) return d < minParts.day;
      return h < minParts.hour;
    },
    [minParts]
  );

  const emit = useCallback(
    (y: number, mo: number, d: number, h: number) => {
      const next = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:00`;
      onChange(next);
    },
    [onChange]
  );

  const handleYearChange = useCallback(
    (y: number) => {
      let mo = parts.month;
      let d = parts.day;
      let h = parts.hour;
      if (isBeforeMin(y, mo, d, h)) {
        if (minParts) {
          mo = minParts.month;
          d = minParts.day;
          h = minParts.hour;
        }
      }
      emit(y, mo, d, h);
    },
    [parts, minParts, isBeforeMin, emit]
  );

  const handleMonthChange = useCallback(
    (mo: number) => {
      let d = parts.day;
      let h = parts.hour;
      if (isBeforeMin(parts.year, mo, d, h) && minParts) {
        d = minParts.day;
        h = minParts.hour;
      }
      emit(parts.year, mo, d, h);
    },
    [parts, minParts, isBeforeMin, emit]
  );

  const handleDayChange = useCallback(
    (d: number) => {
      let h = parts.hour;
      if (isBeforeMin(parts.year, parts.month, d, h) && minParts) {
        h = minParts.hour;
      }
      emit(parts.year, parts.month, d, h);
    },
    [parts, minParts, isBeforeMin, emit]
  );

  const handleHourChange = useCallback(
    (h: number) => {
      if (isBeforeMin(parts.year, parts.month, parts.day, h)) return;
      emit(parts.year, parts.month, parts.day, h);
    },
    [parts, isBeforeMin, emit]
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#2d1f10] mb-1">{label}</label>
      )}
      <div
        className="relative rounded-lg border p-1"
        style={{ backgroundColor: COLORS.bg, borderColor: COLORS.border, borderWidth: "1px" }}
      >
        {/* 中间高亮指示条 */}
        <div
          className="pointer-events-none absolute left-1 right-1 rounded"
          style={{
            top: `calc(50% - ${ITEM_HEIGHT / 2}px)`,
            height: ITEM_HEIGHT,
            backgroundColor: "rgba(61, 43, 31, 0.08)",
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        />
        {/* 四列转轮 */}
        <div className="relative grid grid-cols-4 gap-0.5">
          <WheelColumn
            options={years}
            current={parts.year}
            onSelect={handleYearChange}
            unit="年"
          />
          <WheelColumn
            options={months}
            current={parts.month}
            onSelect={handleMonthChange}
            unit="月"
            format={(v) => String(v).padStart(2, "0")}
          />
          <WheelColumn
            options={days}
            current={parts.day}
            onSelect={handleDayChange}
            unit="日"
            format={(v) => String(v).padStart(2, "0")}
          />
          <WheelColumn
            options={hours}
            current={parts.hour}
            onSelect={handleHourChange}
            unit="时"
            format={(v) => String(v).padStart(2, "0")}
          />
        </div>
      </div>
    </div>
  );
}