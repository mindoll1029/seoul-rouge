import React, { useEffect, useMemo, useState } from "react";
import { Heart, Droplets, Smile, Package, Crosshair, Utensils, Shield, ChevronRight, RefreshCw, Radio, Zap } from "lucide-react";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (p) => Math.random() < p;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).slice(2, 9);
const copy = (v) => JSON.parse(JSON.stringify(v));

const PERKS = [
  { id: "scavenger", name: "약탈자", desc: "수색·약탈 계열 보상 증가" },
  { id: "marksman", name: "사수", desc: "사격 피해 증가" },
  { id: "medic", name: "응급처치", desc: "의약품 회복량 증가" },
  { id: "runner", name: "도주본능", desc: "도주 성공률 증가" },
  { id: "ironwill", name: "강한 멘탈", desc: "멘탈 하락 완화" },
  { id: "tactician", name: "전술 감각", desc: "방어와 전투 안정성 증가" },
  { id: "stomach", name: "버티는 위장", desc: "허기 감소 속도 완화" },
  { id: "waterwise", name: "절수 습관", desc: "갈증 감소 속도 완화" },
  { id: "survivor", name: "생존 체질", desc: "최대 체력 +12, 즉시 체력 +12" },
];

const CLASS_OPTIONS = [
  {
    id: "student",
    name: "대학생",
    desc: "배움이 빠르다. 성장 속도가 조금 빠름.",
    unlockWins: 0,
    base: { maxHp: 76, hp: 76, food: 2, water: 2, meds: 1, ammo: 2, scrap: 1, weapon: 1, hunger: 74, thirst: 74, morale: 58 },
    perks: ["quickstudy"],
  },
  {
    id: "soldier",
    name: "예비역",
    desc: "초반 전투가 강하다. 탄약과 전투 적성이 높음.",
    unlockWins: 0,
    base: { maxHp: 90, hp: 90, food: 2, water: 2, meds: 1, ammo: 6, scrap: 1, weapon: 2, hunger: 72, thirst: 72, morale: 60 },
    perks: ["marksman"],
  },
  {
    id: "mechanic",
    name: "정비사",
    desc: "부품을 다루는 데 능숙하다. 고철과 제작 계열에 강함.",
    unlockWins: 0,
    base: { maxHp: 82, hp: 82, food: 2, water: 2, meds: 1, ammo: 2, scrap: 5, weapon: 1, hunger: 74, thirst: 74, morale: 57 },
    perks: ["scavenger"],
  },
  {
    id: "paramedic",
    name: "응급구조사",
    desc: "치료 효율이 높고 위기에서 잘 버틴다.",
    unlockWins: 1,
    base: { maxHp: 80, hp: 80, food: 2, water: 3, meds: 3, ammo: 2, scrap: 1, weapon: 1, hunger: 74, thirst: 76, morale: 61 },
    perks: ["medic"],
  },
  {
    id: "drone",
    name: "드론 기사",
    desc: "정찰과 기술에 익숙하다. 위기 회피 능력이 좋음.",
    unlockWins: 3,
    base: { maxHp: 78, hp: 78, food: 2, water: 2, meds: 1, ammo: 3, scrap: 4, weapon: 1, hunger: 74, thirst: 74, morale: 62 },
    perks: ["runner", "tactician"],
  },
];

const initialMeta = {
  wins: 0,
  bestDistance: 0,
  bestDay: 0,
  totalRuns: 0,
};


const ITEM_CONFIG = {
  food: {
    label: "식량",
    desc: "허기를 크게 회복한다",
    shortDesc: "허기 회복",
    icon: Package,
    accent: "amber",
  },
  water: {
    label: "물",
    desc: "갈증을 크게 회복한다",
    shortDesc: "갈증 회복",
    icon: Droplets,
    accent: "sky",
  },
  meds: {
    label: "의약품",
    desc: "상처와 피로를 추스른다",
    shortDesc: "체력 회복",
    icon: Heart,
    accent: "rose",
  },
  ammo: {
    label: "탄약",
    desc: "전투에서 사격 시 자동으로 소모된다",
    shortDesc: "전투 소모",
    icon: Crosshair,
    accent: "zinc",
  },
  scrap: {
    label: "고철",
    desc: "교환과 기술 이벤트에 사용된다",
    shortDesc: "교환 재료",
    icon: Shield,
    accent: "slate",
  },
};

const ITEM_DETAILS = {
  food: [
    { id: "canned_food", name: "통조림", desc: "짠맛만 남았지만 가장 믿을 만한 비상식량이다." },
    { id: "dog_food", name: "개사료", desc: "사람 입에는 거칠지만 배를 채우기엔 충분하다." },
    { id: "protein_bar", name: "프로틴 바", desc: "씹을수록 분필 같은 맛이 난다." },
  ],
  water: [
    { id: "bottled_water", name: "생수", desc: "공장에서 포장된 물. 가장 안전하다." },
    { id: "purified_water", name: "정수된 물", desc: "불안하지만 마실 수는 있는 물이다." },
    { id: "electrolyte_water", name: "전해질 음료", desc: "갈증과 기진맥진함을 함께 달랜다." },
  ],
  meds: [
    { id: "bandage", name: "붕대", desc: "피를 멎게 하고 상처를 감싼다." },
    { id: "disinfectant", name: "소독약", desc: "따갑지만 감염을 막아 준다." },
    { id: "suture_kit", name: "봉합 키트", desc: "상처가 깊을 때 마지막으로 기대는 도구다." },
  ],
  ammo: [
    { id: "pistol_round", name: "권총 탄약", desc: "가장 흔하게 구할 수 있는 탄약이다." },
    { id: "rifle_round", name: "소총 탄약", desc: "위력은 좋지만 귀하다." },
    { id: "shotgun_shell", name: "산탄", desc: "가까운 거리에서 위협적이다." },
  ],
  scrap: [
    { id: "copper_wire", name: "구리선", desc: "배터리나 라디오 수리에 쓸 만하다." },
    { id: "steel_plate", name: "철판 조각", desc: "무겁지만 어디든 써먹을 수 있다." },
    { id: "bearing", name: "베어링", desc: "기계 부품 속에 숨어 있던 작은 보물이다." },
  ],
};

const CATEGORY_ORDER = ["food", "water", "meds", "ammo", "scrap"];

function createEmptyInventory() {
  const inventory = {};
  CATEGORY_ORDER.forEach((category) => {
    ITEM_DETAILS[category].forEach((item) => {
      inventory[item.id] = 0;
    });
  });
  return inventory;
}

function getItemMeta(itemId) {
  for (const category of CATEGORY_ORDER) {
    const found = ITEM_DETAILS[category].find((item) => item.id === itemId);
    if (found) return { ...found, category };
  }
  return null;
}

function getItemUsageDescription(itemMeta) {
  if (!itemMeta) return "";
  if (itemMeta.category === "food") return "허기를 채우고, 멘탈을 회복합니다.";
  if (itemMeta.category === "water") return "갈증을 가라앉힙니다.";
  if (itemMeta.id === "bandage") return "상처를 처치해 체력을 회복합니다.";
  if (itemMeta.category === "meds") return "상처를 처치하고 체력을 회복합니다.";
  if (itemMeta.category === "ammo") return "전투 중 사격 시 자동으로 소모됩니다. 직접 사용하실 수는 없습니다.";
  if (itemMeta.category === "scrap") return "교환, 제작, 기술 이벤트에 쓰이는 재료입니다. 직접 사용하실 수는 없습니다.";
  return "";
}


function getCategoryTotalFromInventory(run, category) {
  if (!run?.inventory) return 0;
  return ITEM_DETAILS[category].reduce((sum, item) => sum + (run.inventory[item.id] || 0), 0);
}

function syncResourceCounts(run) {
  CATEGORY_ORDER.forEach((category) => {
    run[category] = getCategoryTotalFromInventory(run, category);
  });
}

function pickDetailItem(category, biasId) {
  const pool = ITEM_DETAILS[category];
  if (biasId && pool.some((item) => item.id === biasId)) {
    return pool.find((item) => item.id === biasId);
  }
  return copy(pick(pool));
}

function addInventoryItems(run, category, count = 1, biasId = null) {
  if (!run.inventory) run.inventory = createEmptyInventory();
  const gained = [];
  for (let i = 0; i < count; i += 1) {
    const target = pickDetailItem(category, biasId);
    run.inventory[target.id] = (run.inventory[target.id] || 0) + 1;
    gained.push(target);
  }
  syncResourceCounts(run);
  return gained;
}

