/**
 * API Route para obtener información de logs
 * Solo accesible para administradores
 * Lee archivos localmente del sistema de archivos
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
 * Verifica si el usuario es admin (usando el contexto de autenticación)
 */
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return { isAdmin: false };
        }
        
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: {
                'Cookie': `auth_token=${token}`,
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { isAdmin: false };
        }

        const data = await response.json();
        
        return {
            isAdmin: data.data?.role === 'admin',
            userId: data.data?.id
        };
    } catch (error) {
        console.error('Error verificando admin:', error);
        return { isAdmin: false };
    }
}

/**
 * Busca el archivo de log más reciente para el tipo especificado
 */
async function findLogFile(logType: LogType, basePath: string): Promise<string> {
    try {
        const files = await fs.readdir(basePath);

        // Filtrar archivos que coincidan con el tipo de log
        const matchingFiles = files.filter(file =>
            file.includes(logType) && file.endsWith('.log') && !file.includes('__')
        );

        if (matchingFiles.length === 0) {
            throw new Error(`Archivos de log para '${logType}' no encontrados.`);
        }

        // Encontrar el archivo más reciente
        let latestFile = '';
        let latestMtimeMs = 0;

        for (const file of matchingFiles) {
            const filePath = path.join(basePath, file);
            const stats = await fs.stat(filePath);

            if (stats.mtimeMs > latestMtimeMs) {
                latestMtimeMs = stats.mtimeMs;
                latestFile = filePath;
            }
        }

        if (!latestFile) {
            throw new Error(`No se pudo determinar el archivo más reciente para '${logType}'.`);
        }

        return latestFile;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            throw new Error(`Directorio de logs no encontrado: ${basePath}`);
        }
        throw error;
    }
}

/**
 * Obtiene información de un archivo de log
 */
async function getLogFileInfo(logType: LogType, basePath: string): Promise<{ size: number; lastModified: Date; filePath: string; exists: boolean }> {
    try {
        const filePath = await findLogFile(logType, basePath);
        const stats = await fs.stat(filePath);

        return {
            size: stats.size,
            lastModified: stats.mtime,
            filePath: filePath,
            exists: true,
        };
    } catch (error: any) {
        return {
            size: 0,
            lastModified: new Date(0),
            filePath: path.join(basePath, `${logType}-...log`),
            exists: false,
        };
    }
}

/**
 * GET /api/logs/info - Obtener información sobre los logs disponibles
 */
export async function GET(request: NextRequest) {
    try {
        // Verificar permisos de admin
        const isAdmin = await verifyAdmin(request);
        if (!isAdmin) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Acceso denegado - requiere rol de administrador",
                },
                { status: 403 }
            );
        }

        // Obtener el source de los query params
        const { searchParams } = new URL(request.url);
        const source = (searchParams.get('source') || 'frontend') as LogSource;

        // Si es backend, hacer proxy a la API del backend
        if (source === 'backend') {
            const cookieStore = await cookies();
            const token = cookieStore.get('auth_token')?.value;
            
            const backendResponse = await fetch(`${API_BASE}/logs/info`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await backendResponse.json();
            
            if (!backendResponse.ok) {
                return NextResponse.json(data, { status: backendResponse.status });
            }

            return NextResponse.json(data);
        }

        // Si es frontend, leer archivos locales
        const logTypes: LogType[] = ["error", "output", "combined"];

        const filesInfo = await Promise.all(
            logTypes.map(async (logType) => {
                try {
                    const info = await getLogFileInfo(logType, FRONTEND_LOGS_PATH);
                    return {
                        type: logType,
                        path: info.filePath,
                        size: info.size,
                        lastModified: info.lastModified.toISOString(),
                        exists: info.size > 0,
                    };
                } catch (error) {
                    return {
                        type: logType,
                        path: path.join(FRONTEND_LOGS_PATH, `${logType}-<ID>.log`),
                        size: 0,
                        lastModified: new Date(0).toISOString(),
                        exists: false,
                    };
                }
            })
        );

        return NextResponse.json({
            success: true,
            data: {
                environment: process.env.NODE_ENV,
                logsAvailable: true,
                files: filesInfo,
            },
        });
    } catch (error: any) {
        console.error("Error al obtener información de logs:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Error al obtener información de logs",
            },
            { status: 500 }
        );
    }
}
