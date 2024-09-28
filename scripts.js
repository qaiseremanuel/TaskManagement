    let tasks = [];
    let editingIndex = -1;
    let targetDate = null;

    function setMeetingDate() {
        const targetDateInput = document.getElementById('targetDate').value;
        if (targetDateInput) {
            targetDate = new Date(targetDateInput);
	    alert(`Meeting Date Set: ${targetDate.toDateString()}`);
            tasks.forEach(task => {
                const dueDate = new Date(targetDate);
                dueDate.setDate(targetDate.getDate() + task.daysRelative);
                task.dueDate = dueDate;
            });
            sortTasksByDueDate();
            displayTasks();
        } else {
            alert("Please select a meeting date.");
        }
    }

      function addTask() {
        const taskName = document.getElementById('taskName').value.trim();
        const assignee = document.getElementById('assignee').value;
        const daysRelative = parseInt(document.getElementById('daysBeforeAfter').value);
        if (!targetDate) {
           alert("Please set the meeting date first.");
            return;
        }

        if (!taskName || !assignee || isNaN(daysRelative)) {
            alert("Please enter task name, relative days, and ensure the meeting date is set.");
            return;
        }

        const dueDate = new Date(targetDate);
        dueDate.setDate(targetDate.getDate() + daysRelative);

        if (editingIndex === -1) {
            tasks.push({
                name: taskName,
                assignee: assignee,
                daysRelative: daysRelative,
                dueDate: dueDate,
                status: 'Not Yet Due'
            });

        } else {
            tasks[editingIndex] = {
                name: taskName,
                assignee: assignee,
                daysRelative: daysRelative,
                dueDate: dueDate,
                status: tasks[editingIndex].status
            };

            document.getElementById('addTaskButton').textContent = "+ Add Another Task";
            editingIndex = -1;
        }

        resetForm();
        sortTasksByDueDate();
        displayTasks();
	updateDashboard();
    }

    function resetForm() {
        document.getElementById('taskName').value = '';
        document.getElementById('daysBeforeAfter').value = '';
        document.getElementById('assignee').selectedIndex = 0;
    }

    function displayTasks(query = '', filterByToday = false) {
    const taskBody = document.getElementById('taskBody');
    taskBody.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ensure the time is set to midnight for comparison

    tasks.forEach((task, index) => {
        const daysLeft = calculateDaysLeft(task.dueDate);

        // Convert task properties to lowercase for case-insensitive comparison
        const taskNameLower = task.name.toLowerCase();
        const assigneeLower = task.assignee.toLowerCase();
        const statusLower = task.status.toLowerCase();

        // Check if the task matches the search query or filter by today
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Set time to midnight for comparison

        if (
            (taskNameLower.includes(query) ||
            assigneeLower.includes(query) ||
            statusLower.includes(query)) &&
            (!filterByToday || dueDate.getTime() === today.getTime()) // Check if the task is due today if filter is applied
        ) {
            taskBody.innerHTML += `
                <tr>
                    <td>${task.name}</td>
                    <td style="text-align: center;">${task.assignee}</td>
                    <td style="text-align: center;">${task.daysRelative}</td>
                    <td style="text-align: center;">
                        ${task.dueDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        })}
                    </td>
                    <td style="text-align: center;">${daysLeft}</td>
                    <td style="text-align: center;">
                        <select onchange="updateStatus(${index}, this.value)">
                            <option value="Not Yet Due" ${task.status === 'Not Yet Due' ? 'selected' : ''}>Not Yet Due</option>
                            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                    <td class="action-buttons">
                        <button onclick="editTask(${index})">&#9998;</button> <!-- Pen Icon -->
                        <button onclick="deleteTask(${index})">&#128465;</button> <!-- Trash Bin Icon -->
                    </td>
                </tr>
`;
        }
    });
}

    function editTask(index) {
        const task = tasks[index];
        document.getElementById('taskName').value = task.name;
        document.getElementById('daysBeforeAfter').value = task.daysRelative;
        document.getElementById('assignee').value = task.assignee;
        document.getElementById('addTaskButton').textContent = "Update Task";
        editingIndex = index;
	updateDashboard();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        displayTasks();
	updateDashboard();
    }

    function updateStatus(index, newStatus) {
        tasks[index].status = newStatus;
        displayTasks();
	updateDashboard();
    }

    function resetTasks() {
        tasks = [];
        targetDate = null;
        document.getElementById('targetDate').value = '';
        displayTasks();
        updateDashboard();
    }

    // Function to sort tasks by due date
    function sortTasksByDueDate() {
        tasks.sort((a, b) => a.dueDate - b.dueDate);
    }

    function exportToXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<tasks>\n';

    tasks.forEach(task => {
        const daysLeft = calculateDaysLeft(new Date(task.dueDate)); // Calculate days left
        
        xml += `  <task>\n`;
        xml += `    <name>${task.name}</name>\n`;
        xml += `    <assignee>${task.assignee}</assignee>\n`;
        xml += `    <relativeDays>${task.daysRelative}</relativeDays>\n`;
        xml += `    <dueDate>${task.dueDate.toISOString()}</dueDate>\n`;
        xml += `    <daysLeft>${daysLeft}</daysLeft>\n`;  // Add Days Left field
        xml += `    <status>${task.status}</status>\n`;
        xml += `  </task>\n`;
    });

    xml += '</tasks>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function uploadFromXML(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const xmlData = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, "application/xml");

        const taskElements = xmlDoc.getElementsByTagName('task');
        
        tasks = []; // Clear the current tasks array before importing

        for (let i = 0; i < taskElements.length; i++) {
            const taskElement = taskElements[i];
            const name = taskElement.getElementsByTagName('name')[0].textContent;
            const assignee = taskElement.getElementsByTagName('assignee')[0].textContent;
            const daysRelative = parseInt(taskElement.getElementsByTagName('relativeDays')[0].textContent);
            const dueDate = new Date(taskElement.getElementsByTagName('dueDate')[0].textContent);
            const status = taskElement.getElementsByTagName('status')[0].textContent;

            tasks.push({ name, assignee, daysRelative, dueDate, status });
        }

        displayTasks(); // Refresh the displayed tasks
	updateDashboard();
    };

    reader.readAsText(file);
}

