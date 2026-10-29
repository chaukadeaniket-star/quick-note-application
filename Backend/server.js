
/*{Import required modules} */

import express from "express";   //We import Express framework so Node.js can create our server.
import cors from "cors"; //CORS will allow our frontend to communicate with the backend.
import fs from "fs"; //We import the fs module to read and write data to a file. This will be used to store our notes in a JSON file.

const app = express(); //Think of app as our server.
const port = 5000; // My backend will run on port 5000.

/*{middleware} */
app.use(cors()); //CORS will allow our frontend to communicate with the backend.

// This line allows our backend to accept JSON data in the request body. It is necessary for handling POST requests where the client sends data to the server.
app.use(express.json());


/*{Home Routes} */
app.get("/", (req, res) => {
    res.json({ message: "Quick Note Application Backend." });
});


/*{GET ALL NOTES} */

app.get("/api/notes", (req, res) => {
    // Read the notes from the JSON file
    fs.readFile("./data/notes.json", "utf8", (err, data) => {
        //If file cannot be read
        if (err) {
            console.error("Error reading notes:", err);
            return res.status(500).json({
                error: "Failed to read notes."
            });
        }

        try {
            // convert json text into javascript array of objects
            const notes = JSON.parse(data || "[]");
            res.json(notes);
        } catch (error) {
            console.error("Error parsing notes:", error);
            res.status(500).json({ error: "Invalid notes data." });
        }
    });
});


/*{CREATE NEW NOTE} */
app.post("/api/notes", (req, res) => {
    // GET THE TITLE AND CONTENT FROM REQUEST BODY AND ADD IT TO THE JSON FILE
    const { title, content } = req.body; // Destructure title and content from the request body

    // CHECK WHETHER TITLE AND CONTENT ARE VALID
    if (
        typeof title !== "string" ||
        typeof content !== "string" ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            error: "Title and content are required."
        });
    }

    //read the existing notes.
    fs.readFile("./data/notes.json", "utf8", (err, data) => {
        // IF FILE CANNOT BE READ.
        if (err) {
            console.error("Error reading notes:", err);
            return res.status(500).json({ error: "Failed to read notes." });
        }

        try {
            // CONVERT JSON TEXT INTO JAVASCRIPT ARRAY OF OBJECTS
            const notes = JSON.parse(data || "[]"); // If the file is empty, use an empty array

            // CREATE A NEW NOTE OBJECT
            const newNote = {
                id: Date.now(), // Use the current timestamp as a unique ID
                title: title.trim(),
                content: content.trim()
            };

            // ADD NEW NOTE TO THE ARRAY.
            notes.push(newNote);

            // SAVE THE UPDATED NOTES BACK TO THE JSON FILE.
            fs.writeFile(
                "./data/notes.json",
                JSON.stringify(notes, null, 2),
                "utf8",
                (writeError) => {
                    if (writeError) {
                        console.error("Error writing notes:", writeError);
                        return res.status(500).json({
                            error: "Failed to save note."
                        });
                    }

                    //SEND NEWLY CREATED NOTE BACK TO THE CLIENT.
                    res.status(201).json(newNote);
                }
            );
        } catch (error) {
            console.error("Error parsing notes:", error);
            res.status(500).json({ error: "Invalid notes data." });
        }
    });
});


/* { DELETE ROUTE} */

app.delete("/api/notes/:id", (req, res) => {
    // GET THE NOTE ID FROM THE URL
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id)) {
        return res.status(400).json({ error: "Invalid note ID." });
    }

    // READ THE EXISTING NOTES FROM THE JSON FILE
    fs.readFile("./data/notes.json", "utf8", (err, data) => {
        if (err) {
            console.error("Error reading notes:", err);
            return res.status(500).json({ error: "Failed to read notes." });
        }

        try {
            // CONVERT JSON TEXT INTO JAVASCRIPT ARRAY OF OBJECTS
            const notes = JSON.parse(data || "[]");

            // FIND THE NOTE
            const noteExists = notes.some(note => note.id === id);

            if (!noteExists) {
                return res.status(404).json({ error: "Note not found." });
            }

            // remove the note with the specified ID from the array.
            const updatedNotes = notes.filter(note => note.id !== id);

            // SAVE THE UPDATED NOTES BACK TO THE JSON FILE.
            fs.writeFile(
                "./data/notes.json",
                JSON.stringify(updatedNotes, null, 2),
                "utf8",
                (writeError) => {
                    if (writeError) {
                        console.error("Error deleting notes:", writeError);
                        return res.status(500).json({
                            error: "Failed to delete note."
                        });
                    }

                    // SEND A SUCCESS RESPONSE BACK TO THE CLIENT.
                    res.json({ message: "Note deleted successfully." });
                }
            );
        } catch (error) {
            console.error("Error parsing notes:", error);
            res.status(500).json({ error: "Invalid notes data." });
        }
    });
});


/*{UPDATE EXISTING NOTE} */

app.put("/api/notes/:id", (req, res) => {
    // GET THE NOTE ID FROM THE URL
    const id = Number(req.params.id);

    // GET THE UPDATED TITLE AND CONTENT FROM THE REQUEST BODY
    const { title, content } = req.body;

    // CHECK WHETHER THE NOTE ID, TITLE, AND CONTENT ARE VALID
    if (
        !Number.isSafeInteger(id) ||
        typeof title !== "string" ||
        typeof content !== "string" ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            error: "Valid ID, title, and content are required."
        });
    }

    // READ THE EXISTING NOTES FROM THE JSON FILE
    fs.readFile("./data/notes.json", "utf8", (err, data) => {
        if (err) {
            console.error("Error reading notes:", err);
            return res.status(500).json({ error: "Failed to read notes." });
        }

        try {
            // CONVERT JSON TEXT INTO JAVASCRIPT ARRAY OF OBJECTS
            const notes = JSON.parse(data || "[]");

            // FIND THE POSITION OF THE NOTE TO UPDATE
            const noteIndex = notes.findIndex(note => note.id === id);

            // CHECK WHETHER THE NOTE EXISTS
            if (noteIndex === -1) {
                return res.status(404).json({ error: "Note not found." });
            }

            // UPDATE THE NOTE TITLE AND CONTENT
            notes[noteIndex] = {
                ...notes[noteIndex],
                title: title.trim(),
                content: content.trim()
            };

            // SAVE THE UPDATED NOTES BACK TO THE JSON FILE
            fs.writeFile(
                "./data/notes.json",
                JSON.stringify(notes, null, 2),
                "utf8",
                (writeError) => {
                    if (writeError) {
                        console.error("Error updating note:", writeError);
                        return res.status(500).json({
                            error: "Failed to update note."
                        });
                    }

                    // SEND THE UPDATED NOTE BACK TO THE CLIENT
                    res.json({
                        message: "Note updated successfully.",
                        note: notes[noteIndex]
                    });
                }
            );
        } catch (error) {
            console.error("Error parsing notes:", error);
            res.status(500).json({ error: "Invalid notes data." });
        }
    });
});


/*{START THE SERVER} */
// IMPORTANT: Start the server only after defining all routes.
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
