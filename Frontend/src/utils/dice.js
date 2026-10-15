import confetti from "canvas-confetti";

const DICE_FORMULA_REGEX = /^(\d*)d(\d+)(?:kh(\d+))?([+-]\d+)?$/;
const CLEAN_WHITESPACE_REGEX = /\s+/g;
const CONFETTI_COLORS = Object.freeze(["#fbbf24", "#f59e0b", "#ef4444", "#3b82f6", "#10b981"]);

export function parseDiceFormula(formula) {
  if (!formula) return { count: 1, sides: 20, modifier: 0 };
  const clean = formula.toLowerCase().replace(CLEAN_WHITESPACE_REGEX, "");

  // الگوهایی مثل 2d20kh1+5 یا 4d6kh3 یا 1d20+3
  const match = clean.match(DICE_FORMULA_REGEX);

  if (!match) {
    return { count: 1, sides: 20, modifier: 0 };
  }

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10) || 20;
  const keepHighest = match[3] ? parseInt(match[3], 10) : undefined;
  const modifier = match[4] ? parseInt(match[4], 10) : 0;

  return {
    count: Math.min(Math.max(count, 1), 50),
    sides: Math.min(Math.max(sides, 2), 1000),
    modifier,
    keepHighest,
  };
}

export function rollDice(
    formula,
    userName = "بازیکن",
    userColor = "#f59e0b",
    userId = "user-1",
    label = ""
) {
  const parsed = parseDiceFormula(formula);
  const rawResults = [];

  for (let i = 0; i < parsed.count; i++) {
    rawResults.push(Math.floor(Math.random() * parsed.sides) + 1);
  }

  const dice = rawResults.map((val) => ({
    sides: parsed.sides,
    result: val,
  }));

  // فیلتر تاس‌های با بالاترین نتیجه (مثلاً 4d6kh3)
  if (parsed.keepHighest && parsed.keepHighest < dice.length) {
    const sortedIndices = dice
        .map((d, index) => ({ index, result: d.result }))
        .sort((a, b) => b.result - a.result);

    const keptIndices = new Set(
        sortedIndices.slice(0, parsed.keepHighest).map((s) => s.index)
    );

    for (let i = 0; i < dice.length; i++) {
      if (!keptIndices.has(i)) {
        dice[i].dropped = true;
      }
    }
  }

  let activeDiceSum = 0;
  for (let i = 0; i < dice.length; i++) {
    if (!dice[i].dropped) {
      activeDiceSum += dice[i].result;
    }
  }

  const total = activeDiceSum + parsed.modifier;

  // بررسی ضربه حساس (Natural 20)
  const isD20Single = parsed.sides === 20 && parsed.count === 1;
  const isCriticalHit = isD20Single && dice[0].result === 20;
  const isCriticalFail = isD20Single && dice[0].result === 1;

  if (isCriticalHit) {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS,
      });
    } catch {
      // نادیده گرفتن در صورت عدم پشتیبانی یا خطای محیطی
    }
  }

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    userName,
    userColor,
    formula,
    dice,
    modifier: parsed.modifier,
    total,
    isCriticalHit,
    isCriticalFail,
    timestamp: new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    label,
  };
}