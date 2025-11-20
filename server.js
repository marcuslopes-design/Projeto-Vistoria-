
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const { Firestore, FieldValue } = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 8080;

// --- Database State ---
let db;
let isDbReady = false;

// --- Asynchronous Firestore Initialization ---
const initializeFirestore = async () => {
    try {
        db = new Firestore();
        // Perform a simple read to confirm connection
        await db.collection('app').doc('data').get(); 
        isDbReady = true;
        console.log('Firestore client initialized and connected successfully.');
    } catch (error) {
        console.error('--- CRITICAL DATABASE ERROR ---');
        console.error('Failed to initialize or connect to Firestore. The API will be unavailable.');
        console.error('This can happen if the service account lacks IAM permissions (e.g., "Cloud Datastore User").');
        console.error('Ensure the Firestore database exists and the service has permission to access it.');
        console.error('Error details:', error.message);
        console.error('---');
        // The server will continue running, but API routes will fail gracefully.
    }
};

// Middleware to check for database readiness on API routes
const checkDbConnection = (req, res, next) => {
    if (isDbReady) {
        return next();
    }
    res.status(503).json({
        message: "Service Unavailable: The database is not connected. Please check server logs for details.",
    });
};

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Simple request logger middleware
app.use((req, res, next) => {
    const extension = path.extname(req.path);
    if (req.path === '/healthz' || (extension && extension !== '.html')) {
        return next();
    }
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// --- Health Check Endpoint ---
// This endpoint does not depend on the database and allows Cloud Run to verify the container is running.
app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

// GET image proxy - does not need DB connection
app.get('/api/image-proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Image URL is required');
    }
    try {
        const decodedUrl = decodeURIComponent(url);
        const response = await axios({
            method: 'get',
            url: decodedUrl,
            responseType: 'stream',
            timeout: 5000
        });
        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        console.error('Error proxying image:', error.message);
        res.status(500).send('Failed to fetch image');
    }
});


// Apply the DB connection check middleware to all subsequent API routes
app.use('/api', checkDbConnection);

const appDataRef = () => db.collection('app').doc('data');

// Helper function to get data from Firestore
const getAppData = async () => {
    const doc = await appDataRef().get();
    if (!doc.exists) {
        console.error("Firestore document 'app/data' does not exist.");
        throw new Error("Application data not found in the database. Please seed the database.");
    }
    return doc.data();
};


// --- API ROUTES ---

// GET all application data
app.get('/api/app-data', async (req, res) => {
    try {
        const data = await getAppData();
        res.status(200).json(data);
    } catch (error) {
        console.error("[/api/app-data] Error:", error);
        res.status(500).json({ message: "Error reading from Firestore", error: error.message });
    }
});

// GET a single equipment by ID
app.get('/api/equipment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const dbData = await getAppData();
        let foundEquipment = null;
        for (const category of dbData.equipmentData) {
            const item = category.items.find(i => i.id === id);
            if (item) {
                foundEquipment = {
                    categoryName: category.name,
                    categoryIcon: category.icon,
                    item: item
                };
                break;
            }
        }

        if (foundEquipment) {
            res.status(200).json(foundEquipment);
        } else {
            res.status(404).json({ message: `Equipment with ID ${id} not found` });
        }
    } catch (error) {
        console.error(`[/api/equipment/:id] Error for ID ${id}:`, error);
        res.status(500).json({ message: "Error reading from Firestore", error: error.message });
    }
});

// PATCH client information
app.patch('/api/client', async (req, res) => {
    const { floorPlanUrl, coverImageUrl } = req.body;
    if (floorPlanUrl === undefined && coverImageUrl === undefined) {
        return res.status(400).json({ message: "No update data provided." });
    }

    try {
        const updatePayload = {};
        if (floorPlanUrl !== undefined) updatePayload['client.floorPlanUrl'] = floorPlanUrl;
        if (coverImageUrl !== undefined) updatePayload['client.coverImageUrl'] = coverImageUrl;
        
        await appDataRef().update(updatePayload);
        
        const updatedDoc = await appDataRef().get();
        res.status(200).json(updatedDoc.data().client);

    } catch (error) {
        console.error("[/api/client] Error:", error);
        res.status(500).json({ message: "Error updating client data in Firestore.", error: error.message });
    }
});

// PATCH inspection schedule
app.patch('/api/inspection', async (req, res) => {
    const { date, time } = req.body;
    if (!date || !time) {
        return res.status(400).json({ message: "Fields 'date' and 'time' are required." });
    }

    try {
        await appDataRef().update({ inspection: { date, time } });
        res.status(200).json({ date, time });
    } catch (error) {
        console.error("[/api/inspection] Error:", error);
        res.status(500).json({ message: "Error updating inspection data in Firestore.", error: error.message });
    }
});

