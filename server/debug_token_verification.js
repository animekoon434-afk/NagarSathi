import 'dotenv/config'; // Load .env immediately
import { verifyToken } from '@clerk/backend';

console.log('--- Token Verification Debug Script ---');

// Token from user's logs
const token = 'eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zNnZlWGpGajl1cTBQQm9DYjU3TEdraWdlNFYiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjUxNzMiLCJleHAiOjE3NjU5OTc5NTgsImZ2YSI6WzEyLC0xXSwiaWF0IjoxNzY1OTk3ODk4LCJpc3MiOiJodHRwczovL3RvdWNoZWQtc3BhbmllbC0xOC5jbGVyay5hY2NvdW50cy5kZXYiLCJuYmYiOjE3NjU5OTc4ODgsInNpZCI6InNlc3NfMzZ6NmJ6cWdqRjd0ZjVLSkR5bXN3N3BUckRKIiwic3RzIjoiYWN0aXZlIiwic3ViIjoidXNlcl8zNno2YnlkTk1yRm5iZUZtQUtaaDRocHRyc1QiLCJ2IjoyfQ.bSjsFGKA7-IlIdcNAX_6yfhu1V5g9sBjtlRVnMIGklm0fENZPBaoVdQPqQN7yPlXfis8FQD7NeOsX8Osg59ZPIrFYdxGvz-sQs9rhg8da0F5or75oDG1cxV2-qAXeqXgoyS1LkvtTzndZimXc2JVSXSLg1zS2XzkMpncdS41fb47STdxnEg0SmzelAy_LAceqXAMKsi6p-qzKzHWLm8nujhhdOt2Dwrf1r7qFE7AnHz93yOOcKdsNOFR_QiKQ93wX2Ga6biaLD1iMxDktX9zqgSbwcpP2ka_cDoFiWvEkZL-sJ5E_MmfLX-2Belx6o_Ucafr8KpbreCgaivC-cUQww';

async function testToken() {
    try {
        console.log('Verifying token...');
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });
        console.log('✅ Token Verified Successfully!');
        console.log('Payload:', payload);
    } catch (err) {
        console.error('❌ Token Verification Failed');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Reason:', err.reason);

        if (err.message.includes('expired')) {
            console.log('\n💡 DIAGNOSIS: The token matches the key but is expired. Check client clock or token refresh logic.');
        } else if (err.message.includes('signature')) {
            console.log('\n💡 DIAGNOSIS: The token signature is invalid. This usually means the Server Secret Key does not match the Client Publishable Key instance.');
        }
    }
}

testToken();
