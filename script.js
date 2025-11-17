// State management
class EmployeeState {
    constructor() {
        console.log('Initializing EmployeeState');
        this.loadState();
    }

    loadState() {
        try {
            const savedState = localStorage.getItem('employeeDashboard');
            console.log('Loaded saved state:', savedState);
            
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.state = Array.isArray(parsed.employees) ? parsed.employees : [this.createEmptyEmployee()];
                this.isEditMode = Boolean(parsed.isEditMode);
            } else {
                console.log('No saved state found, creating initial state');
                this.state = [this.createEmptyEmployee()];
                this.isEditMode = true;
            }
            
            if (this.state.length === 0) {
                console.log('State is empty, adding initial row');
                this.state = [this.createEmptyEmployee()];
            }
            
            this.saveState();
        } catch (error) {
            console.error('Error loading state:', error);
            this.state = [this.createEmptyEmployee()];
            this.isEditMode = true;
            this.saveState();
        }
    }

    saveState() {
        try {
            const stateToSave = {
                employees: this.state,
                isEditMode: this.isEditMode
            };
            localStorage.setItem('employeeDashboard', JSON.stringify(stateToSave));
            console.log('State saved successfully');
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    createEmptyEmployee() {
        console.log('Creating new empty employee row');
        return {
            name: { text: '', status: 'not-clocked' },
            shift: { text: '', status: 'normal' },
            firstBreak: { text: '', status: 'not-started' },
            lunch: { text: '', status: 'not-started' },
            secondBreak: { text: '', status: 'not-started' }
        };
    }

    addRow() {
        this.state.push(this.createEmptyEmployee());
        this.saveState();
    }

    deleteRow(index) {
        if (this.state.length > 1) {
            this.state.splice(index, 1);
        } else {
            this.state[0] = this.createEmptyEmployee();
        }
        this.saveState();
    }

    toggleMode() {
        this.isEditMode = !this.isEditMode;
        this.saveState();
        return this.isEditMode;
    }

    updateField(index, field, updates) {
        const employee = this.state[index];
        if (updates.text !== undefined) {
            employee[field].text = updates.text;
        }
        if (updates.status !== undefined) {
            const statusCycles = {
                name: ['not-clocked', 'clocked-in', 'clocked-out'],
                shift: ['normal', 'tardy', 'absent'],
                firstBreak: ['not-started', 'on-break', 'returned'],
                lunch: ['not-started', 'on-break', 'returned'],
                secondBreak: ['not-started', 'on-break', 'returned']
            };

            const currentStatus = employee[field].status;
            const statusArray = statusCycles[field];
            const currentIndex = statusArray.indexOf(currentStatus);
            const nextIndex = (currentIndex + 1) % statusArray.length;
            
            employee[field].status = statusArray[nextIndex];
        }
        this.saveState();
        return employee[field];
    }
}

// UI management
class DashboardUI {
    constructor(state) {
        console.log('Initializing DashboardUI');
        this.state = state;
        
        // Get DOM elements
        try {
            this.tbody = document.getElementById('employeeRows');
            this.addRowBtn = document.getElementById('addRowBtn');
            this.toggleModeBtn = document.getElementById('toggleModeBtn');
            this.table = document.getElementById('employeeTable');
            
            if (!this.tbody || !this.addRowBtn || !this.toggleModeBtn || !this.table) {
                throw new Error('Required DOM elements not found');
            }
        } catch (error) {
            console.error('Error initializing UI:', error);
            return;
        }
        
        this.setupEventListeners();
        this.initializeTable();
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Add row button
        this.addRowBtn.addEventListener('click', () => {
            console.log('Add row button clicked');
            this.state.addRow();
            this.addEmployeeRow(this.state.state.length - 1);
        });

        // Mode toggle button
        this.toggleModeBtn.addEventListener('click', () => {
            console.log('Toggle mode button clicked');
            const isEditMode = this.state.toggleMode();
            this.toggleModeBtn.textContent = isEditMode ? 'Switch to Manage Mode' : 'Switch to Edit Mode';
            this.table.className = isEditMode ? 'edit-mode' : 'manage-mode';
            console.log('Mode switched to:', isEditMode ? 'edit' : 'manage');
        });
    }

    initializeTable() {
        console.log('Initializing table');
        try {
            // Clear existing rows
            this.tbody.innerHTML = '';
            
            // Set initial mode
            this.table.className = this.state.isEditMode ? 'edit-mode' : 'manage-mode';
            this.toggleModeBtn.textContent = this.state.isEditMode ? 'Switch to Manage Mode' : 'Switch to Edit Mode';
            
            // Add rows for existing state
            this.state.state.forEach((_, index) => {
                this.addEmployeeRow(index);
            });
            
            console.log(`Table initialized with ${this.state.state.length} rows`);
        } catch (error) {
            console.error('Error initializing table:', error);
        }
    }

    addEmployeeRow(index) {
        console.log(`Adding row at index ${index}`);
        try {
            const row = this.createRow(this.state.state[index], index);
            this.tbody.appendChild(row);
            console.log('Row added successfully');
        } catch (error) {
            console.error('Error adding row:', error);
        }
    }

    createRow(employee, index) {
        console.log(`Creating row for index ${index}`, employee);
        const row = document.createElement('tr');
        const fields = ['name', 'shift', 'firstBreak', 'lunch', 'secondBreak'];
        
        fields.forEach(field => {
            const td = document.createElement('td');
            td.className = employee[field].status;
            
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = employee[field].text;
            // Set appropriate placeholder based on field
            switch (field) {
                case 'name':
                    input.placeholder = 'Enter name';
                    break;
                case 'shift':
                    input.placeholder = 'Enter shift';
                    break;
                default:
                    input.placeholder = 'Enter time';
            }
            
            // Handle text input (only in edit mode)
            input.addEventListener('change', (e) => {
                if (this.state.isEditMode) {
                    const updates = { text: e.target.value };
                    this.state.updateField(index, field, updates);
                }
            });
            
            // Handle status cycling (only in manage mode)
            cell.addEventListener('click', (e) => {
                if (!this.state.isEditMode) {
                    const updates = { status: 'cycle' };
                    const newState = this.state.updateField(index, field, updates);
                    td.className = newState.status;
                    
                    const nameCell = row.querySelector('td:nth-child(1)');
                    const shiftCell = row.querySelector('td:nth-child(2)');

                    // Update cross-field styles after status change
                    if (field === 'name' || field === 'shift') {
                        this.updateCrossFieldStyles(row, index);
                    }
                }
            });
            
            cell.appendChild(input);
            td.appendChild(cell);
            row.appendChild(td);
        });

        // Add delete button cell
        const deleteTd = document.createElement('td');
        deleteTd.className = 'actions-cell';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Delete row';
        
        deleteBtn.addEventListener('click', () => {
            this.deleteEmployee(index);
        });
        
        deleteTd.appendChild(deleteBtn);
        row.appendChild(deleteTd);

        // Apply cross-field status classes after all cells are created
        this.applyCrossFieldStyles(row, employee);

        return row;
    }

    applyCrossFieldStyles(row, employee) {
        const nameCell = row.querySelector('td:nth-child(1)');
        const shiftCell = row.querySelector('td:nth-child(2)');
        
        if (nameCell && shiftCell) {
            // Apply name status to both name and shift cells
            if (employee.name.status === 'clocked-in') {
                nameCell.classList.add('clocked-in');
                shiftCell.classList.add('clocked-in');
            } else if (employee.name.status === 'clocked-out') {
                nameCell.classList.add('clocked-out');
                shiftCell.classList.add('clocked-out');
            }
            
            // Apply shift status to both name and shift cells
            if (employee.shift.status === 'tardy') {
                nameCell.classList.add('tardy');
                shiftCell.classList.add('tardy');
            } else if (employee.shift.status === 'absent') {
                nameCell.classList.add('absent');
                shiftCell.classList.add('absent');
            }
        }
    }

    updateCrossFieldStyles(row, index) {
        const employee = this.state.state[index];
        const nameCell = row.querySelector('td:nth-child(1)');
        const shiftCell = row.querySelector('td:nth-child(2)');
        
        if (nameCell && shiftCell) {
            // Clear all cross-field classes
            nameCell.classList.remove('clocked-in', 'clocked-out', 'tardy', 'absent');
            shiftCell.classList.remove('clocked-in', 'clocked-out', 'tardy', 'absent');
            
            // Reapply current status classes
            this.applyCrossFieldStyles(row, employee);
        }
    }

    deleteEmployee(index) {
        this.state.deleteRow(index);
        this.initializeTable();
    }
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    const state = new EmployeeState();
    const ui = new DashboardUI(state);
});