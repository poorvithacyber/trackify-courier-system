const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root1234', // change only if your MySQL password is different
    database: 'trackify_db'
});

db.connect((err) => {
    if (err) {
        console.log('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/add-parcel', (req, res) => {
    const { tracking_id, sender, receiver } = req.body;

    if (!tracking_id || !sender || !receiver) {
        return res.send('Please fill all parcel fields');
    }

    const sql = `
        INSERT INTO parcels (tracking_id, sender, receiver)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [tracking_id, sender, receiver], (err) => {
        if (err) {
            console.log('Add parcel error:', err);
            return res.send('Error adding parcel');
        }
        res.send('Parcel Added');
    });
});

app.post('/add-update', (req, res) => {
    console.log('BODY =', req.body);

    const { tracking_id, parcel_status, parcel_location } = req.body;

    if (!tracking_id || !parcel_status || !parcel_location) {
        return res.send('Please fill all update fields');
    }

    const sql = `
        INSERT INTO tracking_updates (tracking_id, status, location)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [tracking_id, parcel_status, parcel_location], (err) => {
        if (err) {
            console.log('Add update error:', err);
            return res.send('Error adding update');
        }
        res.send('Update Added');
    });
});

app.get('/track/:id', (req, res) => {
    const sql = `
        SELECT 
            p.tracking_id,
            p.sender,
            p.receiver,
            t.status,
            t.location,
            t.update_time
        FROM parcels p
        LEFT JOIN tracking_updates t
        ON p.tracking_id = t.tracking_id
        WHERE p.tracking_id = ?
        ORDER BY t.update_time DESC
    `;

    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.log('Track error:', err);
            return res.send('Error fetching data');
        }
        res.json(result);
    });
});
app.get('/parcels', (req, res) => {
    db.query("SELECT * FROM parcels", (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error fetching parcels");
        }
        res.json(result);
    });
});
app.delete('/delete-parcel/:id', (req, res) => {
    const id = req.params.id;

    // delete updates first (important)
    db.query("DELETE FROM tracking_updates WHERE tracking_id = ?", [id], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error deleting updates");
        }

        db.query("DELETE FROM parcels WHERE tracking_id = ?", [id], (err2) => {
            if (err2) {
                console.log(err2);
                return res.send("Error deleting parcel");
            }
            res.send("Parcel Deleted");
        });
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});