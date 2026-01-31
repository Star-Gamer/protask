// ===== SESSION TRACKING SYSTEM =====
class PomodoroSession {
    constructor(subject, topic, duration, date = new Date()) {
        this.subject = subject;
        this.topic = topic;
        this.duration = duration; // in minutes
        this.date = date;
        this.timestamp = date.getTime();
    }
}

let sessionsData = JSON.parse(localStorage.getItem('pomodoroSessions')) || [];
let currentSubject = localStorage.getItem('currentSubject') || null;
let currentTopic = localStorage.getItem('currentTopic') || null;
let sessionStartTime = null;
let sessionSubject = null;
let sessionTopic = null;

// Subject and Topic selection
const subjectInput = document.getElementById('subjectInput');
const topicInput = document.getElementById('topicInput');
const setSubjectBtn = document.getElementById('setSubjectBtn');
const currentSubjectDisplay = document.getElementById('currentSubjectDisplay');

setSubjectBtn.addEventListener('click', () => {
    const subject = subjectInput.value.trim();
    const topic = topicInput.value.trim();
    if (subject && topic) {
        currentSubject = subject;
        currentTopic = topic;
        sessionSubject = subject;
        sessionTopic = topic;
        localStorage.setItem('currentSubject', currentSubject);
        localStorage.setItem('currentTopic', currentTopic);
        currentSubjectDisplay.textContent = `📚 ${currentSubject} - ${currentTopic}`;
        currentSubjectDisplay.style.display = 'block';
        subjectInput.value = '';
        topicInput.value = '';
    } else {
        alert('Please enter both Subject and Topic');
    }
});

subjectInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        setSubjectBtn.click();
    }
});

topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        setSubjectBtn.click();
    }
});

// Show current subject and topic if already set
if (currentSubject && currentTopic) {
    currentSubjectDisplay.textContent = `📚 ${currentSubject} - ${currentTopic}`;
    currentSubjectDisplay.style.display = 'block';
}

// Generate PDF Report
const generatePdfBtn = document.getElementById('generatePdfBtn');
generatePdfBtn.addEventListener('click', generatePDFReport);

