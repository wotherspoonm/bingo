"use strict";
let TASKS_DATA_KEY = "098ry23908ry9ewfqhuiqewyb";
let taskData = [];
let maxBoardSize = 0;
let sideLength = 0;

//Code to allow user to load data
let reader = null;
const fileSelector = document.getElementById('inputFile');
fileSelector.addEventListener('change', (event) => {
    const fileList = event.target.files;
    reader = new FileReader();
    reader.readAsText(fileList[0]);
    setTimeout(function () {
        taskData = [];
        taskData = reader.result.split("\n");
        maxBoardSize = Math.floor(Math.sqrt(taskData.length))
        createDropdown();
    }, 500);
});

class Task {
    //Constructor
    constructor(description) {
        this._description = description;
        this._checked = false;
    }
    //Accessors
    get description() { return this._description; }
    get checked() { return this._checked; }
    //Mutators
    set description(newDescription) {
        this._description = newDescription;
    }
    set checked(newChecked) {
        this._checked = newChecked;
    }
    //Methods
    fromData(data) {
        this._description = data._description;
        this._checked = data._checked;
    }
}

class TaskList {
    //Constructor
    constructor() {
        this._tasks = [];
        this._boardSize = 5;
    }
    //Accessors
    get tasks() { return this._tasks; }
    get boardSize() { return this._boardSize; }
    //Mutator
    set boardSize(newBoardSize) {
        this._boardSize = newBoardSize;
    }
    //Methods
    addTask(description) {
        let newTask = new Task(description);
        this._tasks.push(newTask);
    }
    fromData(dataObject) {
        let data = dataObject._tasks;
        this._tasks = [];
        for (let i = 0; i < data.length; i++) {
            let task = new Task();
            task.fromData(data[i]);
            this._tasks.push(task);
        }
        this._boardSize = dataObject._boardSize;
    }
}

function checkIfDataExistsLocalStorage(key) {
    let data = localStorage.getItem(key);
    try {
        data = JSON.parse(data);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        if (data === null || data === undefined || data === "" || data === "null" || data === "undefined") //need to check string variants cause code local storage spits out strings
        {
            return false;
        }
        return true;
    }
}

function updateLocalStorage(key, data) {
    if (typeof (data) === 'object') {
        data = JSON.stringify(data);
    }
    localStorage.setItem(key, data);
}

function getDataLocalStorage(key) {
    let data = localStorage.getItem(key);
    try {
        data = JSON.parse(data);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        return data;
    }
}

//Function to create HTML to display board
function showTasks() {
    let output = '';
    sideLength = 85 / taskList.boardSize;
    let scaling = (window.innerHeight < window.innerWidth) ? 'vh' : 'vw';
    //Looping through each task and contructing the nessessary html
    for (let i = 0; i < taskList.tasks.length; i++) {
        let isChecked = taskList.tasks[i].checked;
        if (i % taskList.boardSize == 0) {
            output += '<div class="flex-container">';
        }
        output += `
        <div id = "box${i}" onclick = "${(isChecked ? 'undo' : 'check')}(${i})" style = "background-color: ${(isChecked ? '#488214	' : '#000000')}; width: ${sideLength}${scaling}; height: ${sideLength}${scaling}">
            <span>
                <h5 id = "text${i}" class = "white-text element" style = "font-size: ${sideLength*0.135}${scaling}">${taskList.tasks[i].description}</h5>
            </span>
        </div>
        `;
        if (i != 0 && (i + 1) % taskList.boardSize == 0) {
            output += '</div>';
        }
    }
    let taskGridRef = document.getElementById('taskGrid');
    taskGridRef.innerHTML = output;
    //Checking for bingo
    let bingoRef = document.getElementById('bingo');
    if (checkBingo()) {
        bingoRef.innerHTML = 'You got a bingo! Congrats!';
    }
    else {
        bingoRef.innerHTML = 'Bingo';
    }
}

