

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = './database.db';

// --- Database Setup ---
let db;
let isDbReady = false;

// Promisify DB methods for async/await usage
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
        if (err) return reject(err);
        resolve(this);
    });
});
const dbGet = (query, params = []) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
    });
});
const dbAll = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
    });
});


// --- Database Initialization and Seeding ---
const seedData = {
  "client": {
    "name": "Nome do Cliente LLC",
    "address": "Rua Principal, 123, Qualquer Cidade, BR 12345",
    "contactPerson": "Joana Silva",
    "phone": "(11) 98765-4321",
    "email": "contato@cliente.com",
    "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuDC-pPnhOFSyslYWgAenCLYEWTRCoz1wPWZEddyFzjHxWK5tz_GBCrzk9IKaH-4Cdq66sJqqnM0hvAL51wwU1Q3fsERZTeFX6joeM7tJj_uG2t0Rpim066Q6RRCHjPfTFfLyR_IZ1x9v-Ha3avuyuHcut4jER6VUsLWcY9RSStmctVfmrQ-OT5uxOJv_jSMLkm0XO3vP-KpAbRGuUsoyDbkP6bL_Fh3QZQg-2e-fDeaQiDShsL_MrxCxYSu-jIARrcCnwxrSsmpY4c",
    "floorPlanUrl": null,
    "coverImageUrl": null
  },
  "stats": [
    { "icon": "verified", "label": "Pontuação de Conformidade", "value": "98%", "variant": "success" },
    { "icon": "error", "label": "Falha de Equipamento", "value": 0, "variant": "critical" },
    { "icon": "notification_important", "label": "Próximas Validades", "value": 5, "variant": "warning" }
  ],
  "inspection": { "date": "26 de Outubro de 2024", "time": "10:00" },
  "equipmentData": [
    { "name": "Extintores de Incêndio", "icon": "fire_extinguisher", "items": [
        { "id": "FE-BLD1-FL2-004", "location": "Prédio 1, Andar 2, Ala Leste", "lastInspected": "2023-10-25", "status": "ok" },
        { "id": "FE-BLD1-FL2-005", "location": "Prédio 1, Andar 2, Ala Oeste", "lastInspected": "2023-09-11", "status": "fail" },
        { "id": "FE-BLD1-FL1-001", "location": "Prédio 1, Andar 1, Lobby", "lastInspected": "2023-10-02", "status": "maintenance" }
    ]},
    { "name": "Alarmes de Fumaça", "icon": "smoke_free", "items": [
        { "id": "SA-BLD1-FL2-015", "location": "Prédio 1, Andar 2, Corredor C", "lastInspected": "2023-10-25", "status": "ok" }
    ]},
    { "name": "Hidrantes de Incêndio", "icon": "fire_hydrant", "items": [
        { "id": "FH-EXT-PKG-001", "location": "Exterior, Estacionamento Norte", "lastInspected": "2023-10-18", "status": "ok" }
    ]}
  ],
  "checklistEquipment": { "id": "EXT-053", "name": "Extintor ABC 10lb", "building": "Escritório Principal", "floor": "2", "room": "Sala de Conferência B", "lastInspected": "2023-10-15", "lastInspector": "J. Doe", "lastStatus": "OK" },
  "checklistData": [
    { "id": "check1", "label": "O manômetro de pressão está na zona verde?", "checked": false },
    { "id": "check2", "label": "O pino e o lacre estão intactos?", "checked": false },
    { "id": "check3", "label": "Sem danos físicos óbvios, corrosão ou vazamentos?", "checked": false },
    { "id": "check4", "label": "O bico está livre de obstruções?", "checked": false },
    { "id": "check5", "label": "Está montado corretamente e acessível?", "checked": false },
    { "id": "check6", "label": "A etiqueta de inspeção está atualizada?", "checked": false },
    { "id": "check7", "label": "O registro de manutenção está em dia?", "checked": false },
    { "id": "check8", "label": "A data do teste hidrostático é válida?", "checked": false }
  ],
  "reportClient": { "name": "Sede Wayne Enterprises", "address": "Avenida das Indústrias, 1007, Gotham City", "inspectionDate": "26 de Out de 2023", "reportId": "#GTM-2023-1026", "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuD_U6yYoSwLKP8_WqO7DbYWXiH6Ya_wg96CSBmo25qA6_tTfxZrVI1-kOYoRiArYkTlm7jvHuLYjn3pMWSC-vqn5vBjhWK3V6XHqvhXczez32JNywDqSe3n1-9ceafcYtb5RHONOp9AYaccIlnw4hvfpQmf7yR1X37bw91tjyZXa40EyxpBCsPtSAY_fRzMsg4thi74LPsWM5Mdxjh9JFm4--SAmiNJLgmZ6-KM4emGVsa5FZyiH0TM0TQWQQ3Ah_cXwFSkDb157OI" },
  "userProfile": { "name": "João da Silva", "technicianId": "FI-12345", "company": "FireSafe Inc.", "avatarUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuDC9niU-TSiMRBfBf50rMQYVLXD9928-DL_YCS1BGesRf-rwkgjlJBobTHQuUbJuUL56MXjRREu21uMpZZAz-8_NLpmXPZ1H6dVZDfnUTZhpY0e4KeMz7q1RL1fOne01nNjuAYzMMH1B4xlItBujefbl2IdVy3d63j8JXYBIiHPMP__y9rkHYdt97UYckfFQGlKgl53KUeFv4pvHeDEYADMmgnp80bvR1rtKAGA92S6vfQxICNIA70YXyGAMJfxvhCNc118aA7kcaE" },
  "settings": [
    { "title": "Conta", "items": [
        { "id": "edit-profile", "type": "link", "icon": "person", "label": "Editar Perfil", "href": "#" },
        { "id": "change-password", "type": "link", "icon": "lock", "label": "Alterar Senha", "href": "#" }
    ]},
    { "title": "Aplicativo", "items": [
        { "id": "dark-mode", "type": "toggle", "icon": "dark_mode", "label": "Modo Escuro" },
        { "id": "notifications", "type": "link", "icon": "notifications", "label": "Notificações", "href": "#" },
        { "id": "clear-cache", "type": "link", "icon": "cleaning_services", "label": "Limpar Cache", "href": "#" }
    ]},
    { "title": "Suporte e Legal", "items": [
        { "id": "help-center", "type": "link", "icon": "", "label": "Central de Ajuda", "href": "#" },
        { "id": "privacy-policy", "type": "link", "icon": "", "label": "Política de Privacidade", "href": "#" },
        { "id": "terms-of-service", "type": "link", "icon": "", "label": "Termos de Serviço", "href": "#" }
    ]}
  ],
  "inspectionHistory": []
};

