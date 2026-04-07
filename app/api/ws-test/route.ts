// app/api/ws-test/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const wsHost = process.env.NEXT_PUBLIC_WS_HOST;
    
    return NextResponse.json({
        wsUrl,
        wsHost,
        environment: process.env.NODE_ENV,
        railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
        port: process.env.PORT,
        timestamp: Date.now(),
        websocketEndpoint: wsUrl || `${process.env.NODE_ENV === 'production' ? 'wss' : 'ws'}://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:3000'}/ws`
    });
}