
// Activity categories and colors
const activities = {
    // Productive activities
    'maths': { name: 'Maths Problems', color: '#3498db', category: 'study', productive: true },
    'english': { name: 'English Lecture', color: '#2980b9', category: 'study', productive: true },
    'reasoning': { name: 'Reasoning Problems', color: '#1abc9c', category: 'study', productive: true },
    'vocab': { name: 'Vocabulary', color: '#16a085', category: 'study', productive: true },
    'idioms': { name: 'Idioms', color: '#27ae60', category: 'study', productive: true },
    'history': { name: 'Modern History', color: '#2ecc71', category: 'study', productive: true },
    'bio': { name: 'Biology', color: '#f1c40f', category: 'study', productive: true },
    'polity': { name: 'Polity', color: '#f39c12', category: 'study', productive: true },
    'squares': { name: 'Squares/Cubes', color: '#e67e22', category: 'study', productive: true },
    
    // Routine activities
    'sleep': { name: 'Sleeping', color: '#9b59b6', category: 'routine', productive: false },
    'eating': { name: 'Eating', color: '#8e44ad', category: 'routine', productive: false },
    'hygiene': { name: 'Hygiene', color: '#34495e', category: 'routine', productive: false },
    'break': { name: 'Break', color: '#7f8c8d', category: 'routine', productive: false },
    
    // Exercise
    'walking': { name: 'Walking', color: '#e74c3c', category: 'exercise', productive: true },
    'exercise': { name: 'Exercise', color: '#c0392b', category: 'exercise', productive: true },
    
    // Wasted time
    'youtube': { name: 'YouTube', color: '#d35400', category: 'wasted', productive: false },
    'social': { name: 'Social Media', color: '#c0392b', category: 'wasted', productive: false },
    'other_waste': { name: 'Other Waste', color: '#bdc3c7', category: 'wasted', productive: false },
    
    // Other
    'other': { name: 'Other', color: '#95a5a6', category: 'other', productive: false }
};

// Current date being viewed
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

// Database
let db;
const DB_NAME = 'ProductivityTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'dailyRecords';

// Charts
let dailyChart = null;
let monthlyChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initDB();
    setupEventListeners();
    updateDateDisplay();
    generateActivityLegend();
    renderActivityList();
});

// Initialize IndexedDB
function initDB() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        }
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        loadDayData();
        loadYearGridData();
    };
    
    request.onerror = function(event) {
        console.error('Database error:', event.target.error);
    };
}

// Set up event listeners
function setupEventListeners() {
    document.getElementById('datePicker').addEventListener('change', function() {
        currentDate = new Date(this.value);
        updateDateDisplay();
        loadDayData();
    });
    
    document.getElementById('prevDay').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
        loadDayData();
    });
    
    document.getElementById('nextDay').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
        loadDayData();
    });
    
    document.getElementById('todayBtn').addEventListener('click', function() {
        currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        updateDateDisplay();
        loadDayData();
    });
    
    document.getElementById('addEntryBtn').addEventListener('click', addNewTimeEntry);
    document.getElementById('saveBtn').addEventListener('click', saveDayData);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });
    
    document.getElementById('importFile').addEventListener('change', importData);
    
    // Activity management
    document.getElementById('addActivityBtn').addEventListener('click', addNewActivity);
    document.getElementById('saveActivityBtn').addEventListener('click', saveEditedActivity);
    document.getElementById('deleteActivityBtn').addEventListener('click', deleteActivity);
    document.querySelector('.close-modal').addEventListener('click', closeEditModal);
    
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('editActivityModal')) {
            closeEditModal();
        }
    });
}

// Update the date display
function updateDateDisplay() {
    const dateStr = currentDate.toISOString().split('T')[0];
    document.getElementById('datePicker').value = dateStr;
    document.title = `Productivity Tracker - ${formatDate(currentDate)}`;
}

// Format date for display
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Generate activity legend
function generateActivityLegend() {
    const legendContainer = document.getElementById('activityLegend');
    legendContainer.innerHTML = '';
    
    for (const [key, activity] of Object.entries(activities)) {
        const legendItem = document.createElement('div');
        legendItem.className = 'activity-legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'activity-color';
        colorBox.style.backgroundColor = activity.color;
        
        const label = document.createElement('span');
        label.textContent = activity.name;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    }
}

