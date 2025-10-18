const qs = s => document.querySelector(s);
const defaultState = {
    player: {
        level: 1,
        xp: 0,
        xpToNext: 100,
        gold: 0,
        hp: 50,
        maxHp: 50,
        stats: { str: 5, dex: 5, vit: 5, int: 5, wis: 5, cha: 5 }
    },
    tasks: []
};
let state = load();

function load() {
    try {
        const raw = localStorage.getItem('kure_rpg');
        return raw ? JSON.parse(raw) : deepClone(defaultState);
    } catch {
        return deepClone(defaultState);
    }
}

function save() {
    try {
        localStorage.setItem('kure_rpg', JSON.stringify(state));
    } catch {}
}

function deepClone(o) {
    try {
        if (structuredClone) return structuredClone(o);
    } catch {}
    return JSON.parse(JSON.stringify(o));
}

function toast(m) {
    const t = qs('#toast');
    t.textContent = m;
    t.style.display = 'block';
    clearTimeout(t.h);
    t.h = setTimeout(() => t.style.display = 'none', 1500);
}

function renderPlayer() {
    const p = state.player;
    qs('#playerLevel').textContent = p.level;
    qs('#playerGold').textContent = p.gold;
    qs('#xpText').textContent = `${p.xp}/${p.xpToNext}`;
    qs('#xpFill').style.width = Math.min(100, (p.xp / p.xpToNext) * 100) + '%';
    qs('#statStr').textContent = p.stats.str;
    qs('#statDex').textContent = p.stats.dex;
    qs('#statVit').textContent = p.stats.vit;
    qs('#statInt').textContent = p.stats.int;
    qs('#statWis').textContent = p.stats.wis;
    qs('#statCha').textContent = p.stats.cha;
}

function getRewardForDifficulty(d) {
    const t = {
        VeryEasy: { xp: 5, gold: 2 },
        Easy: { xp: 10, gold: 5 },
        Normal: { xp: 20, gold: 10 },
        Medium: { xp: 35, gold: 20 },
        Hard: { xp: 60, gold: 40 },
        Legendary: { xp: 120, gold: 100 }
    };
    return t[d] || t.Easy;
}

function completeTask(i) {
    const t = state.tasks[i];
    if (!t) return;
    const r = getRewardForDifficulty(t.difficulty);
    const xp = Math.round(r.xp * (t.bonus ? 1.2 : 1));
    const gold = Math.round(r.gold * (t.bonus ? 1.2 : 1));
    state.player.xp += xp;
    state.player.gold += gold;
    const map = { strength: 'str', dexterity: 'dex', vitality: 'vit', intelligence: 'int', wisdom: 'wis', charisma: 'cha' };
    const key = map[t.stat];
    if (key && !t.negative) state.player.stats[key]++;
    if (t.repeatable) t.count = (t.count || 0) + 1; else state.tasks.splice(i, 1);
    while (state.player.xp >= state.player.xpToNext) {
        state.player.xp -= state.player.xpToNext;
        state.player.level++;
        state.player.xpToNext = Math.round(state.player.xpToNext * 1.25);
    }
    save();
    renderAll();
    toast(`+${xp} XP, +${gold} Gold`);
}

function renderTasks() {
    const ul = qs('#taskList');
    ul.innerHTML = '';
    state.tasks.forEach((t, i) => {
        const li = document.createElement('li');
        li.className = 'task';
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `<h4><span style="color:${t.color || '#fff'}">${t.name}</span></h4>`;
        const badges = document.createElement('div');
        badges.className = 'badges';
        const add = b => {
            const s = document.createElement('span');
            s.className = 'badge';
            s.textContent = b;
            badges.appendChild(s);
        };
        if (t.difficulty) add(t.difficulty);
        if (t.category) add(t.category);
        if (t.stat) add(t.stat);
        if (t.repeatable) {
            add('Repeatable');
            const c = document.createElement('span');
            c.className = 'counter';
            c.textContent = 'Times: ' + (t.count || 0);
            badges.appendChild(c);
        }
        meta.appendChild(badges);
        const actions = document.createElement('div');
        const done = document.createElement('button');
        done.className = 'btn outline';
        done.style.padding = '6px 10px';
        done.textContent = 'Complete';
        done.onclick = () => completeTask(i);
        const del = document.createElement('button');
        del.className = 'btn outline';
        del.style.padding = '6px 10px';
        del.textContent = 'Delete';
        del.onclick = () => {
            state.tasks.splice(i, 1);
            save();
            renderTasks();
        };
        actions.append(done, del);
        li.append(meta, actions);
        ul.appendChild(li);
    });
}

function populateNewTaskModal() {
    const dSel = qs('#newTaskDifficulty');
    dSel.innerHTML = '';
    ['VeryEasy', 'Easy', 'Normal', 'Medium', 'Hard', 'Legendary'].forEach(k => {
        const o = document.createElement('option');
        o.value = k;
        o.textContent = k;
        if (k === 'Easy') o.selected = true;
        dSel.appendChild(o);
    });
    const sSel = qs('#newTaskStat');
    sSel.innerHTML = '';
    [{ v: 'strength', t: 'Strength' }, { v: 'dexterity', t: 'Dexterity' }, { v: 'vitality', t: 'Vitality' }, { v: 'intelligence', t: 'Intelligence' }, { v: 'wisdom', t: 'Wisdom' }, { v: 'charisma', t: 'Charisma' }, { v: '', t: 'None' }].forEach(s => {
        const o = document.createElement('option');
        o.value = s.v;
        o.textContent = s.t;
        sSel.appendChild(o);
    });
    const cSel = qs('#newTaskCategory');
    cSel.innerHTML = '';
    ['General', 'Combat', 'Crafting', 'Exploration', 'Social', 'Chores', 'Study', 'Errands', 'Magic', 'Stealth', 'Fitness'].forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        cSel.appendChild(o);
    });
}

qs('#showNewTask').onclick = () => {
    populateNewTaskModal();
    qs('#newTaskName').value = '';
    qs('#newTaskBonus').checked = false;
    qs('#newTaskRepeat').checked = false;
    qs('#newTaskModal').style.display = 'flex';
};

qs('#cancelNewTask').onclick = () => {
    qs('#newTaskModal').style.display = 'none';
};

qs('#confirmNewTask').onclick = () => {
    const name = qs('#newTaskName').value.trim();
    if (!name) {
        toast('Please enter a quest name');
        return;
    }
    const diff = qs('#newTaskDifficulty').value;
    const stat = qs('#newTaskStat').value;
    const cat = qs('#newTaskCategory').value;
    const bonus = qs('#newTaskBonus').checked;
    const rep = qs('#newTaskRepeat').checked;
    state.tasks.push({ name, difficulty: diff, stat, category: cat, bonus, repeatable: rep, count: 0, color: '#c084fc' });
    save();
    renderTasks();
    qs('#newTaskModal').style.display = 'none';
    toast('Quest added');
};

qs('#resetGameBtn').onclick = () => {
    if (confirm('Reset all data?')) {
        state = deepClone(defaultState);
        save();
        renderAll();
        toast('Reset!');
    }
};

function renderAll() {
    renderPlayer();
    renderTasks();
}

function exportSave() {
    const dataStr = JSON.stringify(state);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rpg_tasks_save.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importSave(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const importedState = JSON.parse(e.target.result);
        state = importedState;
        save();
        renderAll();
        toast('Game data imported successfully!');
    };
    reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Save';
    exportBtn.onclick = exportSave;
    document.body.appendChild(exportBtn);

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.onchange = importSave;
    document.body.appendChild(importInput);
});

renderAll();