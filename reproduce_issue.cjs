const axios = require('axios');

const BASE_URL = 'http://localhost:5027/api';

async function runTest() {
    try {
        console.log("1. Registering Test Operator...");
        const username = `TestOp_${Date.now()}`;
        const password = 'password123';
        const branch = 'TestBranch';

        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                username,
                password,
                role: 'Operator',
                branch
            });
        } catch (e) {
            console.log("Register failed (maybe exists):", e.message);
        }

        console.log("2. Logging in...");
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, { username, password });
        const token = loginRes.data.token;
        const employeeId = 9999; // Fake ID, might fail if FK constraint exists. 
        // Need a real employee ID. I'll create one if possible or use an existing one. 
        // Actually, let's fetch employees first.

        const axiosAuth = axios.create({ headers: { Authorization: `Bearer ${token}` } });

        // We need an employee to start a shift. 
        // Assuming there's at least one employee or I need to make one.
        // Let's assume the user has employees. I'll listing them.

        console.log("2.5 Finding an employee...");
        // I don't see an endpoint to get employees for operator easily, 
        // but ShiftsController `StartShift` takes `employeeId`.
        // I'll try to find one via `api/employees` if accessible to Operator? No, usually Admin.
        // I'll try to hit `api/shifts/dashboard` to see if I can find an ID or just guess one?
        // Actually, let's check `api/employees` with the Admin token if I had one. 
        // Since I don't have admin creds handy in script, I'll gamble on ID 1 or create a user that is admin first.

        // Better: I'll use the existing "Sucursal Principal" user if possible, or just fail if I can't find employee.
        // Wait, I can register an ADMIN to get employees.

        const adminName = `Admin_${Date.now()}`;
        await axios.post(`${BASE_URL}/auth/register`, {
            username: adminName,
            password,
            role: 'Admin',
            branch: 'AdminBranch'
        });
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, { username: adminName, password });
        const adminToken = adminLogin.data.token;
        const adminAuth = axios.create({ headers: { Authorization: `Bearer ${adminToken}` } });

        let empId;
        try {
            // Need to create an employee
            await adminAuth.post(`${BASE_URL}/employees`, {
                name: 'Test Employee',
                position: 'Tester',
                hourlyRate: 100,
                branches: branch
            });
            const emps = await adminAuth.get(`${BASE_URL}/employees`);
            empId = emps.data[0].id;
            console.log("Found Employee ID:", empId);
        } catch (e) {
            console.log("Failed to manage employees:", e.message);
            return;
        }

        console.log("3. Starting Shift...");
        try {
            await axiosAuth.post(`${BASE_URL}/shifts/start`, empId, { headers: { 'Content-Type': 'application/json' } });
            console.log("Shift Started!");
        } catch (e) {
            console.log("Start Shift Error:", e.response?.data || e.message);
        }

        console.log("4. Simulating 'Lost Session' (Clearing Token locally)...");
        // In script, we just ignore the old token and login again.

        console.log("5. Logging in AGAIN...");
        const loginRes2 = await axios.post(`${BASE_URL}/auth/login`, { username, password });
        const token2 = loginRes2.data.token;
        const axiosAuth2 = axios.create({ headers: { Authorization: `Bearer ${token2}` } });

        console.log("6. Checking current-status endpoint...");
        try {
            const statusRes = await axiosAuth2.get(`${BASE_URL}/shifts/current-status`);
            if (statusRes.status === 200) {
                console.log("SUCCESS: Found Active Shift:", statusRes.data);
            } else if (statusRes.status === 204) {
                console.log("FAILURE: Returned 204 No Content (No shift found).");
            }
        } catch (e) {
            console.log("FAILURE: API Error:", e.response?.status, e.response?.data);
        }

    } catch (err) {
        console.error("Test Failed:", err.message);
    }
}

runTest();