// Add a new time entry row
function addNewTimeEntry(data = null) {
    const container = document.getElementById('timeEntriesContainer');
    const entryId = Date.now().toString();
    
    const entryDiv = document.createElement('div');
    entryDiv.className = 'time-entry';
    entryDiv.dataset.entryId = entryId;
    
    const timeInputs = document.createElement('div');
    timeInputs.className = 'time-inputs';
    
    const startHourInput = document.createElement('input');
    startHourInput.type = 'time';
    startHourInput.className = 'time-input start-time';
    startHourInput.value = data ? formatTimeForInput(data.startTime) : '';
    
    const endHourInput = document.createElement('input');
    endHourInput.type = 'time';
    endHourInput.className = 'time-input end-time';
    endHourInput.value = data ? formatTimeForInput(data.endTime) : '';
    
    const activitySelect = document.createElement('select');
    activitySelect.className = 'activity-select';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Activity';
    activitySelect.appendChild(defaultOption);
    
    // Add activity options
    for (const [key, activity] of Object.entries(activities)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = activity.name;
        option.style.backgroundColor = activity.color;
        if (data && data.activity === key) {
            option.selected = true;
        }
        activitySelect.appendChild(option);
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-entry-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', function() {
        container.removeChild(entryDiv);
    });
    
    timeInputs.appendChild(startHourInput);
    timeInputs.appendChild(document.createTextNode('to'));
    timeInputs.appendChild(endHourInput);
    
    entryDiv.appendChild(timeInputs);
    entryDiv.appendChild(activitySelect);
    entryDiv.appendChild(deleteBtn);
    
    container.appendChild(entryDiv);
}