function calculateDaysLeft(dueDate) {
    const today = new Date();
    const timeDifference = dueDate - today;
    const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
    return daysLeft;
}

function deleteTask(index) { 
    // Show confirmation before deleting
    const confirmDelete = confirm("Are you sure you want to delete this task?");
    if (confirmDelete) {
        tasks.splice(index, 1);
        displayTasks();
	updateDashboard();
    }
}

function displayTasks() {
    const taskBody = document.getElementById('taskBody');
    taskBody.innerHTML = '';

    tasks.forEach((task, index) => {
        const daysLeft = calculateDaysLeft(task.dueDate);
        
        // Determine the class based on the task status
        let taskClass = '';
        if (task.status === 'Not Yet Due') {
            taskClass = 'task-not-yet-due';
        } else if (task.status === 'In Progress') {
            taskClass = 'task-in-progress';
        } else if (task.status === 'Completed') {
            taskClass = 'task-completed';
        } else if (task.status === 'Overdue') {
            taskClass = 'task-overdue';
        }

        taskBody.innerHTML += `
            <tr class="${taskClass}">
                <td>${task.name}</td>
                <td style="text-align: center;">${task.assignee}</td>
                <td style="text-align: center;">${task.daysRelative}</td>
                <td style="text-align: center;">${task.dueDate.toDateString()}</td>
                <td style="text-align: center;">${daysLeft}</td>
                <td style="text-align: center;">
                    <select onchange="updateStatus(${index}, this.value)">
                        <option value="Not Yet Due" ${task.status === 'Not Yet Due' ? 'selected' : ''}>Not Yet Due</option>
                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Overdue" ${task.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                    </select>
                </td>
                <td class="action-buttons">
                    <button onclick="editTask(${index})">&#9998;</button> <!-- Pen Icon -->
                    <button onclick="deleteTask(${index})">&#128465;</button> <!-- Trash Bin Icon -->
                </td>
            </tr>
        `;
    });
	updateDashboard();
}

function filterTasks() {
    const query = document.getElementById('searchBox').value.toLowerCase();
    displayTasks(query); // Pass the query to the displayTasks function
}

