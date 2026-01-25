const axios = require('axios');

const BASE_URL = 'http://localhost:5027/api';
// Assuming admin password was reset to admin123 by previous steps
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

async function cleanupShifts() {
    try {
        console.log("1. Logging in as System Admin...");
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
        const token = loginRes.data.token;
        const axiosAuth = axios.create({ headers: { Authorization: `Bearer ${token}` } });

        console.log("2. Deleting TestBranch shifts...");
        const res = await axiosAuth.delete(`${BASE_URL}/shifts/branch/TestBranch`);
        console.log("Delete status:", res.status);
        console.log("Shifts deleted (NoContent expected).");

    } catch (err) {
        console.error("Cleanup Shifts failed:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
    }
}

cleanupShifts();