function generatePDFReport() {
    if (sessionsData.length === 0) {
        alert('No sessions to generate report. Complete a Pomodoro session first!');
        return;
    }

    // Get user data
    const userName = localStorage.getItem('userName') || 'User';
    const userProfilePic = localStorage.getItem('userProfilePic') || '';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate statistics
    const todaySessions = sessionsData.filter(session => {
        const sessionDate = new Date(session.timestamp);
        const todayDate = new Date();
        return sessionDate.toDateString() === todayDate.toDateString();
    });

    // Calculate this week's study time (last 7 days)
    const weekAgoDate = new Date();
    weekAgoDate.setDate(weekAgoDate.getDate() - 7);
    const thisWeekSessions = sessionsData.filter(session => {
        const sessionDate = new Date(session.timestamp);
        return sessionDate >= weekAgoDate;
    });
    
    const totalMinutes = sessionsData.reduce((sum, session) => sum + session.duration, 0);
    const todayMinutes = todaySessions.reduce((sum, session) => sum + session.duration, 0);
    const thisWeekMinutes = thisWeekSessions.reduce((sum, session) => sum + session.duration, 0);
    
    // Group by subject and topic combination with sessions
    const subjectSessions = {};
    sessionsData.forEach(session => {
        const key = `${session.subject} - ${session.topic}`;
        if (!subjectSessions[key]) {
            subjectSessions[key] = { subject: session.subject, topic: session.topic, sessions: [], minutes: 0, count: 0 };
        }
        subjectSessions[key].sessions.push(session);
        subjectSessions[key].minutes += session.duration;
        subjectSessions[key].count++;
    });

    // Build subject summary rows
    const subjectRows = Object.entries(subjectSessions)
        .map(([key, data]) => `
            <tr>
                <td style="border: 1px solid #999; padding: 8px;">${data.subject}</td>
                <td style="border: 1px solid #999; padding: 8px;">${data.topic}</td>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${data.count}</td>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${Math.floor(data.minutes / 60)}h ${data.minutes % 60}m</td>
            </tr>
        `).join('');

    // Build subject-wise detailed sections
    const subjectDetailSections = Object.entries(subjectSessions)
        .map(([key, data]) => `
            <div style="margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px;">
                <h3 style="color: #667eea; margin: 0 0 10px 0; font-size: 15px;">📚 ${data.subject} - ${data.topic}</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #667eea; color: white;">
                            <th style="border: 1px solid #999; padding: 6px; text-align: left;">Date & Time</th>
                            <th style="border: 1px solid #999; padding: 6px; text-align: center;">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.sessions.sort((a, b) => b.timestamp - a.timestamp).map(session => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 6px;">${new Date(session.timestamp).toLocaleString()}</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${session.duration}m</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 12px;"><strong>Total:</strong> ${Math.floor(data.minutes / 60)}h ${data.minutes % 60}m | <strong>Sessions:</strong> ${data.count}</p>
            </div>
        `).join('');

    // Build complete HTML with profile pic
    const profileImg = userProfilePic ? `<img src="${userProfilePic}" alt="Profile" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #667eea; margin-right: 12px;">` : '';
    
    // Prepare chart data for subject-wise study time
    const chartLabels = Object.entries(subjectSessions).map(([key, data]) => `${data.subject}\n${data.topic}`);
    const chartData = Object.entries(subjectSessions).map(([key, data]) => parseFloat((data.minutes / 60).toFixed(2)));
    
    // Create a temporary canvas for the chart (adjust height based on number of bars)
    const chartCanvas = document.createElement('canvas');
    chartCanvas.width = 650;
    chartCanvas.height = Math.max(250, chartLabels.length * 50); // 50px per bar for compact display
    
    const ctx = chartCanvas.getContext('2d');
    
    // Register datalabels plugin
    Chart.register(ChartDataLabels);
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Study Time (Hours)',
                data: chartData,
                backgroundColor: [
                    '#667eea',
                    '#f49063',
                    '#5ac4a8',
                    '#fac858',
                    '#ff7b90',
                    '#8d9ceb'
                ],
                borderColor: [
                    '#667eea',
                    '#f49063',
                    '#5ac4a8',
                    '#fac858',
                    '#ff7b90',
                    '#8d9ceb'
                ],
                borderWidth: 0,
                borderRadius: 6
            }]
        },
        options: {
            responsive: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: function(value) {
                        return value.toFixed(1) + 'h';
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Wait for chart to render and convert to image
    setTimeout(() => {
        const chartImage = chartCanvas.toDataURL('image/png');
        
        const htmlContent = `
        <html style="margin: 0; padding: 0;">
        <head>
            <style>
                html { margin: 0; padding: 0; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0 10px 8px 10px; background: white; }
                h1 { color: #667eea; font-size: 22px; margin: 0 0 3px 0; }
                h2 { color: #2d3748; font-size: 15px; margin: 4px 0 4px 0; border-bottom: 2px solid #667eea; padding-bottom: 2px; }
                h3 { color: #667eea; font-size: 14px; margin: 0; }
                table { width: 100%; border-collapse: collapse; margin: 2px 0; font-size: 11px; }
                th { background: #667eea; color: white; padding: 5px; text-align: left; font-weight: bold; font-size: 11px; }
                td { padding: 4px; border: 1px solid #999; font-size: 10px; }
                tr:nth-child(even) { background: #f5f5f5; }
                .header { margin: 0; border-bottom: 2px solid #667eea; padding-bottom: 4px; display: flex; align-items: center; }
                .header-content { flex: 1; }
                .header-content p { margin: 1px 0; font-size: 11px; }
                .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 3px 0; }
                .stat-box { background: #f9f9f9; padding: 6px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 11px; }
                .stat-val { font-size: 13px; color: #667eea; font-weight: bold; margin-top: 2px; }
                .page-break { page-break-after: always; margin: 0; padding: 0; }
                .chart-container { margin: 10px 0; padding: 12px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 8px; text-align: center; }
                .chart-container h2 { margin-top: 0; }
                .chart-container img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15); }
            </style>
        </head>
        <body>
            <div class="header">
                ${profileImg}
                <div class="header-content">
                    <h1>📚 Pomodoro Study Report</h1>
                    <p><strong>Student:</strong> ${userName}</p>
                    <p><strong>Generated:</strong> ${today}</p>
                </div>
            </div>

            <div class="page-break">
                <h2>📊 Overall Statistics</h2>
                <div class="stats-row">
                    <div class="stat-box">
                        <div class="stat-label">Total Sessions</div>
                        <div class="stat-val">${sessionsData.length}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Today's Sessions</div>
                        <div class="stat-val">${todaySessions.length}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Today's Study Time</div>
                        <div class="stat-val">${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">This Week's Study Time</div>
                        <div class="stat-val">${Math.floor(thisWeekMinutes / 60)}h ${thisWeekMinutes % 60}m</div>
                    </div>
                </div>

                <h2>📖 Summary by Subject & Topic</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Topic</th>
                            <th>Sessions</th>
                            <th>Time Studied</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjectRows}
                    </tbody>
                </table>

                <div class="chart-container">
                    <h2>📈 Study Time by Subject & Topic</h2>
                    <img src="${chartImage}" alt="Study Time Chart" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                </div>
            </div>

            <div>
                <h2>📚 Detailed Study Sessions by Subject & Topic</h2>
                ${subjectDetailSections}
            </div>

            <div style="margin-top: 20px; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; font-size: 11px; color: #999;">
                <p>Keep up the great work! 🎉 Continue your learning journey.</p>
            </div>
        </body>
        </html>
    `;

        // Create element and generate PDF
        const element = document.createElement('div');
        element.innerHTML = htmlContent;

        const options = {
            margin: [0, 10, 0, 10],
            filename: 'pomodoro-report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', windowHeight: document.body.scrollHeight },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4', compress: true }
        };

        html2pdf().set(options).from(element).save();
    }, 500);
}


