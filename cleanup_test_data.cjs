const axios = require('axios');

const BASE_URL = 'http://localhost:5027/api';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

async function cleanup() {
    try {
        console.log("1. Logging in as System Admin...");
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
        const token = loginRes.data.token;
        const axiosAuth = axios.create({ headers: { Authorization: `Bearer ${token}` } });

        console.log("2. Fetching Users...");
        const usersRes = await axiosAuth.get(`${BASE_URL}/users`);
        const users = usersRes.data;

        const testUsers = users.filter(u =>
            u.username.startsWith('TestOp_') ||
            u.username.startsWith('Admin_') ||
            (u.username === 'TestBranch') // Just in case I used branch as username somewhere
        );

        console.log(`Found ${testUsers.length} test users.`);

        for (const user of testUsers) {
            console.log(`Deleting user: ${user.username} (${user.id})`);
            try {
                await axiosAuth.delete(`${BASE_URL}/users/${user.id}`);
            } catch (e) {
                console.error(`Failed to delete user ${user.username}:`, e.message);
            }
        }

        console.log("3. Fetching Employees...");
        // Employees endpoint usually returns active employees.
        // My test employee "Test Employee" should be active.
        const empRes = await axiosAuth.get(`${BASE_URL}/employees`);
        const employees = empRes.data;

        const testEmployees = employees.filter(e => e.name === 'Test Employee');

        console.log(`Found ${testEmployees.length} test employees.`);

        for (const emp of testEmployees) {
            console.log(`Deleting employee: ${emp.name} (${emp.id})`);
            try {
                await axiosAuth.delete(`${BASE_URL}/employees/${emp.id}`);
            } catch (e) {
                console.error(`Failed to delete employee ${emp.name}:`, e.message);
            }
        }

        console.log("Cleanup complete.");

    } catch (err) {
        console.error("Cleanup failed:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
    }
}

cleanup();
