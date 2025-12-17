import 'dotenv/config'; // Load .env immediately

console.log('--- Environment Debug Script ---');
console.log('Current Working Directory:', process.cwd());

const key = process.env.CLERK_SECRET_KEY;

if (key) {
    console.log('✅ CLERK_SECRET_KEY is found.');
    console.log('Key length:', key.length);
    console.log('Key preview:', key.substring(0, 10) + '...');
} else {
    console.error('❌ CLERK_SECRET_KEY is MISSING in process.env!');
    console.log('Please check your .env file in the server directory.');
}

console.log('--------------------------------');
