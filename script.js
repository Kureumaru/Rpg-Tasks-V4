// --- Player data ---
let player = {
  name: "Hero",
  level: 1,
  xp: 0,
  gold: 0,
  xpToNext: 100,
  stats: {
    STR: 1,
    DEX: 1,
    INT: 1,
    VIT: 1,
    LUK: 1,
    AGI: 1
  },
  inventory: [],
  equipment: {}
};

// --- Utility functions ---
function savePlayerData() {
  localStorage.setItem("playerData", JSON.stringify(player));
}

function loadPlayerData() {
  const saved = localStorage.getItem("playerData");
  if (saved) player = JSON.parse(saved);
  updateUI();
}

function showNotification(message, type = "info") {
  const box = document.createElement("div");
  box.className = `notification ${type}`;
  box.textContent = message;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3000);
}

// --- UI Update ---
function updateUI() {
  document.getElementById("player-name").textContent = player.name;
  document.getElementById("player-level").textContent = player.level;
  document.getElementById("player-xp").textContent = `${player.xp} / ${player.xpToNext}`;
  document.getElementById("player-gold").textContent = player.gold;
  for (let stat in player.stats) {
    const el = document.getElementById(`stat-${stat}`);
    if (el) el.textContent = player.stats[stat];
  }
}

// --- Leveling system ---
function getXPNeededForLevel(level) {
  let xpNeeded = 100;
  for (let i = 1; i < level; i++) {
    xpNeeded = Math.floor(xpNeeded * 1.25);
  }
  return xpNeeded;
}

function adjustLevelAfterXPChange() {
  // Calculate total XP across all levels
  let totalXP = 0;
  for (let lvl = 1; lvl < player.level; lvl++) {
    totalXP += getXPNeededForLevel(lvl);
  }
  totalXP += player.xp;

  // Determine new level based on totalXP
  let newLevel = 1;
  let xpForNext = getXPNeededForLevel(newLevel);
  while (totalXP >= xpForNext) {
    totalXP -= xpForNext;
    newLevel++;
    xpForNext = getXPNeededForLevel(newLevel);
  }

  // Check if level changed
  if (newLevel > player.level) {
    showNotification(`🎉 Level Up! You’re now level ${newLevel}!`, "success");
  } else if (newLevel < player.level) {
    showNotification(`⬇️ Dropped to Level ${newLevel}...`, "danger");
  }

  // Update player
  player.level = newLevel;
  player.xp = totalXP;
  player.xpToNext = getXPNeededForLevel(player.level);
}

// --- Task Completion Logic (supports positive and negative tasks) ---
function completeTask(xp, gold) {
  player.xp += xp;
  player.gold = Math.max(0, player.gold + gold); // gold cannot be negative

  if (xp < 0 || gold < 0) {
    showNotification(`You lost ${Math.abs(xp)} XP and ${Math.abs(gold)} gold. 😢`, "danger");
  } else {
    showNotification(`You gained ${xp} XP and ${gold} gold! ✨`, "success");
  }

  adjustLevelAfterXPChange();
  savePlayerData();
  updateUI();
}

// --- Manual Negative Task Function ---
function completeNegativeTask(xpLoss, goldLoss) {
  completeTask(-Math.abs(xpLoss), -Math.abs(goldLoss));
}

// --- Example task array ---
const tasks = [
  { name: "Drink Water", xp: 10, gold: 5 },
  { name: "Workout", xp: 25, gold: 15 },
  { name: "Missed Sleep", xp: -15, gold: -10 } // negative task example
];

// --- Function to trigger tasks ---
function completeNamedTask(taskName) {
  const task = tasks.find(t => t.name === taskName);
  if (task) {
    completeTask(task.xp, task.gold);
  } else {
    showNotification(`Task "${taskName}" not found.`, "danger");
  }
}

// --- Shop system example ---
const shopItems = [
  { name: "Iron Sword", cost: 50, effect: () => player.stats.STR++ },
  { name: "Magic Potion", cost: 30, effect: () => player.stats.INT++ }
];

function buyItem(itemName) {
  const item = shopItems.find(i => i.name === itemName);
  if (!item) return showNotification("Item not found!", "danger");
  if (player.gold < item.cost) return showNotification("Not enough gold!", "danger");

  player.gold -= item.cost;
  item.effect();
  player.inventory.push(item.name);
  showNotification(`Purchased ${item.name}!`, "success");
  savePlayerData();
  updateUI();
}

// --- Initialization ---
window.addEventListener("load", loadPlayerData);

// --- Example usage ---
// completeNamedTask("Drink Water");
// completeNamedTask("Missed Sleep");
// completeNegativeTask(20, 10);