function removeInventoryItems(run, category, count = 1, preferredId = null) {
  if (!run.inventory) run.inventory = createEmptyInventory();
  const removed = [];
  for (let i = 0; i < count; i += 1) {
    let targetId = null;
    if (preferredId && (run.inventory[preferredId] || 0) > 0) {
      targetId = preferredId;
    } else {
      const candidates = ITEM_DETAILS[category]
        .filter((item) => (run.inventory[item.id] || 0) > 0)
        .sort((a, b) => (run.inventory[b.id] || 0) - (run.inventory[a.id] || 0));
      if (candidates.length === 0) break;
      targetId = candidates[0].id;
    }
    run.inventory[targetId] -= 1;
    removed.push(getItemMeta(targetId));
  }
  syncResourceCounts(run);
  return removed;
}

function applyResourceDeltaToInventory(before, run) {
  if (!run.inventory) run.inventory = createEmptyInventory();
  const gained = [];
  const lost = [];

  CATEGORY_ORDER.forEach((category) => {
    const beforeValue = before[category] || 0;
    const afterValue = run[category] || 0;
    const delta = afterValue - beforeValue;

    if (delta > 0) {
      gained.push(...addInventoryItems(run, category, delta));
    } else if (delta < 0) {
      lost.push(...removeInventoryItems(run, category, Math.abs(delta)));
    }
  });

  syncResourceCounts(run);
  return { gained, lost };
}

function formatItemNotices(items) {
  const map = new Map();
  items.forEach((item) => {
    if (!item) return;
    map.set(item.name, (map.get(item.name) || 0) + 1);
  });
  return [...map.entries()].map(([name, count]) => `${name} +${count}`);
}

function createStartingInventory(base) {
  const run = { inventory: createEmptyInventory() };
  CATEGORY_ORDER.forEach((category) => {
    const count = base[category] || 0;
    addInventoryItems(run, category, count);
  });
  return run.inventory;
}

function cloneChoice(choice) {
  return {
    ...choice,
    disabled: choice.disabled,
    effect: choice.effect,
  };
}

function cloneEvent(event) {
  return {
    ...event,
    choices: event.choices.map(cloneChoice),
  };
}

function cloneEnemy(enemy) {
  return {
    ...enemy,
    atk: [...enemy.atk],
    loot: enemy.loot,
  };
}

function cloneBattleState(battleState) {
  return {
    ...battleState,
    enemy: cloneEnemy(battleState.enemy),
  };
}

function hasPerk(run, perkId) {
  return run.perks.includes(perkId);
}

function availablePerks(run) {
  return PERKS.filter((p) => !run.perks.includes(p.id) && p.id !== "quickstudy");
}

function gainExp(run, amount, messages, setPerkOffer) {
  const boost = run.classId === "student" || hasPerk(run, "quickstudy") ? 1.15 : 1;
  const gained = Math.round(amount * boost);
  run.exp += gained;
  messages.push(`경험치 +${gained}`);
  while (run.exp >= run.nextLevelExp) {
    run.exp -= run.nextLevelExp;
    run.level += 1;
    run.nextLevelExp = Math.round(run.nextLevelExp * 1.35);
    messages.push(`레벨 ${run.level} 도달`);
    const candidates = availablePerks(run);
    if (candidates.length > 0 && !setPerkOffer.current) {
      const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 3);
      setPerkOffer.current = shuffled;
    }
  }
}

function heal(run, amount, messages, source = "회복") {
  const bonus = hasPerk(run, "medic") ? 4 : 0;
  const value = amount + bonus;
  const before = run.hp;
  run.hp = clamp(run.hp + value, 0, run.maxHp);
  const diff = run.hp - before;
  if (diff > 0) messages.push(`${source}: 체력 +${diff}`);
}

function hurt(run, amount, messages, source = "피해") {
  const reduction = hasPerk(run, "tactician") ? 1 : 0;
  const real = Math.max(0, amount - reduction);
  run.hp = clamp(run.hp - real, 0, run.maxHp);
  messages.push(`${source}: 체력 -${real}`);
}

function modMorale(run, amount, messages, source = "멘탈") {
  const tuned = amount < 0 && hasPerk(run, "ironwill") ? Math.ceil(amount * 0.6) : amount;
  run.morale = clamp(run.morale + tuned, 0, 100);
  if (tuned !== 0) messages.push(`${source}: 멘탈 ${tuned > 0 ? "+" : ""}${tuned}`);
}

function modHunger(run, amount) {
  run.hunger = clamp(run.hunger + amount, 0, 100);
}

function modThirst(run, amount) {
  run.thirst = clamp(run.thirst + amount, 0, 100);
}

function endTurn(run, messages, perkOfferRef) {
  run.day += 1;
  run.danger = clamp(run.danger + 0.2, 1, 10);
  const hungerLoss = hasPerk(run, "stomach") ? rand(4, 7) : rand(6, 9);
  const thirstLoss = hasPerk(run, "waterwise") ? rand(5, 8) : rand(7, 11);
  modHunger(run, -hungerLoss);
  modThirst(run, -thirstLoss);

  if (run.hunger <= 0) {
    hurt(run, 8, messages, "굶주림");
    modMorale(run, -4, messages, "탈진");
  } else if (run.hunger < 18) {
    modMorale(run, -2, messages, "심한 허기");
  }

  if (run.thirst <= 0) {
    hurt(run, 11, messages, "탈수");
    modMorale(run, -5, messages, "극심한 갈증");
  } else if (run.thirst < 18) {
    modMorale(run, -2, messages, "심한 갈증");
  }

  if (run.morale <= 0) {
    hurt(run, 4, messages, "절망");
  }

  if (run.day % 5 === 0) {
    gainExp(run, 4, messages, perkOfferRef);
  }
}

function enemyTemplate(run) {
  const scale = Math.floor(run.day / 5);
  const pool = [
    {
      name: "굶주린 약탈자",
      hp: 18 + scale * 4,
      atk: [4 + scale, 8 + scale],
      exp: 11,
      loot: (r, m) => {
        const ammo = chance(0.45) ? 1 : 0;
        const scrap = rand(1, 2);
        r.ammo += ammo;
        r.scrap += scrap;
        m.push(`전리품: 고철 +${scrap}${ammo ? `, 탄약 +${ammo}` : ""}`);
      },
    },
    {
      name: "변이 들개 떼",
      hp: 16 + scale * 5,
      atk: [5 + scale, 9 + scale],
      exp: 12,
      loot: (r, m) => {
        r.food += 1;
        m.push("잔해 속에서 통조림 1개를 건졌다");
      },
    },
    {
      name: "도로 차단조",
      hp: 22 + scale * 5,
      atk: [6 + scale, 10 + scale],
      exp: 15,
      loot: (r, m) => {
        const scrap = rand(2, 4);
        r.scrap += scrap;
        m.push(`전리품: 고철 +${scrap}`);
      },
    },
  ];
  return cloneEnemy(pick(pool));
}

