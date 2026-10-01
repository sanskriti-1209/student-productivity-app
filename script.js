// ===== DATA STORE (localStorage) =====
const STORAGE_KEYS = {
    TASKS: 'sf_tasks',
    NOTES: 'sf_notes',
    PROFILE: 'sf_profile',
    THEME: 'sf_theme',
    POMODORO: 'sf_pomodoro',
    STREAK: 'sf_streak'
};

function loadData(key, fallback = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch { return fallback; }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ===== STATE =====
let tasks = loadData(STORAGE_KEYS.TASKS, []);
let notes = loadData(STORAGE_KEYS.NOTES, []);
let profile = loadData(STORAGE_KEYS.PROFILE, { name: 'Student', course: '', year: '1st Year', goal: 5 });
let pomodoroData = loadData(STORAGE_KEYS.POMODORO, { count: 0, totalMinutes: 0, lastDate: '' });
let streakData = loadData(STORAGE_KEYS.STREAK, { count: 0, lastDate: '' });

let currentFilter = 'all';
let currentView = 'dashboard';
let editingTaskId = null;
let editingNoteId = null;
let scheduleDate = new Date();
let scheduleMode = 'daily';

// Timer state
let timerInterval = null;
let timerRunning = false;
let timerTotalSeconds = 25 * 60;
let timerRemainingSeconds = 25 * 60;
let currentTimerMinutes = 25;

// ===== QUOTES =====
const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Education is the passport to the future.", author: "Malcolm X" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "There is no substitute for hard work.", author: "Thomas Edison" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Dream it. Wish it. Do it.", author: "Unknown" },
    { text: "Stay focused, go after your dreams and keep moving toward your goals.", author: "LL Cool J" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initProfile();
    initNavigation();
    initSidebar();
    initTasks();
    initPomodoro();
    initNotes();
    initSchedule();
    initStreak();
    updateDashboard();
    updateDateDisplay();
    updateGreeting();
    showRandomQuote();
});

// ===== THEME =====
function initTheme() {
    const saved = loadData(STORAGE_KEYS.THEME, 'light');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').textContent = '☀️';
    }

    document.getElementById('themeToggle').addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
        document.getElementById('themeToggle').textContent = isDark ? '🌙' : '☀️';
        saveData(STORAGE_KEYS.THEME, isDark ? 'light' : 'dark');
    });
}

// ===== PROFILE =====
function initProfile() {
    renderProfile();

    document.getElementById('editProfileBtn').addEventListener('click', () => {
        document.getElementById('profileNameInput').value = profile.name;
        document.getElementById('profileCourseInput').value = profile.course;
        document.getElementById('profileYear').value = profile.year;
        document.getElementById('profileGoal').value = profile.goal;
        document.getElementById('profileModal').classList.add('active');
    });

    document.getElementById('closeProfileModal').addEventListener('click', () => {
        document.getElementById('profileModal').classList.remove('active');
    });

    document.getElementById('saveProfileBtn').addEventListener('click', () => {
        profile.name = document.getElementById('profileNameInput').value.trim() || 'Student';
        profile.course = document.getElementById('profileCourseInput').value.trim();
        profile.year = document.getElementById('profileYear').value;
        profile.goal = parseInt(document.getElementById('profileGoal').value) || 5;
        saveData(STORAGE_KEYS.PROFILE, profile);
        renderProfile();
        updateGreeting();
        document.getElementById('profileModal').classList.remove('active');
    });

    // Close modal on overlay click
    document.getElementById('profileModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
    });
}

function renderProfile() {
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileCourse').textContent = profile.course ? `${profile.course} • ${profile.year}` : 'Set up your profile';
    document.getElementById('avatarDisplay').textContent = profile.name.charAt(0).toUpperCase();
}

// ===== NAVIGATION =====
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    currentView = view;

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        tasks: 'Tasks',
        schedule: 'Schedule',
        pomodoro: 'Focus Timer',
        notes: 'Quick Notes'
    };
    document.getElementById('viewTitle').textContent = titles[view] || view;

    if (view === 'dashboard') updateDashboard();
    if (view === 'tasks') renderTasks();
    if (view === 'schedule') renderSchedule();
    if (view === 'pomodoro') updateTimerTaskSelect();
    if (view === 'notes') renderNotes();

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

// ===== SIDEBAR =====
function initSidebar() {
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('sidebarClose').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
}

// ===== DATE & GREETING =====
function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', options);
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    document.getElementById('greetingText').textContent = `${greeting}, ${profile.name}! 👋`;
}

