    let tasks = [];
    let editingIndex = -1;
    let targetDate = null;

// Function to get and display the current date & time
function displayCurrentDateTime() {
    const now = new Date();
    
    // Formatting the date and time
    const formattedDate = now.toLocaleDateString(); // Localized date (MM/DD/YYYY or similar based on locale)
    const formattedTime = now.toLocaleTimeString(); // Localized time (HH:MM:SS AM/PM)

    // Display date and time in the div
    document.getElementById('dateTimeDisplay').textContent = `Current Date: ${formattedDate}, Time: ${formattedTime}`;
}

// Call the function to display the current date and time when the page loads
displayCurrentDateTime(); // Call once immediately

// Update the date and time every second (1000 ms)
setInterval(displayCurrentDateTime, 1000);

function setMeetingDate() {
    const targetDateInput = document.getElementById('targetDate').value;
    const setDateButton = document.getElementById('setDateButton'); // Button to change caption
    
    if (targetDateInput) {
        targetDate = new Date(targetDateInput);

        // Change button caption to show the selected meeting date
        setDateButton.textContent = `Meeting Date Set: ${targetDate.toDateString()}`;

        // Update all tasks' due dates based on the new meeting date
        tasks.forEach(task => {
            const dueDate = new Date(targetDate);
            dueDate.setDate(targetDate.getDate() + task.daysRelative);
            task.dueDate = dueDate;
        });
        
        sortTasksByDueDate();
        displayTasks();
    } else {
        // If no date is selected, ask the user to select a date
        setDateButton.textContent = "Please select a meeting date!";
    }
}

function calculateDaysLeft(dueDate) {
    const today = new Date();
    const timeDifference = dueDate - today;
    const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
    return daysLeft;
}

// Function to sort tasks by due date
function sortTasksByDueDate() {
    tasks.sort((a, b) => a.dueDate - b.dueDate);
}

function addTask() {
    const taskName = document.getElementById('taskName').value.trim(); // Task name from input
    const assignee = document.getElementById('assignee').value; // Task asignee from dropdown
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
    const taskComments = document.getElementById('taskComments').value.trim();
        if (editingIndex === -1) {
            tasks.push({
                name: taskName,
                assignee: assignee,
                daysRelative: daysRelative,
                dueDate: dueDate,
                status: 'Not Yet Due',
                comments: taskComments
            });

        } else {
            tasks[editingIndex] = {
                name: taskName,
                assignee: assignee,
                daysRelative: daysRelative,
                dueDate: dueDate,
                status: tasks[editingIndex].status,
                comments: taskComments,
            };
            document.getElementById('addTaskButton').textContent = "+ Add Task";
            editingIndex = -1;
        }
    resetForm();
    sortTasksByDueDate();
    displayTasks();
	updateDashboard();     
}

//rest Form
function resetForm() {
    document.getElementById('taskName').value = '';
    document.getElementById('daysBeforeAfter').value = '';
    document.getElementById('assignee').selectedIndex = 0;
    document.getElementById('taskComments').value = '';
}

function editTask(index) {
    const task = tasks[index];
        document.getElementById('taskName').value = task.name;
        document.getElementById('daysBeforeAfter').value = task.daysRelative;
        document.getElementById('assignee').value = task.assignee;
        document.getElementById('taskComments').value = task.comments;

        document.getElementById('addTaskButton').textContent = "Update Task";
        editingIndex = index;
	updateDashboard();
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

function updateStatus(index, newStatus) {
    tasks[index].status = newStatus;
    displayTasks();
	updateDashboard();
}

function filterTasks() {
    const query = document.getElementById('searchBox').value.toLowerCase();
    displayTasks(query); // Pass the query to the displayTasks function
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
                    <td style="text-align: left;">${task.name}</td>
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
                        <td style="text-align: left;">${task.comments}</>
                    </td>
                    <td class="action-buttons">
                        <!-- Edit button with tooltip -->
                        <button title="Edit Task" onclick="editTask(${index})">
                        <i class="fa fa-pencil"></i> <!-- Font Awesome edit icon -->
                        </button>

                        <!-- Delete button with tooltip -->
                        <button title="Delete Task" onclick="deleteTask(${index})">
                        <i class="fa fa-trash"></i> <!-- Font Awesome delete icon -->
                        </button>
                        
                        <button title="Download Reminder" onclick="downloadICS('${task.name}', '${task.dueDate}')">
                        <i class="fas fa-calendar-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
    });
    updateDashboard()
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