// POST a new equipment
app.post('/api/equipment', async (req, res) => {
    const { id, location, category } = req.body;
    if (!id || !location || !category || typeof id !== 'string' || typeof location !== 'string' || typeof category !== 'string' || id.trim() === '' || location.trim() === '' || category.trim() === '') {
        return res.status(400).json({ message: "Fields 'id', 'location', and 'category' are required." });
    }

    try {
        let responseData = {};
        await db.runTransaction(async (transaction) => {
            const appDoc = await transaction.get(appDataRef());
            if (!appDoc.exists) throw "Document does not exist!";
            
            const data = appDoc.data();
            const idExists = data.equipmentData.some(cat => cat.items.some(item => item.id === id));
            if (idExists) {
                throw { status: 409, message: `Equipment ID '${id}' already exists.` };
            }

            const categoryIndex = data.equipmentData.findIndex(c => c.name === category);
            if (categoryIndex === -1) {
                throw { status: 404, message: `Category '${category}' not found.` };
            }
            
            const newEquipment = {
                id,
                location,
                lastInspected: new Date().toISOString().split('T')[0],
                status: 'ok',
            };
            
            data.equipmentData[categoryIndex].items.push(newEquipment);
            
            transaction.update(appDataRef(), { equipmentData: data.equipmentData });
            responseData = { item: newEquipment, category };
        });
        
        res.status(201).json(responseData);

    } catch (error) {
        console.error("[/api/equipment] POST Error:", error);
        if (error.status) {
            res.status(error.status).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Transaction failed or error writing to Firestore", error: error.message });
        }
    }
});

// DELETE an equipment by ID
app.delete('/api/equipment/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Equipment ID is required." });

    try {
        await db.runTransaction(async (transaction) => {
            const appDoc = await transaction.get(appDataRef());
            if (!appDoc.exists) throw "Document does not exist!";
            
            const data = appDoc.data();
            let found = false;
            
            const newEquipmentData = data.equipmentData.map(category => {
                const initialLength = category.items.length;
                const filteredItems = category.items.filter(item => item.id !== id);
                if (filteredItems.length < initialLength) {
                    found = true;
                }
                return { ...category, items: filteredItems };
            });

            if (!found) {
                throw { status: 404, message: `Equipment with ID ${id} not found.` };
            }
            
            transaction.update(appDataRef(), { equipmentData: newEquipmentData });
        });
        
        res.status(200).json({ message: "Equipment deleted successfully." });

    } catch (error) {
        console.error(`[/api/equipment/:id] DELETE Error for ID ${id}:`, error);
        if (error.status) {
            res.status(error.status).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Transaction failed or error writing to Firestore", error: error.message });
        }
    }
});

// POST a new category
app.post('/api/categories', async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Category name is required." });
    }

    try {
        const newCategory = {
            name,
            icon: 'new_label',
            items: [],
        };

        await db.runTransaction(async (transaction) => {
            const appDoc = await transaction.get(appDataRef());
            if (!appDoc.exists) throw "Document does not exist!";
            
            const data = appDoc.data();
            const existing = data.equipmentData.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                throw { status: 409, message: `Category '${name}' already exists.` };
            }
            
            transaction.update(appDataRef(), { equipmentData: FieldValue.arrayUnion(newCategory) });
        });

        res.status(201).json(newCategory);

    } catch (error) {
        console.error("[/api/categories] POST Error:", error);
         if (error.status) {
            res.status(error.status).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Transaction failed or error writing to Firestore", error: error.message });
        }
    }
});

// POST a new inspection
app.post('/api/inspections', async (req, res) => {
    const inspectionData = req.body;
    if (!inspectionData.equipmentId || !inspectionData.status || !inspectionData.checklistItems) {
        return res.status(400).json({ message: "Dados de vistoria incompletos." });
    }
    
    try {
        let responsePayload = {};
        await db.runTransaction(async (transaction) => {
            const appDoc = await transaction.get(appDataRef());
            if (!appDoc.exists) throw "Document does not exist!";
            
            const data = appDoc.data();
            let equipmentToUpdate = null;
            let found = false;

            const newEquipmentData = data.equipmentData.map(category => {
                const itemIndex = category.items.findIndex(i => i.id === inspectionData.equipmentId);
                if (itemIndex > -1) {
                    const item = category.items[itemIndex];
                    item.lastInspected = new Date().toISOString().split('T')[0];
                    item.status = inspectionData.status === 'OK' ? 'ok' : (inspectionData.status === 'Falha' ? 'fail' : 'maintenance');
                    equipmentToUpdate = item;
                    found = true;
                }
                return category;
            });
            
            if (!found) {
                throw { status: 404, message: `Equipamento com ID ${inspectionData.equipmentId} não encontrado.` };
            }

            const newInspectionRecord = {
                ...inspectionData,
                id: `insp_${new Date().getTime()}`,
                inspectionDate: new Date().toISOString(),
            };

            transaction.update(appDataRef(), { 
                equipmentData: newEquipmentData,
                inspectionHistory: FieldValue.arrayUnion(newInspectionRecord)
            });

            responsePayload = { 
                message: "Vistoria salva com sucesso.",
                savedInspection: newInspectionRecord,
                updatedEquipment: equipmentToUpdate
            };
        });
        
        res.status(201).json(responsePayload);

    } catch (error) {
         console.error("[/api/inspections] POST Error:", error);
         if (error.status) {
            res.status(error.status).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Transaction failed or error writing to Firestore.", error: error.message });
        }
    }
});


// --- SPA Fallback ---
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API route not found.' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`---`);
    console.log(`Server listening on port ${PORT}. Health checks available at /healthz.`);
    if (PORT === 8080) {
        console.log(`Access the app locally at http://localhost:${PORT}`);
    } else {
        console.log(`App is running on the cloud platform's provided URL.`);
    }
    console.log(`Attempting to connect to Firestore...`);
    console.log(`---`);
    
    // Initialize Firestore asynchronously after the server has started.
    initializeFirestore();

}).on('error', (err) => {
    console.error('--- CRITICAL SERVER STARTUP ERROR ---');
    console.error('Failed to start HTTP server:', err);
    console.error('---');
    process.exit(1);
});