function displayTasks(query = '') {
    const taskBody = document.getElementById('taskBody');
    taskBody.innerHTML = '';

    tasks.forEach((task, index) => {
        const daysLeft = calculateDaysLeft(task.dueDate);

        // Determine the class based on the task status
        let taskClass = '';
        if (task.status === 'Not Yet Due') {
            taskClass = 'task-not-yet-due';
        } else if (task.status === 'In Progress') {
            taskClass = 'task-in-progress';
        } else if (task.status === 'Completed') {
            taskClass = 'task-completed';
        }

        // Convert task properties to lowercase for case-insensitive comparison
        const taskNameLower = task.name.toLowerCase();
        const assigneeLower = task.assignee.toLowerCase();
        const statusLower = task.status.toLowerCase();

        // Check if the task matches the search query
        if (
            taskNameLower.includes(query) ||
            assigneeLower.includes(query) ||
            statusLower.includes(query)
        ) {
            taskBody.innerHTML += `
                <tr class="${taskClass}">
                    <td>${task.name}</td>
                    <td style="text-align: center;">${task.assignee}</td>
                    <td style="text-align: center;">${task.daysRelative}</td>
                    <td style="text-align: center;">${task.dueDate.toDateString()}</td>
                    <td style="text-align: center;">${daysLeft}</td>
                    <td style="text-align: center;">
                        <select onchange="updateStatus(${index}, this.value)">
                            <option value="Not Yet Due" ${task.status === 'Not Yet Due' ? 'selected' : ''}>Not Yet Due</option>
                            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Overdue" ${task.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                        </select>
                    </td>
                    <td class="action-buttons">
                        <button onclick="editTask(${index})">&#9998;</button> <!-- Pen Icon -->
                        <button onclick="deleteTask(${index})">&#128465;</button> <!-- Trash Bin Icon -->
                    </td>
                </tr>
             `;
        }
    });
}

// Function to filter tasks due today
function filterTasksByToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight to only compare date
    
    displayTasks('', true); // Pass an extra flag for today's filter
}

// Function to remove any filters and show all tasks
function removeFilter() {
    displayTasks(); // Display all tasks without any filter
}

// Updated displayTasks function with a 'filterByToday' flag
function displayTasks(query = '', filterByToday = false) {
    const taskBody = document.getElementById('taskBody');
    taskBody.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ensure the time is set to midnight for comparison

    tasks.forEach((task, index) => {
        const daysLeft = calculateDaysLeft(task.dueDate);

        // Determine the class based on the task status
        let taskClass = '';
        if (task.status === 'Not Yet Due') {
            taskClass = 'task-not-yet-due';
        } else if (task.status === 'In Progress') {
            taskClass = 'task-in-progress';
        } else if (task.status === 'Completed') {
            taskClass = 'task-completed';
        } else if (task.status === 'Overdue') {
            taskClass = 'task-overdue';
        }

        // Convert task properties to lowercase for case-insensitive comparison
        const taskNameLower = task.name.toLowerCase();
        const assigneeLower = task.assignee.toLowerCase();
        const statusLower = task.status.toLowerCase();

        // Check if the task matches the search query or filter by today
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Set time to midnight for comparison

        if (
            (taskNameLower.includes(query) ||
            assigneeLower.includes(query) ||
            statusLower.includes(query)) &&
            (!filterByToday || dueDate.getTime() === today.getTime()) // Check if the task is due today if filter is applied
        ) {
            taskBody.innerHTML += `
                <tr class="${taskClass}">
                    <td>${task.name}</td>
                    <td style="text-align: center;">${task.assignee}</td>
                    <td style="text-align: center;">${task.daysRelative}</td>
                    <td style="text-align: center;">${task.dueDate.toDateString()}</td>
                    <td style="text-align: center;">${daysLeft}</td>
                    <td style="text-align: center;">
                        <select onchange="updateStatus(${index}, this.value)">
                            <option value="Not Yet Due" ${task.status === 'Not Yet Due' ? 'selected' : ''}>Not Yet Due</option>
                            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Overdue" ${task.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                        </select>
                    </td>
                    <td class="action-buttons">
                        <button onclick="editTask(${index})">&#9998;</button> <!-- Pen Icon -->
                        <button onclick="deleteTask(${index})">&#128465;</button> <!-- Trash Bin Icon -->
                    </td>
                </tr>
            `;
        }
    });
}

function updateDashboard() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "Completed").length;
    const inProgressTasks = tasks.filter(task => task.status === "In Progress").length;
    const overdueTasks = tasks.filter(task => task.dueDate < new Date() && task.status !== 'Completed').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasksDueToday = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
    }).length;

    // Update the dashboard HTML
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('tasksDueToday').textContent = tasksDueToday;
    document.getElementById('overdueTasks').textContent = overdueTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('inProgressTasks').textContent = inProgressTasks;
}

function exportToCSV() {
        const csvRows = [];
        csvRows.push(['Activity', 'Assignee', 'Relative Days', 'Due Date', 'Status', 'Comments']);

        tasks.forEach(task => {
            csvRows.push([
                task.name,
                task.assignee,
                task.daysRelative,
                task.dueDate.toDateString(),
                task.status,
                task.comments
            ]);
        });

        const csvString = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'tasks.csv');
        a.click();
        URL.revokeObjectURL(url);
    }