function updateSessionStats() {
    const today = new Date();
    const todaySessions = sessionsData.filter(session => {
        const sessionDate = new Date(session.timestamp);
        return sessionDate.toDateString() === today.toDateString();
    });

    const todayMinutes = todaySessions.reduce((sum, session) => sum + session.duration, 0);
    const hours = Math.floor(todayMinutes / 60);
    const minutes = todayMinutes % 60;

    document.getElementById('todaySessionCount').textContent = todaySessions.length;
    document.getElementById('todayTotalTime').textContent = `${hours}h ${minutes}m`;

    // Update session list
    const sessionList = document.getElementById('sessionList');
    if (todaySessions.length === 0) {
        sessionList.innerHTML = '<p class="empty-message">No sessions recorded yet</p>';
    } else {
        sessionList.innerHTML = todaySessions.map(session => `
            <div class="session-item">
                <div class="session-info">
                    <div class="session-subject">📚 ${session.subject} - ${session.topic}</div>
                    <div class="session-time">${new Date(session.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div class="session-duration">${session.duration}m</div>
            </div>
        `).join('');
    }
}

// ===== END SESSION TRACKING SYSTEM =====

// Theme Switcher
const themeSelect = document.getElementById('themeSelect');
const savedTheme = localStorage.getItem('theme') || 'purple';

// Apply saved theme on load
document.body.classList.add(`theme-${savedTheme}`);
themeSelect.value = savedTheme;

themeSelect.addEventListener('change', (e) => {
    const theme = e.target.value;
    document.body.classList.remove('theme-purple', 'theme-blue', 'theme-green', 'theme-orange', 'theme-pink');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
});

// User Profile Management
const profilePic = document.getElementById('profilePic');
const profilePicModal = document.getElementById('profilePicModal');
const profilePicPreview = document.getElementById('profilePicPreview');
const userName = document.getElementById('userName');
const userNameInput = document.getElementById('userNameInput');
const profilePicInput = document.getElementById('profilePicInput');
const profileModal = document.getElementById('profileModal');
const profileDropdown = document.querySelector('.profile-dropdown');
const editProfileBtn = document.getElementById('editProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const closeBtn = document.querySelector('.close');

// Load user data on page load
function loadUserData() {
    const savedName = localStorage.getItem('userName') || 'User';
    const savedPic = localStorage.getItem('userProfilePic') || 'https://via.placeholder.com/40/667eea/ffffff?text=U';
    
    userName.textContent = savedName;
    document.getElementById('navUsername').textContent = savedName;
    userNameInput.value = savedName;
    profilePic.src = savedPic;
    profilePicModal.src = savedPic;
    profilePicPreview.src = savedPic;
}

// Toggle profile dropdown
profilePic.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-profile')) {
        profileDropdown.classList.remove('show');
    }
});

