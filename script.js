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

            // Set initial status classes for name/shift cells
            if (field === 'name' || field === 'shift') {
                // First create all cells, then apply shared status
                if (field === 'shift') {
                    const nameCell = row.querySelector('td:nth-child(1)');
                    const shiftCell = row.querySelector('td:nth-child(2)');
                    
                    if (nameCell && shiftCell) {
                        // Apply name status to both cells
                        if (employee.name.status === 'clocked-in' || employee.name.status === 'clocked-out') {
                            nameCell.classList.add(employee.name.status);
                            shiftCell.classList.add(employee.name.status);
                        }
                        
                        // Apply shift status to both cells
                        if (employee.shift.status === 'tardy' || employee.shift.status === 'absent') {
                            nameCell.classList.add(employee.shift.status);
                            shiftCell.classList.add(employee.shift.status);
                        }
                    }
                }
            }
            
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

                    // Handle shift status changes
                    if (field === 'shift' && (newState.status === 'tardy' || newState.status === 'absent')) {
                        nameCell.classList.add(newState.status);
                        shiftCell.classList.add(newState.status);
                    } else if (field === 'shift' && newState.status === 'normal') {
                        nameCell.classList.remove('tardy', 'absent');
                        shiftCell.classList.remove('tardy', 'absent');
                    }

                    // Handle name status changes
                    if (field === 'name') {
                        if (newState.status === 'clocked-in') {
                            nameCell.classList.add('clocked-in');
                            shiftCell.classList.add('clocked-in');
                            nameCell.classList.remove('clocked-out');
                            shiftCell.classList.remove('clocked-out');
                        } else if (newState.status === 'clocked-out') {
                            nameCell.classList.add('clocked-out');
                            shiftCell.classList.add('clocked-out');
                            nameCell.classList.remove('clocked-in');
                            shiftCell.classList.remove('clocked-in');
                        } else {
                            nameCell.classList.remove('clocked-in', 'clocked-out');
                            shiftCell.classList.remove('clocked-in', 'clocked-out');
                        }
                    }
                }
            });
            
            cell.appendChild(input);
            td.appendChild(cell);
            row.appendChild(td);
        });

        return row;
    }
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    const state = new EmployeeState();
    const ui = new DashboardUI(state);
});