// ===== QUOTES =====
function showRandomQuote() {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('quoteText').textContent = `"${q.text}"`;
    document.getElementById('quoteAuthor').textContent = `— ${q.author}`;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('newQuoteBtn')?.addEventListener('click', showRandomQuote);
});

// ===== STREAK =====
function initStreak() {
    const today = new Date().toDateString();

    if (streakData.lastDate === today) {
        // Already counted today
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (streakData.lastDate === yesterday.toDateString()) {
            streakData.count++;
        } else if (streakData.lastDate !== today) {
            streakData.count = 1;
        }
        streakData.lastDate = today;
        saveData(STORAGE_KEYS.STREAK, streakData);
    }

    document.getElementById('streakCount').textContent = streakData.count;
}

// ===== TASKS =====
function initTasks() {
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        editingTaskId = null;
        document.getElementById('taskFormTitle').textContent = 'Add New Task';
        clearTaskForm();
        document.getElementById('taskFormContainer').style.display = 'block';
        document.getElementById('taskTitle').focus();
    });

    document.getElementById('cancelTaskBtn').addEventListener('click', () => {
        document.getElementById('taskFormContainer').style.display = 'none';
        clearTaskForm();
    });

    document.getElementById('saveTaskBtn').addEventListener('click', saveTask);

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    renderTasks();
    updateTaskBadge();
}

function clearTaskForm() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskCategory').value = 'study';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskDate').value = '';
    document.getElementById('taskTime').value = '';
    document.getElementById('taskDesc').value = '';
}

function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) {
        alert('Please enter a task title!');
        return;
    }

    const task = {
        id: editingTaskId || Date.now().toString(),
        title,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        date: document.getElementById('taskDate').value,
        time: document.getElementById('taskTime').value,
        description: document.getElementById('taskDesc').value.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };

    if (editingTaskId) {
        const idx = tasks.findIndex(t => t.id === editingTaskId);
        if (idx !== -1) {
            task.completed = tasks[idx].completed;
            task.createdAt = tasks[idx].createdAt;
            tasks[idx] = task;
        }
    } else {
        tasks.unshift(task);
    }

    saveData(STORAGE_KEYS.TASKS, tasks);
    document.getElementById('taskFormContainer').style.display = 'none';
    clearTaskForm();
    editingTaskId = null;
    renderTasks();
    updateTaskBadge();
    updateDashboard();
}