// Function to handle the download action
function downloadFile() {
    const fileFormat = document.getElementById("fileFormat").value;

    switch (fileFormat) {
        case "pdf":
            ExportToPDF();
            break;
        case "csv":
            ExportToCSV();
            break;
        case "xml":
            exportToXML();
            break;
        default:
            alert("Please select a valid format.");
    }
}

// Export & Import Functions
function ExportToCSV() {
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
        xml += `    <Comments>${task.comments}</Comments>\n`;
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
            const comments = taskElement.getElementsByTagName('Comments')[0].textContent;
            tasks.push({ name, assignee, daysRelative, dueDate, status, comments });
        }

        displayTasks(); // Refresh the displayed tasks
	    updateDashboard();
    };
    reader.readAsText(file);
}

// Function to download the task table as PDF
function ExportToPDF() {
    // Create a new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "landscape",
        format: 'a4',
    });

    // Get the table element and its rows (excluding "Actions" column)
    const taskTable = document.getElementById('taskBody');
    const tableRows = taskTable.querySelectorAll('tbody tr');
    
    // Set PDF title
    doc.setFontSize(12);
    doc.text("Task Management Table", 14, 16);
    
    // Add a timestamp to the PDF
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    // Define table headers (excluding the "Actions" column)
    const headers = ["Task", "Assignee", "Reletive Days", "Due Date", "Days Left", "Status", "Comments" ];
    let rowHeight = 30;  // Set initial row height for table

    // Draw headers in PDF
    doc.setFontSize(10);
    headers.forEach((header, index) => {
        doc.text(header, 14 + index * 50, rowHeight); // Adjust positioning
    });

    rowHeight += 10; // Move down for the first row

    // Loop through each row and add data to the PDF
    tableRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        doc.setFontSize(9);

        // Exclude the "Actions" column (last cell)
        for (let i = 0; i < cells.length - 1; i++) { // Skip the last cell
            doc.text(cells[i].innerText, 14 + i * 50, rowHeight);
        }

        rowHeight += 10; // Move to the next row
    });

    // Save the PDF with a dynamic file name
    doc.save(`Task_Table_${new Date().getTime()}.pdf`);
}

// Helper function to format the date for PDF
function formatDateForPDF(date) {
    let year = date.getFullYear();
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let day = ('0' + date.getDate()).slice(-2);
    let hours = ('0' + date.getHours()).slice(-2);
    let minutes = ('0' + date.getMinutes()).slice(-2);
    let seconds = ('0' + date.getSeconds()).slice(-2);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function downloadICS(taskName, dueDateISO) {
    let dueDate = new Date(dueDateISO); // Parse the due date

    if (!targetDate) {
        alert("Please set the meeting date first.");
         return;
     }

    // Check if the task is overdue
    if (new Date() > dueDate) {
        alert("This task is overdue!");
        return;
    }

    // Create the ICS file content (Reminder event)
    let icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@yourdomain.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(dueDate)}
SUMMARY:${taskName}
DESCRIPTION:${taskName} is due on ${dueDate.toDateString()}
END:VEVENT
END:VCALENDAR`;

    // Create Blob for ICS file content
    let blob = new Blob([icsContent], { type: 'text/calendar' });
    let url = URL.createObjectURL(blob); // Create URL for download

    // Create a temporary <a> element to download the file
    let a = document.createElement('a');
    a.href = url;
    a.download = taskName.replace(/\s+/g, ' ') + '.ics'; // ICS file name
    a.click(); // Trigger the download
    URL.revokeObjectURL(url); // Clean up URL
}

// Helper function to format the date in YYYYMMDDThhmmssZ format for ICS
function formatDate(date) {
    let year = date.getUTCFullYear();
    let month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    let day = ('0' + date.getUTCDate()).slice(-2);
    let hours = ('0' + date.getUTCHours()).slice(-2);
    let minutes = ('0' + date.getUTCMinutes()).slice(-2);
    let seconds = ('0' + date.getUTCSeconds()).slice(-2);

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Reset All
function resetTasks() {
    tasks = [];
    targetDate = null;
    document.getElementById('targetDate').value = '';
    document.getElementById('forumName').value = '';
    displayTasks();
    updateDashboard();
}
