// components/Calculator.tsx

/**
 * 财务专用计算器组件
 *
 * 默认收纳为页面左上角的悬浮圆形按钮，点击后展开完整计算器界面。
 * 提供基本加减乘除、清空、删除等功能，仅在财务相关页面使用。
 *
 * 拖拽功能：
 * - 展开状态下可通过标题栏拖动整个计算器到页面任意位置
 * - 拖拽时添加边界限制，防止组件拖出可视区域
 * - 收纳状态下的圆形按钮同样支持拖拽
 * - 拖拽时使用 fixed 定位，确保跨视口尺寸可用
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/** 默认左上角位置的计算边距 */
const DEFAULT_MARGIN = 24;

/** 计算左上角默认位置 */
function getDefaultPosition(): { x: number; y: number } {
  return {
    x: DEFAULT_MARGIN, // 左上角横向边距
    y: DEFAULT_MARGIN + 72, // 左上角纵向边距（留出 Navbar 高度 72px）
  };
}

export default function Calculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewInput, setWaitingForNewInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 拖拽相关状态（默认左上角位置）
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      return getDefaultPosition();
    }
    return { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);

  // 监听页面切换，重置计算器到默认右下角位置
  const pathname = usePathname();
  useEffect(() => {
    setPosition(getDefaultPosition());
    setIsOpen(false);
  }, [pathname]);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number }>({
    mouseX: 0,
    mouseY: 0,
    elemX: 0,
    elemY: 0,
  });

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const inputDigit = (digit: string) => {
    if (waitingForNewInput) {
      setDisplay(digit);
      setWaitingForNewInput(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForNewInput) {
      setDisplay("0.");
      setWaitingForNewInput(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewInput(false);
  };

  const backspace = () => {
    if (waitingForNewInput) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? 0 : a / b;
      default:
        return b;
    }
  };

  const performOperation = (nextOperator: string) => {
    const currentValue = parseFloat(display);
    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operator) {
      const result = calculate(previousValue, currentValue, operator);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    setWaitingForNewInput(true);
    setOperator(nextOperator === "=" ? null : nextOperator);
    if (nextOperator === "=") {
      setPreviousValue(null);
    }
  };

  const toggleSign = () => {
    if (display === "0") return;
    setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
  };

  const percent = () => {
    const value = parseFloat(display) / 100;
    setDisplay(String(value));
  };

  /* ------------------------------------------------------------------ */
  /*  键盘输入支持（仅在计算器展开状态下生效）                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 当焦点在 input/textarea/select/contenteditable 中时，不响应计算器键盘事件（避免冲突）
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      // 数字键 0-9 → 输入对应数字
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        inputDigit(key);
        return;
      }

      // 小数点
      if (key === ".") {
        e.preventDefault();
        inputDot();
        return;
      }

      // 运算符 + - * /
      if (key === "+" || key === "-" || key === "*" || key === "/") {
        e.preventDefault();
        performOperation(key);
        return;
      }

      // Enter 或 = → 执行计算
      if (key === "Enter" || key === "=") {
        e.preventDefault();
        performOperation("=");
        return;
      }

      // Escape → 清空
      if (key === "Escape") {
        e.preventDefault();
        clearAll();
        return;
      }

      // Backspace → 退格
      if (key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }

      // 百分号
      if (key === "%") {
        e.preventDefault();
        percent();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, display, previousValue, operator, waitingForNewInput]);

  /* ------------------------------------------------------------------ */
  /*  拖拽逻辑                                                          */
  /* ------------------------------------------------------------------ */

  /** 开始拖拽：记录鼠标和元素初始位置 */
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      /// 仅在展开状态的标题栏或收纳状态的圆形按钮上触发拖拽
      const target = e.currentTarget as HTMLElement;
      /// 阻止默认行为，避免与点击事件冲突
      e.preventDefault();
      e.stopPropagation();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elemX: rect.left,
        elemY: rect.top,
      };
      setIsDragging(true);
    },
    []
  );

  /** 拖拽中：根据鼠标移动更新元素位置，并施加边界限制 */
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      let newX = dragStartRef.current.elemX + deltaX;
      let newY = dragStartRef.current.elemY + deltaY;

      /// 边界限制：防止拖出可视区域
      const containerWidth = containerRef.current?.offsetWidth || 56;
      const containerHeight = containerRef.current?.offsetHeight || 56;
      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const buttonBase =
    "h-12 rounded-lg font-shan text-lg font-medium transition-all active:scale-95 select-none";

  const numBtnClass = `${buttonBase} bg-white hover:bg-gray-50 text-gray-800 border border-gray-200`;
  const funcBtnClass = `${buttonBase} bg-gray-200 hover:bg-gray-300 text-gray-700`;
  const opBtnClass = `${buttonBase} bg-[#0D9488] hover:bg-[#0F766E] text-white`;
  const eqBtnClass = `${buttonBase} bg-amber-600 hover:bg-amber-700 text-white`;

  return (
    <div
      ref={containerRef}
      className="fixed z-[600]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
    >
      {/* 展开状态 */}
      {isOpen ? (
        <div
          className="w-72 p-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            backgroundColor: "#f3efe5",
            border: "1.5px solid rgba(15, 118, 110, 0.3)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* 标题栏：可拖拽区域 */}
          <div
            onMouseDown={handleDragStart}
            className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300 cursor-grab active:cursor-grabbing"
            title="拖拽移动计算器"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🧮</span>
              <span className="font-shan font-bold text-gray-700">财务计算器</span>
              <span className="text-xs text-gray-400 ml-1">⇆ 可拖动</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-gray-500 hover:text-gray-800 text-lg w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200"
            >
              ×
            </button>
          </div>

          {/* 显示屏 */}
          <div
            className="mb-3 px-3 py-3 rounded-lg text-right"
            style={{
              backgroundColor: "rgba(15, 118, 110, 0.08)",
              border: "1px solid rgba(15, 118, 110, 0.2)",
            }}
          >
            <div className="text-xs text-gray-500 h-4">
              {previousValue !== null && operator ? `${previousValue} ${operator}` : ""}
            </div>
            <div className="text-2xl font-bold text-gray-800 font-shan truncate">
              {display}
            </div>
          </div>

          {/* 按键区 */}
          <div className="grid grid-cols-4 gap-2">
            <button onClick={clearAll} className={funcBtnClass}>C</button>
            <button onClick={backspace} className={funcBtnClass}>⌫</button>
            <button onClick={percent} className={funcBtnClass}>%</button>
            <button onClick={() => performOperation("/")} className={opBtnClass}>÷</button>

            <button onClick={() => inputDigit("7")} className={numBtnClass}>7</button>
            <button onClick={() => inputDigit("8")} className={numBtnClass}>8</button>
            <button onClick={() => inputDigit("9")} className={numBtnClass}>9</button>
            <button onClick={() => performOperation("*")} className={opBtnClass}>×</button>

            <button onClick={() => inputDigit("4")} className={numBtnClass}>4</button>
            <button onClick={() => inputDigit("5")} className={numBtnClass}>5</button>
            <button onClick={() => inputDigit("6")} className={numBtnClass}>6</button>
            <button onClick={() => performOperation("-")} className={opBtnClass}>−</button>

            <button onClick={() => inputDigit("1")} className={numBtnClass}>1</button>
            <button onClick={() => inputDigit("2")} className={numBtnClass}>2</button>
            <button onClick={() => inputDigit("3")} className={numBtnClass}>3</button>
            <button onClick={() => performOperation("+")} className={opBtnClass}>+</button>

            <button onClick={toggleSign} className={numBtnClass}>±</button>
            <button onClick={() => inputDigit("0")} className={numBtnClass}>0</button>
            <button onClick={inputDot} className={numBtnClass}>.</button>
            <button onClick={() => performOperation("=")} className={eqBtnClass}>=</button>
          </div>
        </div>
      ) : (
        /* 收纳状态：圆形悬浮按钮（同样支持拖拽） */
        <button
          onMouseDown={handleDragStart}
          onClick={(e) => {
            /// 仅当未发生明显拖拽时才视为点击打开
            if (!isDragging) {
              e.stopPropagation();
              setIsOpen(true);
            }
          }}
          className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(13, 148, 136, 0.4)",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          title="打开计算器（可拖拽移动）"
        >
          🧮
        </button>
      )}
    </div>
  );
}
