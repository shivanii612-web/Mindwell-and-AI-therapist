import fetch from 'node-fetch';

const testApi = async () => {
    try {
        const response = await fetch('http://192.168.137.1:5000/health');
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', data);
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
};

testApi();