// Open profile edit modal
editProfileBtn.addEventListener('click', () => {
    profileModal.classList.add('show');
    profileDropdown.classList.remove('show');
});

// Close profile edit modal
closeBtn.addEventListener('click', () => {
    profileModal.classList.remove('show');
});

profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.remove('show');
    }
});

// Handle profile picture upload
profilePicInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            profilePicPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Make upload button clickable
document.querySelector('.upload-btn').addEventListener('click', (e) => {
    e.preventDefault();
    profilePicInput.click();
});

// Save profile changes
saveProfileBtn.addEventListener('click', () => {
    const newName = userNameInput.value.trim();
    const newPic = profilePicPreview.src;
    
    if (newName === '') {
        alert('Please enter a name!');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('userName', newName);
    localStorage.setItem('userProfilePic', newPic);
    
    // Update UI
    userName.textContent = newName;
    document.getElementById('navUsername').textContent = newName;
    profilePic.src = newPic;
    profilePicModal.src = newPic;
    
    profileModal.classList.remove('show');
    alert('Profile updated successfully!');
});

loadUserData();
updateSessionStats();

// Pomodoro Minimize to Desktop
const minimizeBtn = document.getElementById('minimizeBtn');
let pomodoroMinimized = false;
let pomodoroFloatingWindow = null;

minimizeBtn.addEventListener('click', () => {
    pomodoroMinimized = !pomodoroMinimized;
    
    if (pomodoroMinimized) {
        // Create floating window
        const pomodoro = document.querySelector('.pomodoro-card');
        pomodoroFloatingWindow = document.createElement('div');
        pomodoroFloatingWindow.className = 'pomodoro-floating';
        pomodoroFloatingWindow.innerHTML = `
            <div class="floating-header">
                <span>Pomodoro</span>
                <button class="floating-close">✕</button>
            </div>
            <div class="floating-timer" id="floatingTimer">25:00</div>
        `;
        
        document.body.appendChild(pomodoroFloatingWindow);
        minimizeBtn.classList.add('minimized');
        minimizeBtn.textContent = '↙';
        
        // Close floating window
        pomodoroFloatingWindow.querySelector('.floating-close').addEventListener('click', () => {
            pomodoroFloatingWindow.remove();
            pomodoroMinimized = false;
            minimizeBtn.classList.remove('minimized');
            minimizeBtn.textContent = '↗';
        });
        
        // Update floating timer
        const floatingTimer = pomodoroFloatingWindow.querySelector('#floatingTimer');
        setInterval(() => {
            floatingTimer.textContent = document.getElementById('pomodoroDisplay').textContent;
        }, 100);
        
    } else if (pomodoroFloatingWindow) {
        pomodoroFloatingWindow.remove();
        pomodoroFloatingWindow = null;
        minimizeBtn.classList.remove('minimized');
        minimizeBtn.textContent = '↗';
    }
});

// Listen for pomodoro window closed event
if (window.electron) {
    window.electron.ipcRenderer.on('pomodoro-window-closed', () => {
        pomodoroMinimized = false;
        minimizeBtn.classList.remove('minimized');
        minimizeBtn.textContent = '↗';
    });
}

// Clock functionality
let lastDisplayedTime = '';

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    // Only update DOM if time has changed
    if (timeString !== lastDisplayedTime) {
        document.getElementById('digitalClock').textContent = timeString;
        lastDisplayedTime = timeString;
    }
}

setInterval(updateClock, 1000);
updateClock();

// Settings collapse/expand functionality
const settingsContainer = document.getElementById('settingsContainer');
const settingsToggle = document.getElementById('settingsToggle');
const settingsContent = document.getElementById('settingsContent');
const settingsLabel = document.getElementById('settingsLabel');

let settingsMinimized = false;

// Collapse settings after any setting is applied
function collapseSettings() {
    if (!settingsMinimized) {
        settingsMinimized = true;
        settingsContainer.classList.add('minimized');
        settingsToggle.style.display = 'flex';
    }
}

// Expand settings when clicking the toggle
settingsToggle.addEventListener('click', () => {
    settingsMinimized = false;
    settingsContainer.classList.remove('minimized');
    settingsToggle.style.display = 'none';
});