function renderTasks() {
    const list = document.getElementById('taskList');
    let filtered = [...tasks];

    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    switch (currentFilter) {
        case 'today':
            filtered = filtered.filter(t => t.date === today);
            break;
        case 'week':
            filtered = filtered.filter(t => t.date >= today && t.date <= weekEndStr);
            break;
        case 'pending':
            filtered = filtered.filter(t => !t.completed);
            break;
        case 'completed':
            filtered = filtered.filter(t => t.completed);
            break;
    }

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state-large">
                <span class="empty-icon">📝</span>
                <h3>No tasks found</h3>
                <p>Try changing the filter or add a new task!</p>
            </div>`;
        return;
    }

    // Sort: uncompleted first, then by priority, then by date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
        if (a.date && b.date) return a.date.localeCompare(b.date);
        return 0;
    });

    const categoryIcons = {
        study: '📖', assignment: '📝', project: '🔬', exam: '📋', personal: '🏠', other: '📎'
    };

    list.innerHTML = filtered.map(task => {
        const dueStr = task.date ? formatDate(task.date) : '';
        const timeStr = task.time || '';

        return `
        <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-item-body">
                <div class="task-item-title">${escapeHtml(task.title)}</div>
                <div class="task-item-meta">
                    <span class="task-meta-tag">${categoryIcons[task.category] || '📎'} ${task.category}</span>
                    ${dueStr ? `<span class="task-meta-tag">📅 ${dueStr}</span>` : ''}
                    ${timeStr ? `<span class="task-meta-tag">⏰ ${timeStr}</span>` : ''}
                    <span class="task-meta-tag"><span class="priority-dot ${task.priority}"></span> ${task.priority}</span>
                </div>
                ${task.description ? `<div class="task-item-desc">${escapeHtml(task.description)}</div>` : ''}
            </div>
            <div class="task-item-actions">
                <button class="task-action-btn" onclick="editTask('${task.id}')" title="Edit">✎</button>
                <button class="task-action-btn delete" onclick="deleteTask('${task.id}')" title="Delete">🗑</button>
            </div>
        </div>`;
    }).join('');
}

window.toggleTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData(STORAGE_KEYS.TASKS, tasks);
        renderTasks();
        updateTaskBadge();
        updateDashboard();
    }
};

window.editTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    document.getElementById('taskFormTitle').textContent = 'Edit Task';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDate').value = task.date || '';
    document.getElementById('taskTime').value = task.time || '';
    document.getElementById('taskDesc').value = task.description || '';
    document.getElementById('taskFormContainer').style.display = 'block';
    document.getElementById('taskTitle').focus();
};

window.deleteTask = function(id) {
    if (!confirm('Delete this task?')) return;
    tasks = tasks.filter(t => t.id !== id);
    saveData(STORAGE_KEYS.TASKS, tasks);
    renderTasks();
    updateTaskBadge();
    updateDashboard();
};

function updateTaskBadge() {
    const pending = tasks.filter(t => !t.completed).length;
    document.getElementById('taskBadge').textContent = pending;
    document.getElementById('taskBadge').style.display = pending > 0 ? 'inline' : 'none';
}

// ===== DASHBOARD =====
function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;

    // Focus time
    const today = new Date().toDateString();
    if (pomodoroData.lastDate === today) {
        document.getElementById('statFocusTime').textContent = pomodoroData.totalMinutes + 'm';
    } else {
        document.getElementById('statFocusTime').textContent = '0m';
    }

    // Today's tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayStr && !t.completed);
    const todayEl = document.getElementById('todayTasks');

    if (todayTasks.length === 0) {
        todayEl.innerHTML = '<p class="empty-msg">No tasks for today ✨</p>';
    } else {
        todayEl.innerHTML = todayTasks.slice(0, 5).map(t => `
            <div class="today-task-item">
                <span class="priority-dot ${t.priority}"></span>
                <span class="task-name">${escapeHtml(t.title)}</span>
                ${t.time ? `<span class="task-time">${t.time}</span>` : ''}
            </div>
        `).join('');
    }

    // Upcoming deadlines
    const upcoming = tasks.filter(t => t.date && t.date >= todayStr && !t.completed)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
    const deadlinesEl = document.getElementById('upcomingDeadlines');

    if (upcoming.length === 0) {
        deadlinesEl.innerHTML = '<p class="empty-msg">No upcoming deadlines 🎉</p>';
    } else {
        deadlinesEl.innerHTML = upcoming.map(t => `
            <div class="deadline-item">
                <span class="deadline-date">${formatDate(t.date)}</span>
                <span>${escapeHtml(t.title)}</span>
            </div>
        `).join('');
    }

    // Weekly chart
    renderWeeklyChart();
}

function renderWeeklyChart() {
    const chart = document.getElementById('weeklyChart');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const todayDay = today.getDay();

    // Count completed tasks per day this week
    const weekData = Array(7).fill(0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - todayDay);

    tasks.forEach(t => {
        if (t.completed && t.date) {
            const d = new Date(t.date + 'T00:00:00');
            const diff = Math.floor((d - startOfWeek) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 7) {
                weekData[diff]++;
            }
        }
    });

    const max = Math.max(...weekData, 1);

    chart.innerHTML = days.map((day, i) => {
        const height = (weekData[i] / max) * 80;
        const isToday = i === todayDay;
        return `
            <div class="chart-bar-container">
                <span class="chart-bar-value">${weekData[i]}</span>
                <div class="chart-bar ${isToday ? 'today' : ''}" style="height: ${Math.max(height, 4)}px"></div>
                <span class="chart-bar-label">${day}</span>
            </div>`;
    }).join('');
}

// ===== SCHEDULE =====
function initSchedule() {
    document.querySelectorAll('.sched-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sched-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scheduleMode = btn.dataset.sched;
            renderSchedule();
        });
    });

    document.getElementById('schedPrev').addEventListener('click', () => {
        scheduleDate.setDate(scheduleDate.getDate() - (scheduleMode === 'weekly' ? 7 : 1));
        renderSchedule();
    });

    document.getElementById('schedNext').addEventListener('click', () => {
        scheduleDate.setDate(scheduleDate.getDate() + (scheduleMode === 'weekly' ? 7 : 1));
        renderSchedule();
    });

    document.getElementById('schedToday').addEventListener('click', () => {
        scheduleDate = new Date();
        renderSchedule();
    });
}

function renderSchedule() {
    if (scheduleMode === 'daily') {
        document.getElementById('dailySchedule').style.display = 'block';
        document.getElementById('weeklySchedule').style.display = 'none';
        renderDailySchedule();
    } else {
        document.getElementById('dailySchedule').style.display = 'none';
        document.getElementById('weeklySchedule').style.display = 'grid';
        renderWeeklySchedule();
    }
}

function renderDailySchedule() {
    const dateStr = scheduleDate.toISOString().split('T')[0];
    document.getElementById('schedDateLabel').textContent = formatDate(dateStr);

    const dayTasks = tasks.filter(t => t.date === dateStr);
    const container = document.getElementById('dailySchedule');

    let html = '';
    for (let h = 6; h <= 23; h++) {
        const hourStr = h.toString().padStart(2, '0');
        const label = h <= 12 ? `${h === 0 ? 12 : h} AM` : `${h === 12 ? 12 : h - 12} PM`;

        const hourTasks = dayTasks.filter(t => {
            if (t.time) return t.time.startsWith(hourStr);
            return false;
        });

        // Also show tasks without time at 9 AM slot
        const noTimeTasks = h === 9 ? dayTasks.filter(t => !t.time) : [];
        const allSlotTasks = [...hourTasks, ...noTimeTasks];

        html += `
            <div class="hour-slot">
                <div class="hour-label">${label}</div>
                <div class="hour-content">
                    ${allSlotTasks.map(t => `
                        <span class="schedule-task-chip ${t.category}" title="${escapeHtml(t.title)}">
                            ${t.completed ? '✅' : ''} ${escapeHtml(t.title)}
                        </span>
                    `).join('')}
                </div>
            </div>`;
    }

    container.innerHTML = html;
}

function renderWeeklySchedule() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startOfWeek = new Date(scheduleDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const today = new Date().toISOString().split('T')[0];

    document.getElementById('schedDateLabel').textContent =
        `${formatDate(startOfWeek.toISOString().split('T')[0])} - Week View`;

    const container = document.getElementById('weeklySchedule');
    let html = '';

    for (let d = 0; d < 7; d++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === today;

        const dayTasks = tasks.filter(t => t.date === dateStr);

        html += `
            <div class="week-day-col">
                <div class="week-day-header ${isToday ? 'today' : ''}">
                    ${days[d]}<br>${date.getDate()}
                </div>
                <div class="week-day-body">
                    ${dayTasks.length === 0 ? '<span style="font-size:11px;color:var(--text-muted)">No tasks</span>' :
                    dayTasks.map(t => `
                        <div class="week-task-item" title="${escapeHtml(t.title)}">
                            ${t.completed ? '✅' : ''} ${escapeHtml(t.title)}
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    container.innerHTML = html;
}

// ===== POMODORO TIMER =====
function initPomodoro() {
    // Check if data is from today
    const today = new Date().toDateString();
    if (pomodoroData.lastDate !== today) {
        pomodoroData.count = 0;
        pomodoroData.totalMinutes = 0;
        pomodoroData.lastDate = today;
        saveData(STORAGE_KEYS.POMODORO, pomodoroData);
    }

    updatePomodoroStats();

    // Mode buttons
    document.querySelectorAll('.timer-mode').forEach(btn => {
        btn.addEventListener('click', () => {
            if (timerRunning) return;
            document.querySelectorAll('.timer-mode').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTimerMinutes = parseInt(btn.dataset.minutes);
            timerTotalSeconds = currentTimerMinutes * 60;
            timerRemainingSeconds = timerTotalSeconds;
            updateTimerDisplay();
        });
    });

    document.getElementById('timerStartBtn').addEventListener('click', () => {
        if (timerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    document.getElementById('timerResetBtn').addEventListener('click', resetTimer);

    // Ambient sounds
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Sound is visual-only indicator since we can't embed real audio files
        });
    });

    updateTimerDisplay();
}

function startTimer() {
    timerRunning = true;
    document.getElementById('timerStartBtn').textContent = '⏸ Pause';

    timerInterval = setInterval(() => {
        timerRemainingSeconds--;

        if (timerRemainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            document.getElementById('timerStartBtn').textContent = '▶ Start';

            // If it was a focus session
            const activeMode = document.querySelector('.timer-mode.active');
            if (activeMode && parseInt(activeMode.dataset.minutes) >= 25) {
                pomodoroData.count++;
                pomodoroData.totalMinutes += currentTimerMinutes;
                pomodoroData.lastDate = new Date().toDateString();
                saveData(STORAGE_KEYS.POMODORO, pomodoroData);
                updatePomodoroStats();
                updateDashboard();
            }

            // Alert
            alert('⏰ Timer complete! Great job!');
            timerRemainingSeconds = timerTotalSeconds;
        }

        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('timerStartBtn').textContent = '▶ Resume';
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemainingSeconds = timerTotalSeconds;
    document.getElementById('timerStartBtn').textContent = '▶ Start';
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = Math.floor(timerRemainingSeconds / 60);
    const secs = timerRemainingSeconds % 60;
    document.getElementById('timerMinutes').textContent = mins.toString().padStart(2, '0');
    document.getElementById('timerSeconds').textContent = secs.toString().padStart(2, '0');

    // Update ring
    const circumference = 2 * Math.PI * 90; // 565.48
    const progress = timerRemainingSeconds / timerTotalSeconds;
    const offset = circumference * (1 - progress);
    document.getElementById('timerRing').style.strokeDashoffset = offset;
}

function updatePomodoroStats() {
    document.getElementById('pomoCount').textContent = pomodoroData.count;
    document.getElementById('pomoTotalTime').textContent = pomodoroData.totalMinutes + 'm';
}

function updateTimerTaskSelect() {
    const select = document.getElementById('timerTaskSelect');
    select.innerHTML = '<option value="">Select a task (optional)</option>';
    tasks.filter(t => !t.completed).forEach(t => {
        select.innerHTML += `<option value="${t.id}">${escapeHtml(t.title)}</option>`;
    });
}

// ===== NOTES =====
function initNotes() {
    document.getElementById('addNoteBtn').addEventListener('click', () => {
        editingNoteId = null;
        document.getElementById('noteModalTitle').textContent = 'New Note';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('deleteNoteBtn').style.display = 'none';
        document.querySelectorAll('.note-color').forEach(c => c.classList.remove('selected'));
        document.querySelector('.note-color[data-color="#fff9c4"]').classList.add('selected');
        document.getElementById('noteModal').classList.add('active');
    });

    document.getElementById('closeNoteModal').addEventListener('click', () => {
        document.getElementById('noteModal').classList.remove('active');
    });

    document.getElementById('noteModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
    });

    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    document.getElementById('deleteNoteBtn').addEventListener('click', () => {
        if (editingNoteId && confirm('Delete this note?')) {
            notes = notes.filter(n => n.id !== editingNoteId);
            saveData(STORAGE_KEYS.NOTES, notes);
            document.getElementById('noteModal').classList.remove('active');
            renderNotes();
        }
    });

    // Note color selection
    document.querySelectorAll('.note-color').forEach(c => {
        c.addEventListener('click', () => {
            document.querySelectorAll('.note-color').forEach(cc => cc.classList.remove('selected'));
            c.classList.add('selected');
        });
    });

    // Search
    document.getElementById('noteSearch').addEventListener('input', (e) => {
        renderNotes(e.target.value.toLowerCase());
    });

    renderNotes();
}

function saveNote() {
    const title = document.getElementById('noteTitle').value.trim() || 'Untitled Note';
    const content = document.getElementById('noteContent').value.trim();
    const color = document.querySelector('.note-color.selected')?.dataset.color || '#fff9c4';

    if (!content && !title) {
        alert('Please add some content!');
        return;
    }

    const note = {
        id: editingNoteId || Date.now().toString(),
        title,
        content,
        color,
        updatedAt: new Date().toISOString()
    };

    if (editingNoteId) {
        const idx = notes.findIndex(n => n.id === editingNoteId);
        if (idx !== -1) notes[idx] = note;
    } else {
        notes.unshift(note);
    }

    saveData(STORAGE_KEYS.NOTES, notes);
    document.getElementById('noteModal').classList.remove('active');
    renderNotes();
}

function renderNotes(search = '') {
    const grid = document.getElementById('notesGrid');
    let filtered = search ? notes.filter(n =>
        n.title.toLowerCase().includes(search) ||
        n.content.toLowerCase().includes(search)
    ) : notes;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-large" style="grid-column:1/-1">
                <span class="empty-icon">📝</span>
                <h3>${search ? 'No matching notes' : 'No notes yet'}</h3>
                <p>${search ? 'Try a different search term' : 'Click "+ New Note" to create one!'}</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(note => `
        <div class="note-card" style="background:${note.color}" onclick="openNote('${note.id}')">
            <div class="note-card-title">${escapeHtml(note.title)}</div>
            <div class="note-card-content">${escapeHtml(note.content)}</div>
            <div class="note-card-date">${formatDateTime(note.updatedAt)}</div>
        </div>
    `).join('');
}

window.openNote = function(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    editingNoteId = id;
    document.getElementById('noteModalTitle').textContent = 'Edit Note';
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('deleteNoteBtn').style.display = 'inline-flex';

    document.querySelectorAll('.note-color').forEach(c => {
        c.classList.toggle('selected', c.dataset.color === note.color);
    });

    document.getElementById('noteModal').classList.add('active');
};

// ===== UTILITIES =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const options = { month: 'short', day: 'numeric' };
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

    return d.toLocaleDateString('en-US', options);
}

function formatDateTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}