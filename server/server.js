import express from "express";
import cors from "cors";
import mssql from "mssql";
import { v4 as uuidv4 } from "uuid";

const ticketCode = uuidv4().slice(0, 5);
const app = express();
app.use(cors());
app.use(express.json());

const config = {
  user: "sa",
  password: "sap123",
  server: "DESKTOP-KBHMTST",
  database: "TicketSystem",
  port: 1433,
  options: { encrypt: false },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 15000,
  },
};

const pool = new mssql.ConnectionPool(config);

// Existing signup endpoint
app.post("/api/signup", async (req, res) => {
  const { fullname, email, username, password } = req.body;

  try {
    const connection = await pool.connect();
    const result = await connection
      .request()
      .input("fullname", mssql.VarChar, fullname)
      .input("email", mssql.VarChar, email)
      .input("username", mssql.VarChar, username)
      .input("password", mssql.VarChar, password)
      .query(
        "INSERT INTO Users (Fullname, Email, Username, Password) VALUES (@fullname, @email, @username, @password)"
      );

    if (result.rowsAffected.length > 0) {
      res.status(201).json({ message: "User created successfully" });
    } else {
      res.status(500).json({ error: "User creation failed" });
    }
  } catch (error) {
    console.error("User creation error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Existing login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await pool.connect();
    const result = await connection
      .request()
      .input("username", mssql.VarChar, username)
      .input("password", mssql.VarChar, password)
      .query(
        "SELECT * FROM Users WHERE Username = @username AND Password = @password"
      );

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      if (user.Username === "admin") {
        res.json({ role: "admin" });
      } else if (user.Username === "HR") {
        res.json({ role: "hr" });
      } else {
        res.json({ role: "user" });
      }
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Existing get all tickets endpoint
app.get("/api/tickets", async (req, res) => {
  try {
    const connection = await pool.connect();
    const result = await connection.request().query("SELECT * FROM Tickets");

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset);
    } else {
      res.status(404).json({ error: "No tickets found" });
    }
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// New endpoint to get a single ticket by ticketCode
app.get("/api/tickets/:ticketCode", async (req, res) => {
  const { ticketCode } = req.params;

  try {
    const connection = await pool.connect();
    const result = await connection
      .request()
      .input("ticketCode", mssql.VarChar, ticketCode)
      .query("SELECT * FROM Tickets WHERE TicketCode = @ticketCode");

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ error: "Ticket not found" });
    }
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// New endpoint to get all comments for a ticket
app.get("/api/tickets/:ticketCode/comments", async (req, res) => {
  const { ticketCode } = req.params;

  try {
    const connection = await pool.connect();
    const result = await connection
      .request()
      .input("ticketCode", mssql.VarChar, ticketCode)
      .query("SELECT * FROM Comments WHERE TicketCode = @ticketCode");

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset);
    } else {
      res.status(404).json({ error: "Comments not found" });
    }
  } catch (error) {
    console.error("Error fetching Comments:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Existing create ticket endpoint
app.post("/api/ticket", async (req, res) => {
  const { title, employee, date, description, status, priority } = req.body;

  if (!title || !employee || !date || !description) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }

  const createdBy = "Admin";

  try {
    const connection = await pool.connect();
    const result = await connection
      .request()
      .input("ticketCode", mssql.VarChar, ticketCode)
      .input("title", mssql.VarChar, title)
      .input("employee", mssql.VarChar, employee)
      .input("description", mssql.Text, description)
      .input("priority", mssql.VarChar, priority)
      .input("date", mssql.Date, new Date(date))
      .input("createdBy", mssql.VarChar, createdBy)
      .input("status", mssql.VarChar, status)
      .query(
        "INSERT INTO Tickets (TicketCode, Title, Description, Employee, Priority, Date, CreatedBy, Status) VALUES (@ticketCode, @title, @description, @employee, @priority, @date, @createdBy, @status)"
      );

    if (result.rowsAffected.length > 0) {
      res.status(201).json({ message: "Ticket created successfully" });
    } else {
      console.error("Insert failed. Result:", result);
      res.status(500).json({ error: "Ticket creation failed" });
    }
  } catch (error) {
    console.error("Error creating ticket:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// New endpoint to create a comment for a ticket
app.post("/api/tickets/:ticketCode/comments", async (req, res) => {
  const { ticketCode } = req.params;
  const { commentText, commentedBy } = req.body;

  const commentDate = new Date(); // Current date and time for the comment

  try {
    const connection = await pool.connect();
    const result = await connection
      .request()
      .input("ticketCode", mssql.VarChar, ticketCode)
      .input("commentText", mssql.Text, commentText)
      .input("commentedBy", mssql.VarChar, commentedBy)
      .input("commentDate", mssql.DateTime, commentDate)
      .query(
        "INSERT INTO Comments (TicketCode, CommentText, CommentedBy, CommentDate) VALUES (@ticketCode, @commentText, @commentedBy, @commentDate)"
      );

    if (result.rowsAffected.length > 0) {
      res.status(201).json({ message: "Comment added successfully" });
    } else {
      res.status(500).json({ error: "Failed to add comment" });
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});