// Format time for input field (HH:MM)
function formatTimeForInput(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Parse time input to minutes since midnight
function parseTimeInput(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Format minutes to HH:MM
function formatMinutesToTime(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Load day data from database
function loadDayData() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const dateStr = currentDate.toISOString().split('T')[0];
    const request = store.get(dateStr);
    
    request.onsuccess = function(event) {
        const data = event.target.result;
        renderTimeEntries(data);
        updateSummaryStats(data);
        updateDailyChart(data);
    };
    
    request.onerror = function(event) {
        console.error('Error loading day data:', event.target.error);
        renderTimeEntries(null);
        updateSummaryStats(null);
        updateDailyChart(null);
    };
}

// Render time entries
function renderTimeEntries(data) {
    const container = document.getElementById('timeEntriesContainer');
    container.innerHTML = '';
    
    if (data && data.entries && data.entries.length > 0) {
        data.entries.forEach(entry => {
            addNewTimeEntry(entry);
        });
    } else {
        // Add 3 empty entries by default
        for (let i = 0; i < 3; i++) {
            addNewTimeEntry();
        }
    }
}

// Save day data to database
function saveDayData() {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const entries = [];
    const entryElements = document.querySelectorAll('.time-entry');
    
    entryElements.forEach(entryEl => {
        const startTime = entryEl.querySelector('.start-time').value;
        const endTime = entryEl.querySelector('.end-time').value;
        const activity = entryEl.querySelector('.activity-select').value;
        
        if (startTime && endTime && activity) {
            entries.push({
                startTime: startTime,
                endTime: endTime,
                activity: activity
            });
        }
    });
    
    // Sort entries by start time
    entries.sort((a, b) => {
        return parseTimeInput(a.startTime) - parseTimeInput(b.startTime);
    });
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const data = {
        date: dateStr,
        entries: entries,
        timestamp: new Date().getTime()
    };
    
    const request = store.put(data);
    
    request.onsuccess = function() {
        alert('Day saved successfully!');
        updateSummaryStats(data);
        updateDailyChart(data);
        loadYearGridData(); // Refresh year grid
    };
    
    request.onerror = function(event) {
        console.error('Error saving day data:', event.target.error);
        alert('Error saving data. Please try again.');
    };
}

// Update summary statistics
function updateSummaryStats(data) {
    let productiveMinutes = 0;
    let wastedMinutes = 0;
    let studyMinutes = 0;
    let exerciseMinutes = 0;
    
    if (data && data.entries) {
        data.entries.forEach(entry => {
            const activity = activities[entry.activity];
            if (activity) {
                const start = parseTimeInput(entry.startTime);
                const end = parseTimeInput(entry.endTime);
                const duration = end - start;
                
                if (duration > 0) {
                    if (activity.productive) productiveMinutes += duration;
                    if (activity.category === 'wasted') wastedMinutes += duration;
                    if (activity.category === 'study') studyMinutes += duration;
                    if (activity.category === 'exercise') exerciseMinutes += duration;
                }
            }
        });
    }
    
    document.getElementById('productiveTime').textContent = 
        `${Math.floor(productiveMinutes / 60)}h ${productiveMinutes % 60}m`;
    document.getElementById('wastedTime').textContent = 
        `${Math.floor(wastedMinutes / 60)}h ${wastedMinutes % 60}m`;
    document.getElementById('studyTime').textContent = 
        `${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`;
    document.getElementById('exerciseTime').textContent = 
        `${Math.floor(exerciseMinutes / 60)}h ${exerciseMinutes % 60}m`;
}

// Update daily chart
function updateDailyChart(data) {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    // Prepare data for chart
    const categories = {
        study: { label: 'Study', color: '#2ecc71', value: 0 },
        exercise: { label: 'Exercise', color: '#e74c3c', value: 0 },
        routine: { label: 'Routine', color: '#9b59b6', value: 0 },
        wasted: { label: 'Wasted', color: '#f39c12', value: 0 },
        other: { label: 'Other', color: '#95a5a6', value: 0 }
    };
    
    if (data && data.entries) {
        data.entries.forEach(entry => {
            const activity = activities[entry.activity];
            if (activity && categories[activity.category]) {
                const start = parseTimeInput(entry.startTime);
                const end = parseTimeInput(entry.endTime);
                const duration = end - start;
                if (duration > 0) {
                    categories[activity.category].value += duration / 60; // Convert to hours
                }
            }
        });
    }
    
    const chartData = {
        labels: Object.values(categories).map(c => c.label),
        datasets: [{
            data: Object.values(categories).map(c => c.value),
            backgroundColor: Object.values(categories).map(c => c.color),
            borderWidth: 1
        }]
    };
    
    if (dailyChart) {
        dailyChart.data = chartData;
        dailyChart.update();
    } else {
        dailyChart = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${label}: ${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update monthly chart
    updateMonthlyChart();
}

// Update monthly chart
function updateMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    // Get data for the current month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const allRecords = event.target.result;
        
        // Filter records for current month
        const monthRecords = allRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && recordDate.getMonth() === month;
        });
        
        // Prepare data for chart
        const daysInMonth = lastDay.getDate();
        const productiveHoursByDay = Array(daysInMonth).fill(0);
        const wastedHoursByDay = Array(daysInMonth).fill(0);
        const otherHoursByDay = Array(daysInMonth).fill(0);
        
        monthRecords.forEach(record => {
            const day = new Date(record.date).getDate() - 1;
            if (record.entries) {
                record.entries.forEach(entry => {
                    const activity = activities[entry.activity];
                    if (activity) {
                        const start = parseTimeInput(entry.startTime);
                        const end = parseTimeInput(entry.endTime);
                        const duration = (end - start) / 60; // Convert to hours
                        
                        if (duration > 0) {
                            if (activity.productive) {
                                productiveHoursByDay[day] += duration;
                            } else if (activity.category === 'wasted') {
                                wastedHoursByDay[day] += duration;
                            } else {
                                otherHoursByDay[day] += duration;
                            }
                        }
                    }
                });
            }
        });
        
        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Productive Hours',
                    data: productiveHoursByDay,
                    backgroundColor: '#27ae60',
                    borderColor: '#27ae60',
                    borderWidth: 1
                },
                {
                    label: 'Wasted Hours',
                    data: wastedHoursByDay,
                    backgroundColor: '#e74c3c',
                    borderColor: '#e74c3c',
                    borderWidth: 1
                },
                {
                    label: 'Other Hours',
                    data: otherHoursByDay,
                    backgroundColor: '#3498db',
                    borderColor: '#3498db',
                    borderWidth: 1
                }
            ]
        };
        
        if (monthlyChart) {
            monthlyChart.data = chartData;
            monthlyChart.update();
        } else {
            monthlyChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            stacked: true,
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Hours'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    const hours = Math.floor(value);
                                    const minutes = Math.round((value - hours) * 60);
                                    return `${label}: ${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
                                }
                            }
                        }
                    }
                }
            });
        }
    };
    
    request.onerror = function(event) {
        console.error('Error loading data for monthly chart:', event.target.error);
    };
}

// Generate year grid
function loadYearGridData() {
    const yearGrid = document.getElementById('yearGrid');
    yearGrid.innerHTML = '<div class="year-grid-container"><div class="months-row" id="monthsContainer"></div></div>';
    
    const monthsContainer = document.getElementById('monthsContainer');
    const currentYear = currentDate.getFullYear();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const allRecords = event.target.result;
        
        // Filter records for current year
        const yearRecords = allRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === currentYear;
        });
        
        // Create a map of date to productive hours for quick lookup
        const productivityMap = {};
        yearRecords.forEach(record => {
            let productiveHours = 0;
            if (record.entries) {
                record.entries.forEach(entry => {
                    const activity = activities[entry.activity];
                    if (activity && activity.productive) {
                        const start = parseTimeInput(entry.startTime);
                        const end = parseTimeInput(entry.endTime);
                        productiveHours += (end - start) / 60; // Convert to hours
                    }
                });
            }
            productivityMap[record.date] = productiveHours;
        });
        
        // Generate grid for each month
        for (let month = 0; month < 12; month++) {
            const monthContainer = document.createElement('div');
            monthContainer.className = 'month-container';
            
            const monthTitle = document.createElement('div');
            monthTitle.className = 'month-title';
            monthTitle.textContent = new Date(currentYear, month, 1).toLocaleDateString(undefined, { month: 'short' });
            
            // Add weekday labels (optional)
            const weekdayLabels = document.createElement('div');
            weekdayLabels.className = 'weekday-labels';
            ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
                const label = document.createElement('div');
                label.className = 'weekday-label';
                label.textContent = day;
                weekdayLabels.appendChild(label);
            });
            
            const daysGrid = document.createElement('div');
            daysGrid.className = 'days-grid';
            
            const firstDay = new Date(currentYear, month, 1);
            const lastDay = new Date(currentYear, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const firstWeekday = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Add cells for each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const productiveHours = productivityMap[dateStr] || 0;
                
                const dayCell = document.createElement('div');
                dayCell.className = 'day-cell';
                dayCell.title = `${dateStr}: ${productiveHours.toFixed(1)} productive hour${productiveHours !== 1 ? 's' : ''}`;
                
                // Set color based on productivity level
                if (productiveHours === 0) {
                    dayCell.style.backgroundColor = '#ebedf0'; // No data
                } else if (productiveHours <= 2) {
                    dayCell.style.backgroundColor = '#9be9a8'; // Low
                } else if (productiveHours <= 4) {
                    dayCell.style.backgroundColor = '#40c463'; // Medium
                } else if (productiveHours <= 6) {
                    dayCell.style.backgroundColor = '#30a14e'; // High
                } else {
                    dayCell.style.backgroundColor = '#216e39'; // Very high
                }
                
                dayCell.addEventListener('click', function() {
                    currentDate = new Date(dateStr);
                    updateDateDisplay();
                    loadDayData();
                });
                
                // Position the cell in the correct grid position
                const date = new Date(currentYear, month, day);
                const weekday = date.getDay();
                const weekOfMonth = Math.floor((day + firstWeekday - 1) / 7);
                daysGrid.appendChild(dayCell);
            }
            
            monthContainer.appendChild(monthTitle);
            monthContainer.appendChild(weekdayLabels);
            monthContainer.appendChild(daysGrid);
            monthsContainer.appendChild(monthContainer);
        }
    };
    
    request.onerror = function(event) {
        console.error('Error loading data for year grid:', event.target.error);
    };
}

// Export data as JSON
function exportData() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const allData = event.target.result;
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivity-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    request.onerror = function(event) {
        console.error('Error exporting data:', event.target.error);
        alert('Error exporting data. Please try again.');
    };
}

// Import data from JSON
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedData)) {
                throw new Error('Invalid data format');
            }
            
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // Clear existing data
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = function() {
                // Add imported data
                let importCount = 0;
                importedData.forEach(record => {
                    const addRequest = store.add(record);
                    addRequest.onsuccess = function() {
                        importCount++;
                        if (importCount === importedData.length) {
                            alert(`Successfully imported ${importCount} records!`);
                            loadDayData();
                            loadYearGridData();
                        }
                    };
                    addRequest.onerror = function(e) {
                        console.error('Error importing record:', e.target.error);
                    };
                });
            };
            
            clearRequest.onerror = function(e) {
                console.error('Error clearing database:', e.target.error);
                alert('Error importing data. Please try again.');
            };
            
        } catch (error) {
            console.error('Error parsing imported file:', error);
            alert('Error parsing the imported file. Please make sure it\'s a valid JSON export from this app.');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Render activity list
function renderActivityList() {
    const container = document.getElementById('activityList');
    container.innerHTML = '';
    
    const activityKeys = Object.keys(activities);
    const maxInitialItems = 3; // Show only 3 activities by default
    
    activityKeys.forEach((key, index) => {
        const activity = activities[key];
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.style.borderLeftColor = activity.color;
        item.dataset.key = key;
        
        // Hide items beyond the initial few
        if (index >= maxInitialItems) {
            item.style.display = 'none';
        }
        
        item.innerHTML = `
            <div class="activity-color-preview" style="background-color: ${activity.color}"></div>
            <div class="activity-name">${activity.name}</div>
            <div class="activity-category ${'category-' + activity.category}">${activity.category}</div>
            <div class="activity-actions">
                <button class="edit-activity">Edit</button>
            </div>
        `;
        
        container.appendChild(item);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-activity').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.closest('.activity-item').dataset.key;
            openEditModal(key);
        });
    });
    
    // Set up toggle button if there are more activities than initial display
    const toggleBtn = document.getElementById('toggleActivitiesBtn');
    if (activityKeys.length > maxInitialItems) {
        toggleBtn.style.display = 'block';
    } else {
        toggleBtn.style.display = 'none';
    }
}

// Toggle activity list visibility
document.getElementById('toggleActivitiesBtn').addEventListener('click', function() {
    const activityList = document.getElementById('activityList');
    const toggleBtn = this;
    
    activityList.classList.toggle('expanded');
    toggleBtn.classList.toggle('expanded');
    
    if (activityList.classList.contains('expanded')) {
        toggleBtn.textContent = 'Show Less';
        // Show all items
        document.querySelectorAll('.activity-item').forEach(item => {
            item.style.display = 'flex';
        });
    } else {
        toggleBtn.textContent = 'Show All Activities';
        // Hide items beyond initial few
        document.querySelectorAll('.activity-item').forEach((item, index) => {
            if (index >= 3) {
                item.style.display = 'none';
            }
        });
    }
});
function openEditModal(key) {
    const activity = activities[key];
    if (!activity) return;
    
    document.getElementById('editActivityKey').value = key;
    document.getElementById('editActivityName').value = activity.name;
    document.getElementById('editActivityCategory').value = activity.category;
    document.getElementById('editActivityColor').value = activity.color;
    document.getElementById('editActivityProductive').checked = activity.productive;
    
    document.getElementById('editActivityModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editActivityModal').style.display = 'none';
}

function addNewActivity() {
    const name = document.getElementById('activityName').value.trim();
    const category = document.getElementById('activityCategory').value;
    const color = document.getElementById('activityColor').value;
    const productive = document.getElementById('activityProductive').checked;
    
    if (!name) {
        alert('Please enter an activity name');
        return;
    }
    
    // Generate a unique key
    const key = name.toLowerCase().replace(/\s+/g, '_');
    
    // Add to activities
    activities[key] = {
        name: name,
        color: color,
        category: category,
        productive: productive
    };
    
    // Clear form
    document.getElementById('activityName').value = '';
    
    // Update UI
    renderActivityList();
    generateActivityLegend();
    
    // Update select options in time entries
    updateActivitySelects();
}

function saveEditedActivity() {
    const key = document.getElementById('editActivityKey').value;
    const name = document.getElementById('editActivityName').value.trim();
    const category = document.getElementById('editActivityCategory').value;
    const color = document.getElementById('editActivityColor').value;
    const productive = document.getElementById('editActivityProductive').checked;
    
    if (!name || !activities[key]) {
        closeEditModal();
        return;
    }
    
    // Update activity
    activities[key] = {
        name: name,
        color: color,
        category: category,
        productive: productive
    };
    
    // Update UI
    renderActivityList();
    generateActivityLegend();
    updateActivitySelects();
    closeEditModal();
    
    // Reload current day to reflect changes
    loadDayData();
}

function deleteActivity() {
    const key = document.getElementById('editActivityKey').value;
    
    if (confirm(`Are you sure you want to delete "${activities[key]?.name}"? This will remove it from all existing records.`)) {
        delete activities[key];
        renderActivityList();
        generateActivityLegend();
        updateActivitySelects();
        closeEditModal();
        loadDayData();
    }
}

function updateActivitySelects() {
    document.querySelectorAll('.activity-select').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Activity';
        select.appendChild(defaultOption);
        
        // Add activity options
        for (const [key, activity] of Object.entries(activities)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = activity.name;
            option.style.backgroundColor = activity.color;
            if (key === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    });
}