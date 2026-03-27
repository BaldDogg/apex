require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 5000;
const SECRET_KEY = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// SQLite БД
const db = new sqlite3.Database('./apexmind.db', (err) => {
    if (err) console.error('Ошибка БД:', err.message);
    else console.log('Подключено к базе SQLite.');
});

db.serialize(() => {
    // Заявки
    db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, company TEXT, position TEXT, phone TEXT, email TEXT, message TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Опросы
    db.run(`CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        position TEXT, company TEXT,
        q1 INT, q2 INT, q3 INT, q4 INT, q5 INT, q6 INT, q7 INT, q8 INT, q9 INT, q10 INT
    )`);

    // Админы
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT UNIQUE,
        password_hash TEXT
    )`);

    // логин 'admin', пароль '123'
    db.get(`SELECT * FROM admins WHERE login = 'admin'`, (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('123', 10);
            db.run(`INSERT INTO admins (login, password_hash) VALUES ('admin', ?)`, [hash]);
            console.log('Создан администратор: логин admin, пароль 123');
        }
    });
});

// Mailtrap
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// Письмо
app.post('/api/leads', (req, res) => {
    const { name, company, position, phone, email, message } = req.body;

    db.run(`INSERT INTO leads (name, company, position, phone, email, message) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, company, position, phone, email, message], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Данные
            transporter.sendMail({
                from: '"APEX MIND" <info@apexmind.ru>',
                to: "info@apexmind.ru",
                subject: "Новая заявка на пилот.",
                text: `Имя: ${name}\nКомпания: ${company}\nТелефон: ${phone}\nEmail: ${email}\nСообщение: ${message}`
            }).catch(console.error);

            res.json({ success: true, message: 'Заявка успешно отправлена!' });
        }
    );
});

// Опрос
app.post('/api/surveys', (req, res) => {
    const { position, company, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10 } = req.body;
    db.run(`INSERT INTO surveys (position, company, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [position, company, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Опрос сохранен!' });
        }
    );
});

// Вход в админку
app.post('/api/admin/login', (req, res) => {
    const { login, password } = req.body;

    db.get(`SELECT * FROM admins WHERE login = ?`, [login], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Неверный логин или пароль' });

        if (bcrypt.compareSync(password, user.password_hash)) {
            const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Неверный логин или пароль' });
        }
    });
});

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'Нет доступа' });

    const cleanToken = token.replace('Bearer ', '');

    jwt.verify(cleanToken, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Токен устарел или недействителен' });
        req.userId = decoded.id;
        next();
    });
}

app.get('/api/admin/leads', verifyToken, (req, res) => {
    db.all(`SELECT * FROM leads ORDER BY date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/admin/surveys', verifyToken, (req, res) => {
    db.get(`SELECT 
        COUNT(id) as total,
        ROUND(AVG(q1), 1) as avg_q1, ROUND(AVG(q2), 1) as avg_q2, 
        ROUND(AVG(q3), 1) as avg_q3, ROUND(AVG(q4), 1) as avg_q4, 
        ROUND(AVG(q5), 1) as avg_q5, ROUND(AVG(q6), 1) as avg_q6, 
        ROUND(AVG(q7), 1) as avg_q7, ROUND(AVG(q8), 1) as avg_q8, 
        ROUND(AVG(q9), 1) as avg_q9, ROUND(AVG(q10), 1) as avg_q10
        FROM surveys`, [], (err, stats) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(stats);
    });
});


app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});