//Function to create a new set of tasks
function createNewTasks() {
    if (taskData.length !== 0) {
        if (taskData.length > 3) {
            taskList = new TaskList();
            //Determing inputted board size
            let boardSizeRef = document.getElementById('boardSizeList');
            let input = boardSizeRef.value;
            taskList.boardSize = parseInt(input);
            let usedTasks = [];
            //Creating a list of tasks with a length equal to boardSize**2
            for (let i = 0; i < taskList.boardSize ** 2; i++) {
                let usedNumber = false;
                let num = Math.floor(Math.random() * taskData.length);
                while (!usedNumber) {
                    if (usedTasks.includes(num)) {
                        num = Math.floor(Math.random() * taskData.length);
                    }
                    else {
                        usedNumber = true;
                        usedTasks.push(num);
                        taskList.addTask(taskData[num]);
                    }
                }
            }
            updateLocalStorage(TASKS_DATA_KEY, taskList);
            showTasks();
        }
        else {
            alert('You need at least 4 tasks in the game data to create the minimum sized bingo board');
        }
    }
    else {
        alert('Please load bingo game data');
    }
}

//Function to set task attribute, checked, to true
function check(index) {
    taskList.tasks[index].checked = true;
    showTasks();
    updateLocalStorage(TASKS_DATA_KEY, taskList);
}

//Function to set task attribute, checked, to false
function undo(index) {
    taskList.tasks[index].checked = false;
    showTasks();
    updateLocalStorage(TASKS_DATA_KEY, taskList);
}

//Function to confirm that user wants to refresh tasks
function refreshTasks() {
    if (confirm('Are you sure you wish to create new tasks?')) {
        createNewTasks();
    }
}

//Function called when the user resizes the window
function boxResize() {
    let scaling = (window.innerHeight < window.innerWidth) ? 'vh' : 'vw';
    for (let i = 0; i < taskList.tasks.length; i++) {
        let boxRef = document.getElementById(`box${i}`);
        let textRef = document.getElementById(`text${i}`);
        boxRef.style.width = `${sideLength}${scaling}`;
        boxRef.style.height = `${sideLength}${scaling}`;
        textRef.style.fontSize = `${sideLength*0.135}${scaling}`;
    }
}

//Function to check if there is a bingo or not
function checkBingo() {
    //Constucting matrix
    let matrix = [];
    for (let i = 0; i < taskList.boardSize; i++) {
        let nextRow = [];
        for (let j = 0; j < taskList.boardSize; j++) {
            nextRow.push(taskList.tasks[i * taskList.boardSize + j].checked);
        }
        matrix.push(nextRow);
    }
    //Checking for a row, column or diagonal
    let checkDiag1 = true;
    let checkDiag2 = true;
    for (let i = 0; i < taskList.boardSize; i++) {
        let checkColumn = true;
        let checkRow = true;
        for (let j = 0; j < taskList.boardSize; j++) {
            if (!matrix[i][j]) {
                checkRow = false;
            }
            if (!matrix[j][i]) {
                checkColumn = false;
            }
        }
        //Checking columns and rows
        if (checkColumn || checkRow) {
            return true;
        }
        if (!matrix[i][i]) {
            checkDiag1 = false;
        }
        if (!matrix[i][taskList.boardSize - i - 1]) {
            checkDiag2 = false;
        }
    }
    //Checking diagonals
    if (checkDiag1 || checkDiag2) {
        return true;
    }
    return false;
}

//Function to create dropdown list for selection of board size
function createDropdown() {
    let output = '';
    let boardSizeListRef = document.getElementById('boardSizeList');
    for (let i = 2; i <= maxBoardSize && i <= 10; i++) {
        output += `<option value = "${i}">${i} x ${i}</option>`;
    }
    boardSizeListRef.innerHTML = output;
}

//Constructing taskList from either local storage or create a new list
let taskList = new TaskList();
if (typeof (Storage) !== "undefined") {
    console.log("Local storage is available");
    //Check data exists and is valid
    let validTaskData = checkIfDataExistsLocalStorage(TASKS_DATA_KEY);
    if (validTaskData) {
        let data = getDataLocalStorage(TASKS_DATA_KEY);
        taskList.fromData(data);
        showTasks();
    }
    else {
        createNewTasks();
    }
}