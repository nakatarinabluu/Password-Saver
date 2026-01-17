try {
    const otplib = require('otplib');
    console.log('Type:', typeof otplib);
    console.log('Value:', otplib);
    console.log('Keys:', Object.keys(otplib));
} catch (e) {
    console.error('Error:', e);
}
