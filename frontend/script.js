const API_URL = "http://localhost:5000/api/notes";

const noteForm = document.getElementById("noteForm");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const notesContainer = document.getElementById("notesContainer");
const noteCount = document.getElementById("noteCount");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEdit");

let editingNoteId = null;

// Display messages to the user
function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = type;

    setTimeout(() => {
        message.textContent = "";
        message.className = "";
    }, 3000);
}

// Load all notes from the backend
async function loadNotes() {
    notesContainer.innerHTML =
        '<p class="loading">Loading your notes...</p>';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch notes.");
        }

        const notes = await response.json();

        displayNotes(notes);
    } catch (error) {
        console.error(error);

        notesContainer.innerHTML = `
            <p class="error">
                Could not load notes. Make sure your backend is running
                on http://localhost:5000.
            </p>
        `;

        noteCount.textContent = "0 notes";
    }
}

// Display notes on the page
function displayNotes(notes) {
    notesContainer.replaceChildren();

    noteCount.textContent =
        `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

    if (notes.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent =
            "No notes yet. Create your first note above!";

        notesContainer.appendChild(emptyMessage);
        return;
    }

    notes.forEach((note) => {
        const card = document.createElement("article");
        card.className = "note-card";

        const title = document.createElement("h3");
        title.textContent = note.title;

        const content = document.createElement("p");
        content.textContent = note.content;

        const actions = document.createElement("div");
        actions.className = "note-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            startEditing(note);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteNote(note.id, deleteButton);
        });

        actions.append(editButton, deleteButton);
        card.append(title, content, actions);
        notesContainer.appendChild(card);
    });
}

// Create a note or update an existing note
noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        showMessage("Please enter both title and content.", "error");
        return;
    }

    const isEditing = editingNoteId !== null;

    const url = isEditing
        ? `${API_URL}/${editingNoteId}`
        : API_URL;

    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Updating..." : "Adding...";

    try {
        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, content })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || "Unable to save note.");
        }

        noteForm.reset();
        resetEditing();

        showMessage(
            isEditing
                ? "Note updated successfully!"
                : "Note added successfully!"
        );

        await loadNotes();
    } catch (error) {
        console.error(error);
        showMessage(error.message, "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Add Note";
    }
});

// Fill the form when the user clicks Edit
function startEditing(note) {
    editingNoteId = note.id;

    titleInput.value = note.title;
    contentInput.value = note.content;

    submitButton.textContent = "Update Note";
    cancelEditButton.classList.remove("hidden");

    noteForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    titleInput.focus();
}

// Reset the form to create a new note
function resetEditing() {
    editingNoteId = null;

    submitButton.textContent = "Add Note";
    cancelEditButton.classList.add("hidden");
}

cancelEditButton.addEventListener("click", () => {
    noteForm.reset();
    resetEditing();
    showMessage("Editing cancelled.");
});

// Delete a note
async function deleteNote(id, button) {
    const confirmed = confirm("Are you sure you want to delete this note?");

    if (!confirmed) {
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || "Unable to delete note.");
        }

        if (editingNoteId === id) {
            noteForm.reset();
            resetEditing();
        }

        showMessage("Note deleted successfully!");

        await loadNotes();
    } catch (error) {
        console.error(error);
        showMessage(error.message, "error");
        button.disabled = false;
    }
}

// Load notes when the page opens
loadNotes();