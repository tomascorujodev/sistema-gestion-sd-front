import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState(null);
    const [activeShift, setActiveShift] = useState(null);
    const [shiftAutoClosed, setShiftAutoClosed] = useState(false);
    const [checkingShift, setCheckingShift] = useState(false);

    useEffect(() => {
        // Setup Axios Interceptor for 401s
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    setUser(null);
                    setEmployee(null);
                    setActiveShift(null);
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('employee');
                    sessionStorage.removeItem('activeShift');
                    delete axios.defaults.headers.common['Authorization'];
                    // Only redirect if not already there to avoid loops if login page itself 401s (unlikely)
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }
        );

        const token = sessionStorage.getItem('token');
        const savedUser = sessionStorage.getItem('user');
        const savedEmployee = sessionStorage.getItem('employee');
        const savedShift = sessionStorage.getItem('activeShift');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            if (savedEmployee) {
                setEmployee(JSON.parse(savedEmployee));
            }
            if (savedShift) {
                setActiveShift(JSON.parse(savedShift));
            }
        }
        setLoading(false);
    }, []);

    // Check for active shift on login/refresh
    useEffect(() => {
        const checkActiveShift = async () => {
            if (user && user.role === 'Operator' && !activeShift) {
                setCheckingShift(true);
                try {
                    // First, trigger a cleanup of stale shifts
                    await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5027/api'}/shifts/check-auto-close`);

                    // Then get active shifts for this branch
                    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5027/api'}/shifts/current-branch`);
                    if (response.status === 200 && response.data && response.data.length > 0) {
                        const savedEmployee = sessionStorage.getItem('employee');
                        let shift = null;

                        if (savedEmployee) {
                            const empId = JSON.parse(savedEmployee).id;
                            shift = response.data.find(s => s.employeeId === empId);
                        }

                        // Fallback to the active shift even if no saved employee (station sync)
                        if (!shift) shift = response.data[0];

                        const employeeData = {
                            id: shift.employeeId,
                            name: shift.employee?.name || 'Unknown'
                        };

                        setEmployee(employeeData);
                        setActiveShift(shift);
                        sessionStorage.setItem('employee', JSON.stringify(employeeData));
                        sessionStorage.setItem('activeShift', JSON.stringify(shift));
                        console.log("Restored active session for:", employeeData.name);
                    }
                } catch (err) {
                    console.error("Error checking active shift status:", err);
                } finally {
                    setCheckingShift(false);
                }
            }
        };

        checkActiveShift();
    }, [user, activeShift]);

    // Auto-close shift monitoring (run more often and even if not logged in to clean up)
    useEffect(() => {
        const checkAutoClose = async () => {
            if (!user) return; // Need auth to call this
            try {
                const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5027/api'}/shifts/check-auto-close`);
                const closedShifts = response.data.closedShifts || [];

                if (employee && activeShift) {
                    const myShiftClosed = closedShifts.find(s => s.employeeId === employee.id);
                    if (myShiftClosed) {
                        setShiftAutoClosed(true);
                        setActiveShift(null);
                        sessionStorage.removeItem('activeShift');
                    }
                }
            } catch (error) {
                console.error('Error checking auto-close:', error);
            }
        };

        // Check every 5 minutes
        const interval = setInterval(checkAutoClose, 300000);
        checkAutoClose();

        return () => clearInterval(interval);
    }, [user, employee, activeShift]);

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5027/api'}/auth/login`, { username, password });
            const { token, role, username: userUsername, branch } = response.data;

            const userData = { username: userUsername, role, branch };
            setUser(userData);
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const selectEmployee = async (employeeId, employeeName) => {
        try {
            // Try to start shift
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5027/api'}/shifts/start`, parseInt(employeeId), {
                headers: { 'Content-Type': 'application/json' }
            });

            const employeeData = { id: employeeId, name: employeeName };
            setEmployee(employeeData);
            setActiveShift(response.data);
            sessionStorage.setItem('employee', JSON.stringify(employeeData));
            sessionStorage.setItem('activeShift', JSON.stringify(response.data));
            return true;
        } catch (error) {
            // If shift already active (400), fetch it
            if (error.response && error.response.status === 400) {
                try {
                    const activeResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5027/api'}/shifts/active/${employeeId}`);
                    const employeeData = { id: employeeId, name: employeeName };
                    setEmployee(employeeData);
                    setActiveShift(activeResponse.data);
                    sessionStorage.setItem('employee', JSON.stringify(employeeData));
                    sessionStorage.setItem('activeShift', JSON.stringify(activeResponse.data));
                    return true;
                } catch (fetchError) {
                    console.error("Failed to fetch active shift", fetchError);
                    return false;
                }
            }
            console.error("Failed to start shift", error);
            return false;
        }
    };

    const endShift = async () => {
        if (!employee) return false;

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5027/api'}/shifts/end`, parseInt(employee.id), {
                headers: { 'Content-Type': 'application/json' }
            });

            setEmployee(null);
            setActiveShift(null);
            sessionStorage.removeItem('employee');
            sessionStorage.removeItem('activeShift');
            return response.data;
        } catch (error) {
            // If shift not found (404), clear local state anyway to avoid getting stuck
            if (error.response && error.response.status === 404) {
                console.warn("Shift not found on server, clearing local state.");
                setEmployee(null);
                setActiveShift(null);
                sessionStorage.removeItem('employee');
                sessionStorage.removeItem('activeShift');
                return null; // Return null to indicate no report generated
            }

            if (error.response && error.response.status === 400 && error.response.data) {
                throw new Error(error.response.data);
            }

            console.error("Failed to end shift", error.response ? error.response.data : error);
            return false;
        }
    };

    const logout = async () => {
        setUser(null);
        setEmployee(null);
        setActiveShift(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('employee');
        sessionStorage.removeItem('activeShift');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{
            user,
            employee,
            activeShift,
            login,
            logout,
            selectEmployee,
            endShift,
            loading,
            checkingShift,
            shiftAutoClosed,
            setShiftAutoClosed
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
