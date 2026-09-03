import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3001;
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecrettrustchainjwt';
export const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
export const AUDIT_LOG_ADDRESS = process.env.AUDIT_LOG_ADDRESS || '';