function makeFinalEvent(run) {
  return {
    id: uid(),
    title: "서울 최외곽 검문선",
    text:
      "무너진 외곽 순환로 끝, 연기 너머로 마지막 검문선이 드러난다. 여길 넘으면 회색 도시는 끝난다. 하지만 어떤 끝을 택하느냐는 아직 네 손에 달려 있다.",
    choices: [
      {
        label: "검문선을 돌파해 도시를 벗어난다",
        effect: (r, messages, perkOfferRef) => {
          const power = r.hp + r.morale + r.ammo * 4 + r.weapon * 8 + r.level * 5;
          if (power >= 160) {
            messages.push("마지막 총성과 비명 뒤로, 너는 마침내 서울의 경계를 넘어섰다.");
            gainExp(r, 30, messages, perkOfferRef);
            r.flags.won = true;
            r.flags.endingType = r.flags.killCount >= 14 ? "massacre" : "survival";
          } else {
            hurt(r, 18, messages, "검문선 돌파 실패");
            modMorale(r, -8, messages, "패닉");
            messages.push("너는 아직 이 회색 도시를 벗어날 만큼 강하지 못했다.");
          }
        },
      },
      {
        label: "검문선을 장악하고 새로운 질서를 세운다",
        effect: (r, messages, perkOfferRef) => {
          const domination = r.level * 8 + r.ammo * 5 + r.scrap * 3 + r.flags.killCount * 2;
          if (domination >= 120) {
            messages.push("시체와 재 아래에서, 사람들은 너를 새로운 지배자로 받아들였다.");
            gainExp(r, 35, messages, perkOfferRef);
            r.flags.won = true;
            r.flags.endingType = "king";
          } else {
            hurt(r, 14, messages, "장악 실패");
            modMorale(r, -6, messages, "민심 이반");
            messages.push("도시는 쉽게 왕좌를 내어주지 않았다.");
          }
        },
      },
      {
        label: "교외 정착지로 향해 남은 삶을 건다",
        effect: (r, messages, perkOfferRef) => {
          const settleScore = r.food * 4 + r.water * 4 + r.meds * 3 + r.morale + r.level * 3;
          if (settleScore >= 90) {
            messages.push("서울 바깥 황량한 마을에서, 너는 더 멀리 가지 않고 살아남는 길을 택했다.");
            gainExp(r, 22, messages, perkOfferRef);
            r.flags.won = true;
            r.flags.endingType = "settlement";
          } else {
            modMorale(r, -5, messages, "막막함");
            hurt(r, 8, messages, "정착 실패");
            messages.push("떠도는 자에게 보금자리는 너무 먼 이야기였다.");
          }
        },
      },
    ],
  };
}

