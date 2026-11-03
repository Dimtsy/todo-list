// ===== Список задач (To-Do List) =====
// Задачи хранятся в localStorage, поэтому не пропадают после обновления страницы.

const STORAGE_KEY = "todo-list-tasks";

// DOM-элементы
const form = document.getElementById("add-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const empty = document.getElementById("empty");
const emptyText = document.getElementById("empty-text");
const footer = document.getElementById("footer");
const counter = document.getElementById("counter");
const clearDoneBtn = document.getElementById("clear-done");
const filterButtons = document.querySelectorAll(".filters__btn");

// Состояние приложения
let tasks = loadTasks();
let currentFilter = "all";

// ===== Работа с localStorage =====
function loadTasks() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn("Не удалось сохранить задачи:", e);
  }
}

// ===== Действия с задачами =====
function addTask(text) {
  tasks.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    done: false,
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks();
    render();
  }
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function editTask(id, newText) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  const text = newText.trim();
  if (text) {
    task.text = text;
    saveTasks();
  }
  render();
}

function clearDone() {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  render();
}

// ===== Отрисовка =====
function getFilteredTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.done);
  if (currentFilter === "done") return tasks.filter((t) => t.done);
  return tasks;
}

// Склонение слова «задача»
function pluralTasks(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "задача";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "задачи";
  return "задач";
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task" + (task.done ? " is-done" : "");
  li.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task__check";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", "Отметить как выполненную");

  const text = document.createElement("span");
  text.className = "task__text";
  text.textContent = task.text; // textContent защищает от XSS
  text.title = "Двойной клик — редактировать";

  const del = document.createElement("button");
  del.className = "task__delete";
  del.type = "button";
  del.innerHTML = "&times;";
  del.setAttribute("aria-label", "Удалить задачу");

  li.append(checkbox, text, del);
  return li;
}

function render() {
  const visible = getFilteredTasks();

  list.innerHTML = "";
  visible.forEach((task) => list.appendChild(createTaskElement(task)));

  // Пустое состояние
  empty.hidden = visible.length > 0;
  if (tasks.length === 0) {
    emptyText.textContent = "Задач пока нет. Добавьте первую!";
  } else if (currentFilter === "active") {
    emptyText.textContent = "Все задачи выполнены 🎉";
  } else if (currentFilter === "done") {
    emptyText.textContent = "Выполненных задач пока нет";
  }

  // Счётчик и нижняя панель
  const activeCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - activeCount;
  footer.hidden = tasks.length === 0;
  counter.textContent = `Осталось: ${activeCount} ${pluralTasks(activeCount)}`;
  clearDoneBtn.disabled = doneCount === 0;
}

// ===== Редактирование =====
function startEditing(li) {
  const id = li.dataset.id;
  const task = tasks.find((t) => t.id === id);
  const textEl = li.querySelector(".task__text");
  if (!task || !textEl) return;

  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "task__edit";
  editInput.value = task.text;
  editInput.maxLength = 200;

  textEl.replaceWith(editInput);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  let finished = false;
  const finish = (save) => {
    if (finished) return;
    finished = true;
    if (save) editTask(id, editInput.value);
    else render();
  };

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
  editInput.addEventListener("blur", () => finish(true));
}

// ===== Обработчики событий =====
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();

  if (!text) {
    // Пустую задачу не добавляем — подсвечиваем поле
    input.classList.remove("is-error");
    void input.offsetWidth; // перезапуск анимации
    input.classList.add("is-error");
    input.focus();
    return;
  }

  addTask(text);
  input.value = "";
  input.focus();
});

input.addEventListener("input", () => input.classList.remove("is-error"));

// Делегирование событий на список
list.addEventListener("change", (e) => {
  if (e.target.classList.contains("task__check")) {
    toggleTask(e.target.closest(".task").dataset.id);
  }
});

list.addEventListener("click", (e) => {
  if (e.target.classList.contains("task__delete")) {
    const li = e.target.closest(".task");
    li.classList.add("is-removing");
    li.addEventListener("animationend", () => deleteTask(li.dataset.id), { once: true });
  }
});

list.addEventListener("dblclick", (e) => {
  if (e.target.classList.contains("task__text")) {
    startEditing(e.target.closest(".task"));
  }
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });
});

clearDoneBtn.addEventListener("click", clearDone);

// Синхронизация между вкладками браузера
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    tasks = loadTasks();
    render();
  }
});

// ===== Старт =====
document.getElementById("today").textContent = new Date().toLocaleDateString("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

render();