// Collapse when subject is set
setSubjectBtn.addEventListener('click', collapseSettings);

// Collapse when work timer is set
setTimerBtn.addEventListener('click', collapseSettings);

// Collapse when break timer is set
setBreakBtn.addEventListener('click', collapseSettings);

// Pomodoro Timer
let workDurationMinutes = parseInt(localStorage.getItem('workDuration')) || 1;
let breakDurationMinutes = parseInt(localStorage.getItem('breakDuration')) || 5;
let pomodoroTime = workDurationMinutes * 60; // in seconds
let breakTime = breakDurationMinutes * 60; // in seconds
let currentTime = pomodoroTime;
let isRunning = false;
let isWorkSession = true;
let pomodoroInterval;

// Timer customization
const workDurationInput = document.getElementById('workDurationInput');
const timerInfo = document.getElementById('timerInfo');
const breakDurationInput = document.getElementById('breakDurationInput');

// Load saved durations
workDurationInput.value = workDurationMinutes;
breakDurationInput.value = breakDurationMinutes;
updateTimerDisplay();

setTimerBtn.addEventListener('click', () => {
    const newDuration = parseInt(workDurationInput.value);
    if (newDuration >= 1 && newDuration <= 60) {
        workDurationMinutes = newDuration;
        pomodoroTime = workDurationMinutes * 60;
        currentTime = pomodoroTime;
        localStorage.setItem('workDuration', workDurationMinutes);
        updateTimerDisplay();
        updatePomodoroDisplay();
    } else {
        alert('Please enter a value between 1 and 60 minutes');
    }
});

setBreakBtn.addEventListener('click', () => {
    const newBreakDuration = parseInt(breakDurationInput.value);
    if (newBreakDuration >= 1 && newBreakDuration <= 30) {
        breakDurationMinutes = newBreakDuration;
        breakTime = breakDurationMinutes * 60;
        if (!isWorkSession) {
            currentTime = breakTime;
            updatePomodoroDisplay();
        }
        localStorage.setItem('breakDuration', breakDurationMinutes);
        updateTimerDisplay();
    } else {
        alert('Please enter a value between 1 and 30 minutes');
    }
});

function updateTimerDisplay() {
    timerInfo.textContent = `Work: ${workDurationMinutes} min | Break: ${breakDurationMinutes} min`;
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    document.getElementById('pomodoroDisplay').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

document.getElementById('startPomodoroBtn').addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        sessionStartTime = Date.now();
        if (!sessionSubject) {
            sessionSubject = currentSubject;
        }
        pomodoroInterval = setInterval(() => {
            if (currentTime > 0) {
                currentTime--;
                updatePomodoroDisplay();
            } else {
                // Record session when work session ends
                if (isWorkSession) {
                    const sessionMinutes = pomodoroTime / 60;
                    const newSession = new PomodoroSession(sessionSubject, sessionTopic, sessionMinutes);
                    sessionsData.push(newSession);
                    localStorage.setItem('pomodoroSessions', JSON.stringify(sessionsData));
                    updateSessionStats();
                }
                
                // Switch between work and break
                isWorkSession = !isWorkSession;
                currentTime = isWorkSession ? pomodoroTime : breakTime;
                playNotification();
            }
        }, 1000);
    }
});

document.getElementById('pausePomodoroBtn').addEventListener('click', () => {
    isRunning = false;
    clearInterval(pomodoroInterval);
});

document.getElementById('resetPomodoroBtn').addEventListener('click', () => {
    isRunning = false;
    clearInterval(pomodoroInterval);
    isWorkSession = true;
    currentTime = pomodoroTime;
    updatePomodoroDisplay();
});

function playNotification() {
    // Simple beep notification
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// To-Do List functionality
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    
    const progressPercent = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
    document.getElementById('progressFill').style.width = progressPercent + '%';
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${index})">
            <span class="task-text">${task.text}</span>
            <button class="task-delete" onclick="deleteTask(${index})">Delete</button>
        `;
        taskList.appendChild(li);
    });
    updateProgress();
}

function addTask() {
    const text = taskInput.value.trim();
    if (text === '') {
        alert('Please enter a task!');
        return;
    }
    
    tasks.push({
        text: text,
        completed: false
    });
    
    taskInput.value = '';
    saveTasks();
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Initial render
renderTasks();
