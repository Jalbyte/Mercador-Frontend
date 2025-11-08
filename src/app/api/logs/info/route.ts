/**
 * API Route para obtener información de logs
 * Solo accesible para administradores
 * Lee archivos localmente del sistema de archivos
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const LOG_BASE_PATH = '/home/ec2-user/mercador/logs';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

type LogType = 'error' | 'output' | 'combined';

/**
 * Verifica si el usuario es admin llamando al backend
 */
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return { isAdmin: false };
        }

        // Verificar con el backend
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
async function findLogFile(logType: LogType): Promise<string> {
    try {
        const files = await fs.readdir(LOG_BASE_PATH);

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
            const filePath = path.join(LOG_BASE_PATH, file);
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
            throw new Error(`Directorio de logs no encontrado: ${LOG_BASE_PATH}`);
        }
        throw error;
    }
}

/**
 * Obtiene información de un archivo de log
 */
async function getLogFileInfo(logType: LogType): Promise<{ size: number; lastModified: Date; filePath: string; exists: boolean }> {
    try {
        const filePath = await findLogFile(logType);
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
            filePath: path.join(LOG_BASE_PATH, `${logType}-...log`),
            exists: false,
        };
    }
}

/**
 * GET /api/logs/info - Obtener información sobre los logs disponibles
 */
export async function GET(request: NextRequest) {
    try {
        // Verificar que sea admin
        const { isAdmin, userId } = await verifyAdmin(request);

        if (!isAdmin) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Acceso denegado - requiere rol de administrador',
                },
                { status: 403 }
            );
        }

        const logTypes: LogType[] = ['error', 'output', 'combined'];

        const filesInfo = await Promise.all(
            logTypes.map(async (logType) => {
                const info = await getLogFileInfo(logType);
                return {
                    type: logType,
                    path: info.filePath,
                    size: info.size,
                    lastModified: info.lastModified.toISOString(),
                    exists: info.exists,
                };
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
        console.error('Error al obtener información de logs:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al obtener información de logs',
            },
            { status: 500 }
        );
    }
}