function generateEvent(run) {
  if (run.distance >= 500) return makeFinalEvent(run);
  if (run.day === 1 && !run.flags.introDone) {
    return {
      id: uid(),
      title: "무너진 지하철 출구",
      text: "정전된 역사를 빠져나오자 차가운 회색 공기와 함께 도시의 적막이 덮쳐온다. 살아남으려면 북쪽 집결지까지 이동해야 한다.",
      choices: [
        {
          label: "주변 상가부터 수색한다",
          effect: (r, messages, perkOfferRef) => {
            const food = hasPerk(r, "scavenger") ? 2 : 1;
            r.food += food;
            r.water += 1;
            r.distance += 4;
            gainExp(r, 7, messages, perkOfferRef);
            messages.push(`통조림 ${food}개와 생수 1병을 확보했다.`);
            r.flags.introDone = true;
          },
        },
        {
          label: "곧장 큰 도로로 이동한다",
          effect: (r, messages, perkOfferRef) => {
            r.distance += 8;
            modMorale(r, 2, messages, "전진");
            gainExp(r, 6, messages, perkOfferRef);
            r.flags.introDone = true;
          },
        },
      ],
    };
  }

  const events = [
    {
      title: "편의점 잔해",
      text: "유리문이 깨진 편의점이다. 계산대 뒤에서 비닐이 바스락거린다.",
      choices: [
        {
          label: "조용히 식량을 챙긴다",
          effect: (r, messages, perkOfferRef) => {
            const food = hasPerk(r, "scavenger") ? rand(2, 3) : rand(1, 2);
            const water = chance(0.6) ? 1 : 0;
            r.food += food;
            r.water += water;
            r.distance += 4;
            gainExp(r, 8, messages, perkOfferRef);
            messages.push(`식량 +${food}${water ? `, 물 +${water}` : ""}`);
          },
        },
        {
          label: "냉장고를 억지로 뜯는다",
          effect: (r, messages, perkOfferRef) => {
            if (chance(0.55)) {
              r.water += 2;
              messages.push("차갑진 않지만 마실 수 있는 물을 찾았다.");
            } else {
              hurt(r, 5, messages, "날카로운 파편");
            }
            r.scrap += 1;
            r.distance += 3;
            gainExp(r, 7, messages, perkOfferRef);
          },
        },
        {
          label: "위험하니 그냥 지나간다",
          effect: (r, messages, perkOfferRef) => {
            r.distance += 7;
            modMorale(r, 1, messages, "불필요한 위험 회피");
            gainExp(r, 5, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "빈 아파트 방송",
      text: "상층 창문에서 배터리식 라디오 방송이 새어 나온다. 누군가 이 건물 안에 있을 수도 있다.",
      choices: [
        {
          label: "계단으로 올라가 본다",
          effect: (r, messages, perkOfferRef) => {
            if (chance(0.55)) {
              r.meds += 1;
              modMorale(r, 5, messages, "생존자 흔적");
              messages.push("비어 있는 방에서 구급상자를 찾았다.");
            } else {
              const foe = enemyTemplate(r);
              messages.push("문이 열리자 숨어 있던 적이 튀어나왔다.");
              r.pendingBattle = { enemy: foe, intro: "좁은 복도 전투가 시작된다." };
            }
            r.distance += 4;
            gainExp(r, 9, messages, perkOfferRef);
          },
        },
        {
          label: "방송 주파수만 기록하고 떠난다",
          effect: (r, messages, perkOfferRef) => {
            modMorale(r, 3, messages, "희망적인 신호");
            r.distance += 6;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "길가의 부상자",
      text: "차량 옆에 기대 앉아 있는 부상자가 약을 구해 달라고 손짓한다. 거짓일 수도, 진짜일 수도 있다.",
      choices: [
        {
          label: "응급처치를 해 준다",
          disabled: (r) => r.meds <= 0,
          effect: (r, messages, perkOfferRef) => {
            r.meds -= 1;
            if (chance(0.7)) {
              r.food += 1;
              r.water += 1;
              modMorale(r, 7, messages, "신뢰를 얻음");
              messages.push("그는 감사의 표시로 숨겨 둔 식량을 건넸다.");
            } else {
              hurt(r, 7, messages, "갑작스러운 습격");
              messages.push("함정이었다.");
            }
            r.distance += 4;
            gainExp(r, 10, messages, perkOfferRef);
          },
        },
        {
          label: "멀리서 식량만 던져 준다",
          disabled: (r) => r.food <= 0,
          effect: (r, messages, perkOfferRef) => {
            r.food -= 1;
            modMorale(r, 3, messages, "죄책감 완화");
            r.distance += 5;
            gainExp(r, 7, messages, perkOfferRef);
          },
        },
        {
          label: "의심스럽다. 지나간다",
          effect: (r, messages, perkOfferRef) => {
            modMorale(r, -2, messages, "마음의 찝찝함");
            r.distance += 6;
            gainExp(r, 5, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "폐약국",
      text: "셔터 반쯤 내려온 약국이다. 안쪽 선반은 거의 비어 있지만, 서랍은 아직 안 뒤져 본 흔적이다.",
      choices: [
        {
          label: "정면으로 문을 연다",
          effect: (r, messages, perkOfferRef) => {
            if (chance(0.6)) {
              r.meds += rand(1, 2);
              messages.push("사용 가능한 의약품을 챙겼다.");
            } else {
              hurt(r, 6, messages, "무너진 진열대");
            }
            r.distance += 4;
            gainExp(r, 8, messages, perkOfferRef);
          },
        },
        {
          label: "후문으로 들어가 조용히 훑는다",
          effect: (r, messages, perkOfferRef) => {
            r.meds += 1;
            r.scrap += 1;
            if (hasPerk(r, "scavenger")) r.meds += 1;
            messages.push("급하게 남겨진 상자를 뒤져 약품을 확보했다.");
            r.distance += 3;
            gainExp(r, 9, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "차단된 고가도로",
      text: "버스와 승용차가 뒤엉켜 길을 막고 있다. 위를 지날 수도, 밑으로 돌아갈 수도 있다.",
      choices: [
        {
          label: "차량 사이를 넘는다",
          effect: (r, messages, perkOfferRef) => {
            if (chance(0.45)) {
              const foe = enemyTemplate(r);
              foe.name = "잠복한 차단조";
              r.pendingBattle = { enemy: foe, intro: "차량 틈에서 무장한 적이 튀어나왔다." };
            } else {
              r.scrap += 2;
              messages.push("부품을 뜯어 고철을 확보했다.");
            }
            r.distance += 6;
            gainExp(r, 9, messages, perkOfferRef);
          },
        },
        {
          label: "아래 도로로 우회한다",
          effect: (r, messages, perkOfferRef) => {
            hurt(r, 4, messages, "무너진 난간");
            r.distance += 5;
            gainExp(r, 7, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "간이 장터",
      text: "지하 주차장 구석에 물물교환을 하는 소규모 생존자 무리가 있다. 과하게 가까이 다가가면 털릴 수도 있다.",
      choices: [
        {
          label: "고철 2개로 물 2병을 교환한다",
          disabled: (r) => r.scrap < 2,
          effect: (r, messages, perkOfferRef) => {
            r.scrap -= 2;
            r.water += 2;
            modMorale(r, 2, messages, "숨통이 트임");
            r.distance += 3;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
        {
          label: "탄약 2발로 구급약을 산다",
          disabled: (r) => r.ammo < 2,
          effect: (r, messages, perkOfferRef) => {
            r.ammo -= 2;
            r.meds += 1;
            r.distance += 3;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
        {
          label: "그냥 정보만 듣고 떠난다",
          effect: (r, messages, perkOfferRef) => {
            modMorale(r, 3, messages, "유용한 소문");
            r.distance += 5;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "드론 추락 지점",
      text: "옥상 위로 군용 정찰 드론 하나가 반쯤 부서진 채 걸려 있다. 아직 배터리와 부품이 살아 있을지도 모른다.",
      choices: [
        {
          label: "기체를 해체한다",
          effect: (r, messages, perkOfferRef) => {
            const scrap = hasPerk(r, "scavenger") ? rand(3, 5) : rand(2, 4);
            r.scrap += scrap;
            if (chance(0.35)) r.ammo += 1;
            messages.push(`고철 +${scrap}`);
            r.distance += 4;
            gainExp(r, 9, messages, perkOfferRef);
          },
        },
        {
          label: "배터리를 살려 본다",
          effect: (r, messages, perkOfferRef) => {
            if (chance(0.5) || hasPerk(r, "tactician")) {
              modMorale(r, 6, messages, "정찰 데이터 확보");
              r.distance += 10;
              messages.push("안전한 우회로를 파악해 한 번에 전진했다.");
            } else {
              hurt(r, 5, messages, "합선");
              r.distance += 4;
            }
            gainExp(r, 10, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "빗물 저장 탱크",
      text: "옥상 위에 빗물 저장 탱크가 남아 있다. 정수 장비는 망가졌지만 물은 아직 고여 있다.",
      choices: [
        {
          label: "끓일 물만 챙긴다",
          effect: (r, messages, perkOfferRef) => {
            r.water += 2;
            r.distance += 4;
            gainExp(r, 7, messages, perkOfferRef);
            messages.push("물 +2");
          },
        },
        {
          label: "목이 말라 바로 마신다",
          effect: (r, messages, perkOfferRef) => {
            modThirst(r, 28);
            if (chance(0.35)) {
              hurt(r, 5, messages, "오염된 물");
            } else {
              modMorale(r, 2, messages, "갈증 해소");
            }
            r.distance += 3;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "무너진 사무실",
      text: "칸막이가 무너진 사무실 한가운데 임시 침낭이 놓여 있다. 누군가 이곳을 거점으로 썼던 듯하다.",
      choices: [
        {
          label: "짧게 쉬고 간다",
          effect: (r, messages, perkOfferRef) => {
            heal(r, 8, messages, "휴식");
            modMorale(r, 4, messages, "잠깐의 평온");
            r.distance += 3;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
        {
          label: "구석구석 뒤져 본다",
          effect: (r, messages, perkOfferRef) => {
            if (chance(0.5)) {
              r.food += 1;
              r.meds += 1;
              messages.push("비상용 보급품을 찾았다.");
            } else {
              const foe = enemyTemplate(r);
              foe.name = "숨어 있던 약탈자";
              r.pendingBattle = { enemy: foe, intro: "침낭 아래서 움직임이 튀어나온다." };
            }
            r.distance += 4;
            gainExp(r, 8, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "야간의 비상 방송차",
      text: "확성기를 단 방송 차량이 서 있다. 배터리는 꺼졌지만 안에는 연료 냄새와 탄피 흔적이 남아 있다.",
      choices: [
        {
          label: "차 안을 조사한다",
          effect: (r, messages, perkOfferRef) => {
            r.ammo += chance(0.6) ? 2 : 1;
            if (chance(0.3)) r.meds += 1;
            r.distance += 4;
            gainExp(r, 8, messages, perkOfferRef);
            messages.push("쓸 만한 보급을 챙겼다.");
          },
        },
        {
          label: "안테나를 고쳐 신호를 잡아 본다",
          disabled: (r) => r.scrap < 2,
          effect: (r, messages, perkOfferRef) => {
            r.scrap -= 2;
            modMorale(r, 6, messages, "집결지 좌표 확보");
            r.distance += 9;
            gainExp(r, 10, messages, perkOfferRef);
          },
        },
      ],
    },
  ];

  if (run.hp < run.maxHp * 0.45) {
    events.push({
      title: "비상 대피소",
      text: "교회 지하에 작은 대피소가 있다. 불씨가 남아 있다.",
      choices: [
        {
          label: "안에서 상처를 정리한다",
          effect: (r, messages, perkOfferRef) => {
            heal(r, 12, messages, "응급 정비");
            r.distance += 2;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
        {
          label: "식량만 챙기고 바로 떠난다",
          effect: (r, messages, perkOfferRef) => {
            r.food += 1;
            r.water += 1;
            r.distance += 4;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
      ],
    });
  }

  if (run.food <= 1 || run.water <= 1) {
    events.push({
      title: "학교 급식 창고",
      text: "무너진 학교 조리실 뒤편 창고 문이 반쯤 열려 있다.",
      choices: [
        {
          label: "안으로 들어가 박스를 연다",
          effect: (r, messages, perkOfferRef) => {
            r.food += rand(1, 3);
            r.water += chance(0.5) ? 1 : 0;
            r.distance += 4;
            gainExp(r, 8, messages, perkOfferRef);
            messages.push("먹을 것을 확보했다.");
          },
        },
        {
          label: "시간이 없다. 표지판만 확인하고 떠난다",
          effect: (r, messages, perkOfferRef) => {
            r.distance += 7;
            gainExp(r, 5, messages, perkOfferRef);
          },
        },
      ],
    });
  }

  events.push(
    {
      title: "고속버스 터미널 잔해",
      text: "의자마다 먼지가 수북하다. 그러나 한쪽 매표소 아래엔 아직 누군가의 짐이 숨겨져 있다.",
      choices: [
        {
          label: "짐가방을 뒤진다",
          effect: (r, messages, perkOfferRef) => {
            r.food += 1;
            r.water += 1;
            if (chance(0.45)) r.meds += 1;
            r.distance += 6;
            gainExp(r, 9, messages, perkOfferRef);
            messages.push("떠날 준비를 하던 누군가의 비상 짐을 확보했다.");
          },
        },
        {
          label: "노선 지도를 확인한다",
          effect: (r, messages, perkOfferRef) => {
            r.distance += 12;
            modMorale(r, 2, messages, "출구를 향한 감각");
            gainExp(r, 8, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "침수된 지하차도",
      text: "허리까지 차오른 더러운 물이 도로를 가로막고 있다. 위로 돌아갈지, 물을 가를지 선택해야 한다.",
      choices: [
        {
          label: "헤치고 건넌다",
          effect: (r, messages, perkOfferRef) => {
            r.distance += 9;
            if (chance(0.5)) {
              hurt(r, 6, messages, "숨겨진 파편");
            } else {
              r.scrap += 2;
              messages.push("물속에 잠긴 차량에서 쓸 만한 부품을 챙겼다.");
            }
            gainExp(r, 9, messages, perkOfferRef);
          },
        },
        {
          label: "우회로를 찾는다",
          effect: (r, messages, perkOfferRef) => {
            r.distance += 6;
            modMorale(r, 2, messages, "불길한 예감 회피");
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "송전탑 감시초소",
      text: "망원경과 빈 탄피가 널브러진 감시초소다. 누군가는 최근까지 여기서 도시를 내려다봤다.",
      choices: [
        {
          label: "탄피와 장비를 수거한다",
          effect: (r, messages, perkOfferRef) => {
            r.ammo += rand(1, 3);
            r.scrap += 1;
            r.distance += 5;
            gainExp(r, 8, messages, perkOfferRef);
            messages.push("남겨진 장비를 회수했다.");
          },
        },
        {
          label: "망원경으로 외곽을 확인한다",
          effect: (r, messages, perkOfferRef) => {
            r.distance += 11;
            gainExp(r, 8, messages, perkOfferRef);
            modMorale(r, 3, messages, "탈출 경로 확보");
          },
        },
      ],
    },
    {
      title: "한강변 임시 부두",
      text: "서울 밖으로 향하는 작은 바지선이 어둠 속에 묶여 있다. 제대로 된 항로는 없지만, 더 이상 서울 안에 남지 않는 길은 될 수 있다.",
      choices: [
        {
          label: "연료와 식량을 모아 부두에 정착한다",
          disabled: (r) => r.food < 2 || r.water < 2,
          effect: (r, messages, perkOfferRef) => {
            const settleScore = r.food * 4 + r.water * 4 + r.meds * 2 + r.morale;
            if (settleScore >= 36) {
              messages.push("서울을 완전히 떠나진 못했지만, 강 바깥 작은 삶을 선택했다.");
              gainExp(r, 16, messages, perkOfferRef);
              r.flags.won = true;
              r.flags.endingType = "settlement";
            } else {
              messages.push("남은 자원이 너무 적어 정착을 감당할 수 없었다.");
              modMorale(r, -4, messages, "포기");
            }
          },
        },
        {
          label: "배를 외면하고 다시 도시로 들어간다",
          effect: (r, messages, perkOfferRef) => {
            r.distance += 7;
            gainExp(r, 5, messages, perkOfferRef);
          },
        },
      ],
    },
    {
      title: "옥상 난간",
      text: "끝이 보이지 않는 회색 건물 숲 위, 바람이 부서진 철근을 울린다. 이제 발 하나만 내디디면 모든 소음에서 벗어날 수도 있다.",
      choices: [
        {
          label: "난간을 넘는다",
          effect: (r, messages, perkOfferRef) => {
            messages.push("아무도 네 숨을 붙잡지 않았다.");
            r.flags.won = true;
            r.flags.endingType = "suicide";
            gainExp(r, 1, messages, perkOfferRef);
          },
        },
        {
          label: "주먹을 쥐고 돌아선다",
          effect: (r, messages, perkOfferRef) => {
            modMorale(r, 5, messages, "다시 버티기");
            r.distance += 5;
            gainExp(r, 6, messages, perkOfferRef);
          },
        },
      ],
    }
  );

  return cloneEvent(pick(events));
}

function createRun(selectedClass) {
  return {
    classId: selectedClass.id,
    className: selectedClass.name,
    maxHp: selectedClass.base.maxHp,
    hp: selectedClass.base.hp,
    hunger: selectedClass.base.hunger,
    thirst: selectedClass.base.thirst,
    morale: selectedClass.base.morale,
    food: selectedClass.base.food,
    water: selectedClass.base.water,
    meds: selectedClass.base.meds,
    ammo: selectedClass.base.ammo,
    scrap: selectedClass.base.scrap,
    weapon: selectedClass.base.weapon,
    inventory: createStartingInventory(selectedClass.base),
    exp: 0,
    level: 1,
    nextLevelExp: 24,
    danger: 1,
    day: 1,
    distance: 0,
    perks: [...selectedClass.perks],
    flags: { introDone: false, won: false, endingType: null, killCount: 0, battleWins: 0 },
    pendingBattle: null,
  };
}

function BattlePanel({ battle, onAction, run }) {
  const actions = [
    { id: "melee", label: "근접 공격", tip: "탄약 없이도 가능" },
    { id: "shoot", label: "사격", tip: run.ammo > 0 ? `탄약 -1` : "탄약 부족" },
    { id: "guard", label: "방어", tip: "받는 피해 감소" },
    { id: "escape", label: "도주", tip: "성공 시 전투 종료" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-red-500/30 bg-red-950/30 p-4 shadow-xl shadow-red-950/20">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-red-300/70">전투</div>
            <h3 className="text-xl font-bold text-white">{battle.enemy.name}</h3>
          </div>
          <div className="rounded-full border border-red-400/30 px-3 py-1 text-sm text-red-100">HP {battle.enemy.hp}</div>
        </div>
        <p className="mb-4 text-sm leading-6 text-red-50/85">{battle.intro}</p>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className="rounded-2xl border border-red-300/20 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
            >
              <div className="font-medium text-white">{action.label}</div>
              <div className="mt-1 text-xs text-red-100/65">{action.tip}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, max = 100, icon: Icon }) {
  const percent = clamp((value / max) * 100, 0, 100);
  const isLow = percent <= 20;

  return (
    <div className="space-y-1.5">
      <div className={`flex items-center justify-between text-xs ${isLow ? "text-rose-300" : "text-zinc-300"}`}>
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${isLow ? "text-rose-300" : "text-zinc-300"}`} />
          <span>{label}</span>
        </div>
        <span className={isLow ? "font-semibold text-rose-300" : "text-zinc-200"}>{value}/{max}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full ${isLow ? "bg-rose-400" : "bg-white/70"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ItemCard({ label, value, desc, icon: Icon, onClick, disabled = false, accent = "zinc", consumable = false }) {
  const toneClasses = {
    amber: "hover:border-amber-300/30 hover:bg-amber-500/10",
    sky: "hover:border-sky-300/30 hover:bg-sky-500/10",
    rose: "hover:border-rose-300/30 hover:bg-rose-500/10",
    zinc: "hover:border-zinc-300/20 hover:bg-white/8",
    slate: "hover:border-slate-300/20 hover:bg-white/8",
  };

  const isDisabled = disabled || !onClick;
  const interactive = !!onClick && !disabled;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={interactive ? onClick : undefined}
      className={`rounded-3xl border border-white/10 bg-black/20 p-3 text-left transition ${interactive ? toneClasses[accent] || toneClasses.zinc : ""} ${isDisabled && consumable ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
          <Icon className="h-4 w-4 text-zinc-200" />
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-white">{value}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{consumable ? "사용 가능" : "보유"}</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="font-semibold text-white">{label}</div>
        <div className="mt-1 text-xs leading-5 text-zinc-400">{desc}</div>
      </div>
    </button>
  );
}


function SubItemRow({ item, count, onClick, accent = "zinc", canUse = false }) {
  const accentMap = {
    amber: "hover:border-amber-300/30 hover:bg-amber-500/10",
    sky: "hover:border-sky-300/30 hover:bg-sky-500/10",
    rose: "hover:border-rose-300/30 hover:bg-rose-500/10",
    zinc: "hover:border-zinc-300/20 hover:bg-white/8",
    slate: "hover:border-slate-300/20 hover:bg-white/8",
  };

  return (
    <button
      type="button"
      disabled={count <= 0}
      onClick={count > 0 ? onClick : undefined}
      className={`w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-left transition ${accentMap[accent] || accentMap.zinc} ${count <= 0 ? "cursor-not-allowed opacity-35" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{item.name}</div>
          <div className="mt-1 text-xs leading-5 text-zinc-400">{item.desc}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-white">{count}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{canUse ? "사용" : "보유"}</div>
        </div>
      </div>
    </button>
  );
}

function determineEnding(nextRun, won, extraLines = []) {
  if (!won) {
    return {
      endingType: "death",
      title: "사망",
      summary: "회색 도시는 끝내 너를 놓아주지 않는구나.",
      extraLines,
    };
  }

  const type = nextRun.flags?.endingType || (nextRun.flags?.killCount >= 14 ? "massacre" : "survival");
  const endingMap = {
    survival: {
      title: "생존 엔딩",
      summary: "너는 끝내 회색 도시의 경계를 넘어 살아남았다.",
    },
    massacre: {
      title: "학살 엔딩",
      summary: "네가 남긴 것은 탈출이 아니라 도살의 흔적이었다. 서울은 피로 길을 열어 주었다.",
    },
    suicide: {
      title: "탈출 성공?",
      summary: "몸은 도시 밖으로 나가지 못했지만, 너는 누구보다 빨리 서울에서 벗어났다.",
    },
    settlement: {
      title: "정착 엔딩",
      summary: "더 먼 탈출 대신, 너는 서울 밖 어딘가에서 살아남는 법을 택했다.",
    },
    king: {
      title: "왕 엔딩",
      summary: "도시를 벗어나는 대신, 너는 회색 도시의 주인이 되었다.",
    },
  };

  return {
    endingType: type,
    title: endingMap[type]?.title || "생존 엔딩",
    summary: endingMap[type]?.summary || "너는 끝내 회색 도시의 경계를 넘어 살아남았다.",
    extraLines,
  };
}

export default function SeoulRogueSelectionGame() {
  const [meta, setMeta] = useState(() => {
    if (typeof window === "undefined") return initialMeta;
    try {
      const raw = window.localStorage.getItem("apoca-choice-meta-v1");
      return raw ? { ...initialMeta, ...JSON.parse(raw) } : initialMeta;
    } catch {
      return initialMeta;
    }
  });
  const [screen, setScreen] = useState("title");
  const [selectedClassId, setSelectedClassId] = useState("student");
  const [run, setRun] = useState(null);
  const [event, setEvent] = useState(null);
  const [battle, setBattle] = useState(null);
  const [history, setHistory] = useState([]);
  const [choiceHistory, setChoiceHistory] = useState([]);
  const [ending, setEnding] = useState(null);
  const [perkOffer, setPerkOffer] = useState(null);
  const [itemDialog, setItemDialog] = useState(null);
  const [itemDialogClosing, setItemDialogClosing] = useState(false);
  const [itemCategoryDialog, setItemCategoryDialog] = useState(null);
  const [itemCategoryClosing, setItemCategoryClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("log");
  const [floatingNotices, setFloatingNotices] = useState([]);
  const [perkOverlayHidden, setPerkOverlayHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("apoca-choice-meta-v1", JSON.stringify(meta));
  }, [meta]);



  const unlockedClasses = useMemo(
    () => CLASS_OPTIONS.filter((c) => meta.wins >= c.unlockWins),
    [meta.wins]
  );

  const selectedClass = unlockedClasses.find((c) => c.id === selectedClassId) || unlockedClasses[0];

  function appendHistory(lines, type = "system", dayOverride) {
    setHistory((prev) => [{ id: uid(), day: dayOverride ?? run?.day ?? 1, lines, type }, ...prev].slice(0, 18));
  }

  function pushFloating(textValue, tone = "zinc") {
    const id = uid();
    setFloatingNotices((prev) => [...prev, { id, text: textValue, tone, closing: false }]);
    window.setTimeout(() => {
      setFloatingNotices((prev) => prev.map((item) => (
        item.id === id ? { ...item, closing: true } : item
      )));
    }, 4500);
    window.setTimeout(() => {
      setFloatingNotices((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  }

  function emitItemGainNotices(items) {
    formatItemNotices(items).forEach((line) => pushFloating(`획득: ${line}`, "emerald"));
  }

  function recordChoice(eventTitle, label, dayValue) {
    setChoiceHistory((prev) => [
      { id: uid(), day: dayValue, eventTitle, label },
      ...prev,
    ].slice(0, 14));
  }

  function startGame(classId = selectedClassId) {
    const cls = CLASS_OPTIONS.find((c) => c.id === classId) || CLASS_OPTIONS[0];
    const nextRun = createRun(cls);
    const firstEvent = generateEvent(nextRun);
    setRun(nextRun);
    setEvent(firstEvent);
    setBattle(null);
    setPerkOffer(null);
    setPerkOverlayHidden(false);
    closeItemDialog();
    setItemCategoryDialog(null);
    setActiveTab("log");
    setChoiceHistory([]);
    setHistory([
      {
        id: uid(),
        day: 1,
        type: "system",
        lines: [`${cls.name}로 생존을 시작했다.`, "목표: 회색 도시를 벗어나 탈출 기회를 잡아라."],
      },
    ]);
    setEnding(null);
    setScreen("game");
  }

  function openItemCategoryDialog(category) {
    if (!run) return;
    setItemCategoryDialog(category);
  }

  function closeItemCategoryDialog() {
    setItemCategoryDialog(null);
    setItemCategoryClosing(false);
  }

  function requestItemAction(category, itemId) {
    if (!run) return;
    const meta = getItemMeta(itemId);
    if (!meta) return;
    const count = run.inventory?.[itemId] || 0;
    if (count <= 0) return;
    setItemDialog({ category, itemId });
  }

  function closeItemDialog() {
    setItemDialog(null);
    setItemDialogClosing(false);
  }

  function consumeItem(itemId) {
    if (!run) return;
    const meta = getItemMeta(itemId);
    if (!meta) return;

    const next = copy(run);
    const messages = [];
    const perkOfferRef = { current: null };

    if ((next.inventory?.[itemId] || 0) <= 0) return;

    if (meta.category === "food") {
      removeInventoryItems(next, "food", 1, itemId);
      modHunger(next, 24);
      modMorale(next, 2, messages, "배를 채움");
      messages.unshift(`${meta.name} 사용`);
    }
    if (meta.category === "water") {
      removeInventoryItems(next, "water", 1, itemId);
      modThirst(next, 28);
      messages.unshift(`${meta.name} 사용`);
    }
    if (meta.category === "meds") {
      removeInventoryItems(next, "meds", 1, itemId);
      heal(next, 14, messages, "치료");
      messages.unshift(`${meta.name} 사용`);
    }

    setRun(next);
    appendHistory(messages, "item", next.day);
  }

  function confirmUseItem() {
    if (!itemDialog) return;
    const target = itemDialog.itemId;
    const meta = getItemMeta(target);
    setItemDialog(null);
    if (meta && ["food", "water", "meds"].includes(meta.category)) {
      consumeItem(target);
    }
  }

  function finishRun(nextRun, won, extraLines = []) {
    const resolvedEnding = determineEnding(nextRun, won, extraLines);
    const result = {
      won,
      day: nextRun.day,
      distance: nextRun.distance,
      className: nextRun.className,
      perks: nextRun.perks,
      title: resolvedEnding.title,
      endingType: resolvedEnding.endingType,
      summary: resolvedEnding.summary,
      extraLines: resolvedEnding.extraLines,
    };

    setMeta((prev) => ({
      wins: prev.wins + (won ? 1 : 0),
      bestDistance: Math.max(prev.bestDistance, nextRun.distance),
      bestDay: Math.max(prev.bestDay, nextRun.day),
      totalRuns: prev.totalRuns + 1,
    }));
    setItemDialog(null);
    setItemCategoryDialog(null);
    setPerkOverlayHidden(false);
    setEnding(result);
    setScreen("ending");
  }

  function resolveChoice(choice) {
    if (!run || !event) return;
    if (choice.disabled?.(run)) return;

    const next = copy(run);
    const beforeResources = {
      food: run.food,
      water: run.water,
      meds: run.meds,
      ammo: run.ammo,
      scrap: run.scrap,
    };
    const messages = [];
    const perkOfferRef = { current: null };

    recordChoice(event.title, choice.label, run.day);
    choice.effect(next, messages, perkOfferRef);
    const inventoryNotice = applyResourceDeltaToInventory(beforeResources, next);

    if (inventoryNotice.gained.length > 0) {
      emitItemGainNotices(inventoryNotice.gained);
      messages.push(...formatItemNotices(inventoryNotice.gained).map((line) => `획득: ${line}`));
    }

    if (next.flags.won) {
      appendHistory(messages, "choice", next.day);
      setRun(next);
      finishRun(next, true, messages);
      return;
    }

    endTurn(next, messages, perkOfferRef);
    appendHistory(messages, "choice", next.day);

    if (next.hp <= 0) {
      setRun(next);
      finishRun(next, false, messages);
      return;
    }

    setRun(next);

    if (perkOfferRef.current) setPerkOffer(perkOfferRef.current);

    if (next.pendingBattle) {
      const queuedBattle = cloneBattleState(next.pendingBattle);
      next.pendingBattle = null;
      setRun(next);
      setEvent(null);
      setBattle(queuedBattle);
      return;
    }

    setBattle(null);
    setEvent(generateEvent(next));
  }

  function resolveBattle(action) {
    if (!run || !battle) return;

    const nextRun = copy(run);
    const beforeResources = {
      food: run.food,
      water: run.water,
      meds: run.meds,
      ammo: run.ammo,
      scrap: run.scrap,
    };
    const nextBattle = cloneBattleState(battle);
    const messages = [];
    const perkOfferRef = { current: null };

    const enemy = nextBattle.enemy;

    if (action === "melee") {
      const damage = rand(5, 9) + nextRun.weapon * 3 + nextRun.level + (hasPerk(nextRun, "tactician") ? 2 : 0);
      enemy.hp -= damage;
      messages.push(`근접 공격으로 ${damage} 피해`);
    }

    if (action === "shoot") {
      if (nextRun.ammo <= 0) {
        messages.push("탄약이 없어 제대로 쏘지 못했다.");
      } else {
        nextRun.ammo -= 1;
        const damage = rand(8, 13) + nextRun.weapon * 2 + (hasPerk(nextRun, "marksman") ? 5 : 0) + nextRun.level;
        enemy.hp -= damage;
        messages.push(`사격으로 ${damage} 피해`);
      }
    }

    let guarding = false;
    if (action === "guard") {
      guarding = true;
      messages.push("자세를 낮추고 충격에 대비했다.");
    }

    if (action === "escape") {
      const rate = 0.35 + (hasPerk(nextRun, "runner") ? 0.25 : 0) + (nextRun.morale >= 65 ? 0.1 : 0);
      if (Math.random() < rate) {
        nextRun.distance += 3;
        modMorale(nextRun, -1, messages, "무리한 회피");
        messages.push("간신히 시야를 끊고 달아났다.");
        gainExp(nextRun, 4, messages, perkOfferRef);
        endTurn(nextRun, messages, perkOfferRef);

        const inventoryNotice = applyResourceDeltaToInventory(beforeResources, nextRun);
        if (inventoryNotice.gained.length > 0) {
          emitItemGainNotices(inventoryNotice.gained);
          messages.push(...formatItemNotices(inventoryNotice.gained).map((line) => `획득: ${line}`));
        }

        appendHistory(messages, "battle", nextRun.day);
        if (nextRun.hp <= 0) {
          setRun(nextRun);
          finishRun(nextRun, false, messages);
          return;
        }
        setRun(nextRun);
        setBattle(null);
        if (perkOfferRef.current) setPerkOffer(perkOfferRef.current);
        setEvent(generateEvent(nextRun));
        return;
      }
      messages.push("도주에 실패했다.");
    }

    if (enemy.hp > 0) {
      const incoming = rand(enemy.atk[0], enemy.atk[1]);
      const reduced = guarding ? Math.ceil(incoming * 0.45) : incoming;
      hurt(nextRun, reduced, messages, enemy.name);
    }

    if (enemy.hp <= 0) {
      messages.push(`${enemy.name}을 쓰러뜨렸다.`);
      nextRun.flags.killCount += 1;
      nextRun.flags.battleWins += 1;
      gainExp(nextRun, enemy.exp, messages, perkOfferRef);
      if (typeof enemy.loot === "function") enemy.loot(nextRun, messages);
      nextRun.distance += rand(3, 6);
      modMorale(nextRun, 3, messages, "전투 승리");
      endTurn(nextRun, messages, perkOfferRef);

      const inventoryNotice = applyResourceDeltaToInventory(beforeResources, nextRun);
      if (inventoryNotice.gained.length > 0) {
        emitItemGainNotices(inventoryNotice.gained);
        messages.push(...formatItemNotices(inventoryNotice.gained).map((line) => `획득: ${line}`));
      }

      appendHistory(messages, "battle", nextRun.day);
      if (nextRun.hp <= 0) {
        setRun(nextRun);
        finishRun(nextRun, false, messages);
        return;
      }
      setRun(nextRun);
      setBattle(null);
      if (perkOfferRef.current) setPerkOffer(perkOfferRef.current);
      setEvent(generateEvent(nextRun));
      return;
    }

    const inventoryNotice = applyResourceDeltaToInventory(beforeResources, nextRun);
    if (inventoryNotice.gained.length > 0) {
      emitItemGainNotices(inventoryNotice.gained);
      messages.push(...formatItemNotices(inventoryNotice.gained).map((line) => `획득: ${line}`));
    }

    appendHistory(messages, "battle", nextRun.day);
    if (nextRun.hp <= 0) {
      setRun(nextRun);
      finishRun(nextRun, false, messages);
      return;
    }

    setRun(nextRun);
    setBattle(nextBattle);
    if (perkOfferRef.current) setPerkOffer(perkOfferRef.current);
  }

  function selectPerk(perk) {
    if (!run) return;
    const next = copy(run);
    next.perks.push(perk.id);
    if (perk.id === "survivor") {
      next.maxHp += 12;
      next.hp = Math.min(next.maxHp, next.hp + 12);
    }
    setRun(next);
    appendHistory([`새 특성 획득: ${perk.name}`, perk.desc], "perk", next.day);
    pushFloating(`특성 획득: ${perk.name}`, "violet");
    setPerkOffer(null);
    setPerkOverlayHidden(false);
  }

  const topPerks = run?.perks
    ?.map((id) => PERKS.find((p) => p.id === id))
    .filter(Boolean) || [];

  const expRate = run ? clamp((run.exp / run.nextLevelExp) * 100, 0, 100) : 0;
  const itemDialogMeta = itemDialog ? getItemMeta(itemDialog.itemId) : null;
  const itemDialogCategoryMeta = itemDialog ? ITEM_CONFIG[itemDialog.category] : null;
  const currentItemCount = itemDialog && run ? run.inventory?.[itemDialog.itemId] || 0 : 0;
  const visibleChoiceHistory = choiceHistory;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#23272f_0%,#111318_45%,#09090b_100%)] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5">
        {screen !== "game" && (
          <div className="mb-4 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur">
            <div>
              <div className="text-[11px] uppercase tracking-[0.35em] text-zinc-400">Grey City Roguelike</div>
              <div className="text-xl font-black tracking-tight">서울: 회색 도시</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right text-xs text-zinc-300">
              <div>승리 {meta.wins}</div>
              <div>최장 이동 {meta.bestDistance}</div>
            </div>
          </div>
        )}

        {screen === "title" && (
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-zinc-300">
                  <Radio className="h-4 w-4" />
                  <span className="text-sm">현대 아포칼립스 · 선택형 로그라이크</span>
                </div>
                <h1 className="text-3xl font-black leading-tight text-white">붕괴한 도시를 건너<br />서울 집결지에 도달하라</h1>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  천만 개의 불빛이 꺼진 잿빛 무덤, 오직 당신의 숨소리만이 서울의 유일한 색이다.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-sm font-semibold text-zinc-200">생존자 선택</div>
                <div className="space-y-3">
                  {CLASS_OPTIONS.map((cls) => {
                    const locked = meta.wins < cls.unlockWins;
                    const active = selectedClassId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        disabled={locked}
                        onClick={() => !locked && setSelectedClassId(cls.id)}
                        className={`w-full rounded-3xl border p-4 text-left transition ${
                          locked
                            ? "cursor-not-allowed border-white/5 bg-white/[0.03] opacity-45"
                            : active
                              ? "border-white/35 bg-white/12"
                              : "border-white/10 bg-white/5 hover:bg-white/8"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-lg font-bold text-white">{cls.name}</div>
                            <div className="mt-1 text-sm leading-6 text-zinc-300">{cls.desc}</div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                            <div
                              className={`rounded-2xl border px-3 py-1 text-xs ${
                                locked
                                  ? "border-white/10 bg-black/20 text-zinc-400"
                                  : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                              }`}
                            >
                              {locked ? "잠김" : "해금"}
                            </div>
                            {cls.unlockWins > 0 && (
                              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] leading-5 text-zinc-300">
                                <div className="tracking-[0.18em] text-zinc-500">오픈 조건</div>
                                <div className="mt-1 text-xs text-zinc-200">{`승리 ${cls.unlockWins}회`}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3 pb-2">
              <button
                type="button"
                onClick={() => startGame(selectedClassId)}
                className="w-full rounded-3xl bg-white px-4 py-4 text-base font-bold text-black transition hover:scale-[1.01]"
              >
                게임 시작
              </button>
              <div className="grid grid-cols-3 gap-2 text-center text-xs text-zinc-400">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">총 런<br /><span className="text-sm font-semibold text-zinc-200">{meta.totalRuns}</span></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">최장 생존일<br /><span className="text-sm font-semibold text-zinc-200">{meta.bestDay}</span></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">최장 이동<br /><span className="text-sm font-semibold text-zinc-200">{meta.bestDistance}</span></div>
              </div>

            </div>
          </div>
        )}

        {screen === "game" && run && (
          <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_380px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">{run.className}</div>
                    <div className="mt-1 text-2xl font-black text-white">Day {run.day}</div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">회색 먼지와 정적 속에서, 오늘의 선택이 생존을 결정합니다.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">레벨</div>
                      <div className="mt-1 text-xl font-black text-white">{run.level}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">거리</div>
                      <div className="mt-1 text-xl font-black text-white">{run.distance}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                    <span className="uppercase tracking-[0.22em]">경험치</span>
                    <span>{run.exp}/{run.nextLevelExp}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-violet-400 transition-all duration-300" style={{ width: `${expRate}%` }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
                    <StatBar label="체력" value={run.hp} max={run.maxHp} icon={Heart} />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
                    <StatBar label="멘탈" value={run.morale} max={100} icon={Smile} />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
                    <StatBar label="허기" value={run.hunger} max={100} icon={Utensils} />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
                    <StatBar label="갈증" value={run.thirst} max={100} icon={Droplets} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {topPerks.length > 0 ? topPerks.map((perk) => (
                    <div key={perk.id} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-200">
                      {perk.name}
                    </div>
                  )) : (
                    <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-400">특성 없음</div>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                {battle ? (
                  <BattlePanel battle={battle} onAction={resolveBattle} run={run} />
                ) : event ? (
                  <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
                      <Zap className="h-4 w-4" />
                      <span>상황 발생</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{event.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">{event.text}</p>
                    <div className="mt-5 space-y-3">
                      {event.choices.map((choice, idx) => {
                        const disabled = choice.disabled?.(run);
                        return (
                          <button
                            key={`${choice.label}-${idx}`}
                            type="button"
                            disabled={disabled}
                            onClick={() => resolveChoice(choice)}
                            className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <div>
                              <div className="font-semibold text-white">{choice.label}</div>
                              {disabled && <div className="mt-1 text-xs text-zinc-400">조건 부족</div>}
                            </div>
                            <ChevronRight className="h-5 w-5 text-zinc-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/20">
                <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Illustration</div>
                <div className="mt-3 flex h-48 items-center justify-center rounded-3xl border border-white/10 bg-black/20 text-center text-sm text-zinc-500">
                  추후 업로드할 일러스트 이미지가 이 칸에 표시됩니다.
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("log")}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeTab === "log" ? "bg-white text-black" : "text-zinc-300 hover:bg-white/10"}`}
                    >
                      이전 선택지
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("items")}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeTab === "items" ? "bg-white text-black" : "text-zinc-300 hover:bg-white/10"}`}
                    >
                      아이템 칸
                    </button>
                  </div>
                  <div className="text-xs text-zinc-500">최근 {visibleChoiceHistory.length}개</div>
                </div>

                {activeTab === "items" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORY_ORDER.map((category) => {
                      const config = ITEM_CONFIG[category];
                      const total = run[category];
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => openItemCategoryDialog(category)}
                          className={`rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20 hover:bg-white/8 ${category === "scrap" ? "col-span-2" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                              <config.icon className="h-5 w-5 text-zinc-100" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-white">{config.label}</div>
                            </div>
                            <div className="text-lg font-black text-white">{total}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visibleChoiceHistory.length > 0 ? visibleChoiceHistory.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                        <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Day {item.day}</div>
                        <div className="text-xs text-zinc-500">{item.eventTitle}</div>
                        <div className="mt-1 text-sm leading-6 text-zinc-200">• {item.label}</div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-4 text-sm text-zinc-400">
                        아직 선택한 행동이 없다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {screen === "ending" && ending && (
          <div className="flex flex-1 flex-col justify-center gap-4">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 text-center shadow-2xl shadow-black/20">
              <div className="text-xs uppercase tracking-[0.35em] text-zinc-400">Run Complete</div>
              <h2 className="mt-2 text-3xl font-black text-white">{ending.title || (ending.won ? "클리어" : "사망")}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{ending.summary}</p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">생존일<br /><span className="text-lg font-bold text-white">{ending.day}</span></div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">이동 거리<br /><span className="text-lg font-bold text-white">{ending.distance}</span></div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">직업<br /><span className="text-lg font-bold text-white">{ending.className}</span></div>
              </div>
              <div className="mt-5 space-y-2 text-left">
                {ending.extraLines.map((line, i) => (
                  <div key={i} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-sm leading-6 text-zinc-300">• {line}</div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScreen("title")}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-white px-4 py-4 font-bold text-black transition hover:scale-[1.01]"
            >
              <RefreshCw className="h-4 w-4" />
              다시 시작
            </button>
          </div>
        )}
      </div>


      {itemCategoryDialog && run && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/65 p-4 md:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeItemCategoryDialog();
          }}
        >
          <div
            className="w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-zinc-500">Item Category</div>
                <h3 className="mt-2 text-2xl font-black text-white">{ITEM_CONFIG[itemCategoryDialog].label}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  보유 중인 세부 아이템을 확인하시고, 사용 가능한 품목을 선택해 보실 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={closeItemCategoryDialog}
                aria-label="닫기"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-zinc-300 transition hover:bg-white/10"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {ITEM_DETAILS[itemCategoryDialog].filter((item) => (run.inventory?.[item.id] || 0) > 0).length > 0 ? (
                ITEM_DETAILS[itemCategoryDialog]
                  .filter((item) => (run.inventory?.[item.id] || 0) > 0)
                  .map((item) => {
                    const count = run.inventory?.[item.id] || 0;
                    const canUse = ["food", "water", "meds"].includes(itemCategoryDialog);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => requestItemAction(itemCategoryDialog, item.id)}
                        className="w-full rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/8"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">{item.name}</div>
                            <div className="mt-1 text-sm leading-6 text-zinc-300">{item.desc}</div>
                            <div className="mt-2 text-xs text-zinc-500">{canUse ? "눌러 상세 정보와 사용 여부를 확인하실 수 있습니다." : "직접 사용은 불가능하며 이벤트에서 자동으로 소모됩니다."}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-white">{count}</div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">보유</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
              ) : (
                <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-5 text-center text-sm text-zinc-400">
                  보유한 물품이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {itemDialogMeta && itemDialogCategoryMeta && run && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/72 p-4 md:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeItemDialog();
          }}
        >
          <div
            className="w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs uppercase tracking-[0.35em] text-zinc-500">Item Detail</div>
            <div className="mt-3 flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <itemDialogCategoryMeta.icon className="h-5 w-5 text-zinc-100" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{itemDialogMeta.name}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-300">{itemDialogMeta.desc}</p>
                <div className="mt-2 text-xs text-zinc-500">현재 보유: {currentItemCount}</div>
              </div>
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
              {getItemUsageDescription(itemDialogMeta)}
            </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeItemDialog}
                aria-label="닫기"
                className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-2xl font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                ×
              </button>
              <button
                type="button"
                onClick={confirmUseItem}
                disabled={!["food", "water", "meds"].includes(itemDialog.category)}
                className="rounded-3xl bg-white px-4 py-3 font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-35"
              >
                사용
              </button>
            </div>
          </div>
        </div>
      )}

      {floatingNotices.length > 0 && (
        <div className="pointer-events-none fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2">
          {floatingNotices.map((notice) => (
            <div
              key={notice.id}
              className={`rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur transition duration-500 ${notice.closing ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"} ${
                notice.tone === "emerald"
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-50"
                  : notice.tone === "violet"
                    ? "border-violet-400/30 bg-violet-500/15 text-violet-50"
                    : "border-white/10 bg-black/55 text-zinc-100"
              }`}
            >
              {notice.text}
            </div>
          ))}
        </div>
      )}


      {perkOffer && run && !perkOverlayHidden && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 md:items-center">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-950 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-zinc-500">Level Up</div>
                <h3 className="mt-2 text-2xl font-black text-white">새 특성 선택</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">특성을 고르시면 어떤 능력인지 바로 확인하실 수 있습니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setPerkOverlayHidden(true)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
              >
                숨기기
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {perkOffer.map((perk) => (
                <button
                  key={perk.id}
                  type="button"
                  onClick={() => selectPerk(perk)}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                >
                  <div className="font-semibold text-white">{perk.name}</div>
                  <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">능력</div>
                  <div className="mt-1 text-sm leading-6 text-zinc-300">{perk.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {perkOffer && run && perkOverlayHidden && (
        <button
          type="button"
          onClick={() => setPerkOverlayHidden(false)}
          className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-3xl border border-violet-400/30 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-50 shadow-2xl backdrop-blur transition hover:bg-violet-500/25"
        >
          특성 선택 화면 다시 열기
        </button>
      )}
    </div>
  );

}
