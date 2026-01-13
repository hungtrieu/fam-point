import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not defined in environment variables');
        throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        // Mask password for safe logging
        const maskedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
        console.log(`🔌 Attempting to connect to MongoDB: ${maskedUri}`);

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            console.log('✅ MongoDB connected successfully');
            return mongoose;
        }).catch((err) => {
            console.error('❌ MongoDB connection error details:', {
                message: err.message,
                code: err.code,
                name: err.name
                // Tránh log cả object err nếu nó chứa URI nhạy cảm
            });
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e: any) {
        cached.promise = null;
        console.error('❌ Failed to establish MongoDB connection:', e.message);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