const initializeDatabase = async () => {
    console.log('Initializing database schema...');
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS client (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, address TEXT, contactPerson TEXT, phone TEXT, email TEXT,
            imageUrl TEXT, floorPlanUrl TEXT, coverImageUrl TEXT
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS equipment_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, icon TEXT
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS equipment (
            id TEXT PRIMARY KEY, location TEXT, lastInspected TEXT, status TEXT,
            category_id INTEGER, FOREIGN KEY (category_id) REFERENCES equipment_categories (id)
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS inspection_history (
            id TEXT PRIMARY KEY, inspectionDate TEXT, equipmentId TEXT, status TEXT,
            checklistItems TEXT, evidencePhoto TEXT, observations TEXT, generalObservations TEXT, technicianId TEXT
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS app_state ( key TEXT PRIMARY KEY, value TEXT )`);
        console.log('Schema initialized.');

        const clientCount = await dbGet(`SELECT COUNT(*) as count FROM client`);
        if (clientCount.count > 0) {
            console.log('Database already seeded.');
            isDbReady = true;
            return;
        }

        console.log('Database is empty. Seeding data...');
        
        const c = seedData.client;
        await dbRun(`INSERT INTO client (name, address, contactPerson, phone, email, imageUrl, floorPlanUrl, coverImageUrl)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                     [c.name, c.address, c.contactPerson, c.phone, c.email, c.imageUrl, c.floorPlanUrl, c.coverImageUrl]);

        for (const category of seedData.equipmentData) {
            const result = await dbRun(`INSERT INTO equipment_categories (name, icon) VALUES (?, ?)`, [category.name, category.icon]);
            const categoryId = result.lastID;
            for (const item of category.items) {
                await dbRun(`INSERT INTO equipment (id, location, lastInspected, status, category_id)
                             VALUES (?, ?, ?, ?, ?)`, [item.id, item.location, item.lastInspected, item.status, categoryId]);
            }
        }

        for (const inspection of seedData.inspectionHistory) {
             await dbRun(`INSERT INTO inspection_history (id, inspectionDate, equipmentId, status, checklistItems, evidencePhoto, observations, generalObservations, technicianId)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                         [inspection.id, inspection.inspectionDate, inspection.equipmentId, inspection.status, JSON.stringify(inspection.checklistItems), inspection.evidencePhoto, inspection.observations, inspection.generalObservations, inspection.technicianId]);
        }
        
        await dbRun(`INSERT INTO app_state (key, value) VALUES (?, ?)`, ['inspection', JSON.stringify(seedData.inspection)]);
        await dbRun(`INSERT INTO app_state (key, value) VALUES (?, ?)`, ['userProfile', JSON.stringify(seedData.userProfile)]);
        await dbRun(`INSERT INTO app_state (key, value) VALUES (?, ?)`, ['settings', JSON.stringify(seedData.settings)]);
        await dbRun(`INSERT INTO app_state (key, value) VALUES (?, ?)`, ['stats', JSON.stringify(seedData.stats)]);
        await dbRun(`INSERT INTO app_state (key, value) VALUES (?, ?)`, ['checklistEquipment', JSON.stringify(seedData.checklistEquipment)]);
        await dbRun(`INSERT INTO app_state (key, value) VALUES (?, ?)`, ['checklistData', JSON.stringify(seedData.checklistData)]);
        await dbRun(`INSERT INTO app_state (key, value) VALUES (?, ?)`, ['reportClient', JSON.stringify(seedData.reportClient)]);

        console.log('Database seeded successfully.');
        isDbReady = true;
    } catch (err) {
        console.error('--- CRITICAL DATABASE SETUP ERROR ---');
        console.error('Failed to initialize or seed database:', err);
        console.error('---');
        process.exit(1);
    }
};

const checkDbReady = (req, res, next) => {
    if (isDbReady) return next();
    res.status(503).json({ message: "Service Unavailable: The database is initializing. Please try again in a moment." });
};

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use((req, res, next) => {
    // Simple logger for API calls
    if (req.path.startsWith('/api/')) {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
});

// --- Health Check & Proxy ---
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/api/image-proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('Image URL is required');
    try {
        const decodedUrl = decodeURIComponent(url);
        const response = await axios({ method: 'get', url: decodedUrl, responseType: 'stream', timeout: 5000 });
        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        console.error('Error proxying image:', error.message);
        res.status(500).send('Failed to fetch image');
    }
});

// Apply DB readiness check to all API routes
app.use('/api', checkDbReady);

// --- Helper to assemble full app data state ---
const getAppDataFromDb = async () => {
    const client = await dbGet(`SELECT * FROM client LIMIT 1`);
    const categories = await dbAll(`SELECT * FROM equipment_categories`);
    const allEquipment = await dbAll(`SELECT * FROM equipment`);
    const inspectionHistory = await dbAll(`SELECT * FROM inspection_history`);
    
    const equipmentData = categories.map(cat => ({
        name: cat.name, icon: cat.icon,
        items: allEquipment.filter(eq => eq.category_id === cat.id).map(eq => ({
            id: eq.id, location: eq.location, lastInspected: eq.lastInspected, status: eq.status
        }))
    }));
    
    const parsedHistory = inspectionHistory.map(h => ({ ...h, checklistItems: JSON.parse(h.checklistItems) }));

    const stateKeys = ['inspection', 'userProfile', 'settings', 'stats', 'checklistEquipment', 'checklistData', 'reportClient'];
    const statePromises = stateKeys.map(key => dbGet(`SELECT value FROM app_state WHERE key = ?`, [key]));
    const stateResults = await Promise.all(statePromises);

    const appData = {
        client, equipmentData, inspectionHistory: parsedHistory,
        ...stateResults.reduce((acc, result, index) => {
            acc[stateKeys[index]] = JSON.parse(result.value);
            return acc;
        }, {})
    };
    return appData;
};

// --- API ROUTES ---
// This is the canonical order for Express: API routes first.
app.get('/api/app-data', async (req, res) => {
    try {
        const data = await getAppDataFromDb();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Error reading from database", error: error.message });
    }
});

app.get('/api/equipment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const eq = await dbGet(`
            SELECT e.id, e.location, e.lastInspected, e.status, c.name as categoryName, c.icon as categoryIcon
            FROM equipment e JOIN equipment_categories c ON e.category_id = c.id WHERE e.id = ?`, [id]);
        
        if (eq) {
            res.status(200).json({
                categoryName: eq.categoryName, categoryIcon: eq.categoryIcon,
                item: { id: eq.id, location: eq.location, lastInspected: eq.lastInspected, status: eq.status }
            });
        } else {
            res.status(404).json({ message: `Equipment with ID ${id} not found` });
        }
    } catch (error) {
        res.status(500).json({ message: "Error reading from database", error: error.message });
    }
});

app.patch('/api/client', async (req, res) => {
    const { floorPlanUrl, coverImageUrl } = req.body;
    if (floorPlanUrl === undefined && coverImageUrl === undefined) {
        return res.status(400).json({ message: "No update data provided." });
    }
    try {
        if (floorPlanUrl !== undefined) await dbRun(`UPDATE client SET floorPlanUrl = ? WHERE id = 1`, [floorPlanUrl]);
        if (coverImageUrl !== undefined) await dbRun(`UPDATE client SET coverImageUrl = ? WHERE id = 1`, [coverImageUrl]);
        const updatedClient = await dbGet(`SELECT * FROM client LIMIT 1`);
        res.status(200).json(updatedClient);
    } catch (error) {
        res.status(500).json({ message: "Error updating database.", error: error.message });
    }
});

app.patch('/api/inspection', async (req, res) => {
    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ message: "Date and time are required." });
    try {
        await dbRun(`UPDATE app_state SET value = ? WHERE key = 'inspection'`, [JSON.stringify({ date, time })]);
        res.status(200).json({ date, time });
    } catch (error) {
        res.status(500).json({ message: "Error updating database.", error: error.message });
    }
});

app.post('/api/equipment', async (req, res) => {
    const { id, location, category } = req.body;
    if (!id || !location || !category) return res.status(400).json({ message: "Fields 'id', 'location', and 'category' are required." });

    try {
        await dbRun('BEGIN TRANSACTION');
        const idExists = await dbGet(`SELECT id FROM equipment WHERE id = ?`, [id]);
        if (idExists) throw { status: 409, message: `Equipment ID '${id}' already exists.` };
        
        const cat = await dbGet(`SELECT id FROM equipment_categories WHERE name = ?`, [category]);
        if (!cat) throw { status: 404, message: `Category '${category}' not found.` };
        
        const newEquipment = { id, location, lastInspected: new Date().toISOString().split('T')[0], status: 'ok' };
        await dbRun(`INSERT INTO equipment (id, location, lastInspected, status, category_id) VALUES (?, ?, ?, ?, ?)`, 
                    [newEquipment.id, newEquipment.location, newEquipment.lastInspected, newEquipment.status, cat.id]);
        await dbRun('COMMIT');
        res.status(201).json({ item: newEquipment, category });
    } catch (error) {
        await dbRun('ROLLBACK');
        res.status(error.status || 500).json({ message: error.message || "Error writing to database." });
    }
});

app.delete('/api/equipment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbRun(`DELETE FROM equipment WHERE id = ?`, [id]);
        if (result.changes === 0) return res.status(404).json({ message: `Equipment with ID ${id} not found.` });
        res.status(200).json({ message: "Equipment deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error writing to database.", error: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required." });
    try {
        const existing = await dbGet(`SELECT id FROM equipment_categories WHERE LOWER(name) = LOWER(?)`, [name]);
        if (existing) return res.status(409).json({ message: `Category '${name}' already exists.` });
        
        const newCategory = { name, icon: 'new_label', items: [] };
        await dbRun(`INSERT INTO equipment_categories (name, icon) VALUES (?, ?)`, [newCategory.name, newCategory.icon]);
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: "Error writing to database.", error: error.message });
    }
});

app.post('/api/inspections', async (req, res) => {
    const { equipmentId, status, checklistItems, evidencePhoto, observations, generalObservations, technicianId } = req.body;
    if (!equipmentId || !status || !checklistItems) return res.status(400).json({ message: "Incomplete inspection data." });

    try {
        await dbRun('BEGIN TRANSACTION');
        const equipment = await dbGet(`SELECT id FROM equipment WHERE id = ?`, [equipmentId]);
        if (!equipment) throw { status: 404, message: `Equipment with ID ${equipmentId} not found.` };
        
        const newStatus = status === 'OK' ? 'ok' : (status === 'Falha' ? 'fail' : 'maintenance');
        const lastInspected = new Date().toISOString().split('T')[0];
        await dbRun(`UPDATE equipment SET status = ?, lastInspected = ? WHERE id = ?`, [newStatus, lastInspected, equipmentId]);

        const updatedEquipment = await dbGet(`SELECT * FROM equipment WHERE id = ?`, [equipmentId]);

        const newInspectionRecord = {
            id: `insp_${new Date().getTime()}`,
            inspectionDate: new Date().toISOString(),
            equipmentId, status, checklistItems, evidencePhoto, observations, generalObservations, technicianId
        };
        await dbRun(`INSERT INTO inspection_history (id, inspectionDate, equipmentId, status, checklistItems, evidencePhoto, observations, generalObservations, technicianId)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                     [newInspectionRecord.id, newInspectionRecord.inspectionDate, newInspectionRecord.equipmentId, newInspectionRecord.status, JSON.stringify(newInspectionRecord.checklistItems), newInspectionRecord.evidencePhoto, newInspectionRecord.observations, newInspectionRecord.generalObservations, newInspectionRecord.technicianId]);
        
        await dbRun('COMMIT');
        res.status(201).json({
            message: "Inspection saved successfully.",
            savedInspection: newInspectionRecord,
            updatedEquipment: { ...updatedEquipment, status: newStatus, lastInspected }
        });
    } catch (error) {
        await dbRun('ROLLBACK');
        res.status(error.status || 500).json({ message: error.message || "Error writing to database." });
    }
});


// --- Static Files & SPA Fallback ---
// Serve static files from the root directory.
app.use(express.static(path.join(__dirname)));

// The SPA fallback handler. This MUST be the last route.
// It sends index.html for any GET request that hasn't been handled by the API or static file middleware.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// --- Server Startup ---
db = new sqlite3.Database(DB_PATH, async (err) => {
    if (err) {
        console.error('--- CRITICAL DATABASE ERROR ---');
        console.error('Could not connect to SQLite database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
    await initializeDatabase(); // Initialize and seed if needed

    app.listen(PORT, () => {
        console.log(`---`);
        console.log(`Server listening on port ${PORT}. Health checks available at /healthz.`);
        if (PORT === 8080) {
            console.log(`Access the app locally at http://localhost:${PORT}`);
        }
        console.log('Database is ready.');
        console.log(`---`);
    }).on('error', (err) => {
        console.error('--- CRITICAL SERVER STARTUP ERROR ---');
        console.error('Failed to start HTTP server:', err);
        process.exit(1);
    });
});