/**
 * API Route para gestionar logs (info, lectura, limpieza)
 * Solo accesible para administradores.
 * - Si source=frontend, lee/escribe archivos locales.
 * - Si source=backend, actúa como proxy a la API del backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

// Rutas de logs
const FRONTEND_LOGS_PATH = '/home/ec2-user/mercador/logs';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

type LogType = 'error' | 'output' | 'combined';
type LogSource = 'frontend' | 'backend';

/**
 * Verifica si el usuario es admin
 */
async function verifyAdmin(): Promise<{ isAdmin: boolean; token?: string }> {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return { isAdmin: false };
        }

        const response = await fetch(`${API_BASE}/users/me`, {
            headers: {
                'Cookie': `sb_access_token=${token}`,
            },
        });

        if (!response.ok) {
            return { isAdmin: false };
        }

        const data = await response.json();
        return { isAdmin: data.data?.role === 'admin', token };
    } catch (error) {
        console.error('Error verificando admin:', error);
        return { isAdmin: false };
    }
}

/**
 * Encuentra el archivo de log más reciente para un tipo dado.
 */
async function findLogFile(logType: LogType, basePath: string): Promise<string> {
    const files = await fs.readdir(basePath);
    const logFiles = files
        .filter((f) => f.startsWith(`${logType}-`) && f.endsWith('.log'))
        .map((f) => ({
            name: f,
            time: parseInt(f.split('-')[1]?.split('.')[0] || '0'),
        }))
        .sort((a, b) => b.time - a.time);

    if (logFiles.length === 0) {
        throw new Error(`No se encontraron archivos de log para el tipo: ${logType}`);
    }
    return path.join(basePath, logFiles[0].name);
}

/**
 * Obtiene información de un archivo de log.
 */
async function getLogFileInfo(logType: LogType, basePath: string) {
    const filePath = await findLogFile(logType, basePath);
    const stats = await fs.stat(filePath);
    return {
        filePath,
        size: stats.size,
        lastModified: stats.mtime,
    };
}

/**
 * Lee las últimas N líneas de un archivo de log.
 */
async function readLogFile(logType: LogType, basePath: string, lines: number): Promise<string[]> {
    const filePath = await findLogFile(logType, basePath);
    const data = await fs.readFile(filePath, 'utf-8');
    const logLines = data.split('\n').filter(Boolean);
    return logLines.slice(-lines);
}

// --- MANEJADORES DE MÉTODOS HTTP ---

export async function GET(request: NextRequest, { params }: { params: { slug: string[] } }) {
    const { isAdmin, token } = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = (searchParams.get('source') || 'frontend') as LogSource;
    const slug = params.slug.join('/');

    // --- Proxy para el Backend ---
    if (source === 'backend') {
        const backendUrl = `${API_BASE}/logs/${slug}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        
        const backendResponse = await fetch(backendUrl, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    }

    // --- Lógica para el Frontend (archivos locales) ---
    try {
        if (slug === 'info') {
            const logTypes: LogType[] = ['error', 'output', 'combined'];
            const filesInfo = await Promise.all(
                logTypes.map(async (logType) => {
                    try {
                        const info = await getLogFileInfo(logType, FRONTEND_LOGS_PATH);
                        return { type: logType, path: info.filePath, size: info.size, lastModified: info.lastModified.toISOString(), exists: true };
                    } catch {
                        return { type: logType, path: 'N/A', size: 0, lastModified: new Date(0).toISOString(), exists: false };
                    }
                })
            );
            return NextResponse.json({ success: true, data: { files: filesInfo } });
        }

        const type = slug as LogType;
        const lines = parseInt(searchParams.get('lines') || '100');
        const logLines = await readLogFile(type, FRONTEND_LOGS_PATH, lines);
        const fileInfo = await getLogFileInfo(type, FRONTEND_LOGS_PATH);

        return NextResponse.json({
            success: true,
            data: {
                logType: type,
                lines: logLines,
                fileInfo: { size: fileInfo.size, lastModified: fileInfo.lastModified.toISOString() },
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.message.includes('no encontrado') ? 404 : 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string[] } }) {
    const { isAdmin, token } = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = (searchParams.get('source') || 'frontend') as LogSource;
    const type = params.slug.join('/') as LogType;

    // --- Proxy para el Backend ---
    if (source === 'backend') {
        const backendUrl = `${API_BASE}/logs/${type}`;
        const backendResponse = await fetch(backendUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    }

    // --- Lógica para el Frontend (archivos locales) ---
    try {
        const filePath = await findLogFile(type, FRONTEND_LOGS_PATH);
        await fs.writeFile(filePath, '', 'utf-8');
        return NextResponse.json({ success: true, message: `Log ${type} limpiado` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
}
