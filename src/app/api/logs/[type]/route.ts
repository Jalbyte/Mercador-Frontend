/**
 * API Route para obtener el contenido de un log específico
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
 * Lee un archivo de log y retorna las últimas N líneas
 */
async function readLogFile(logType: LogType, lines: number = 100): Promise<string[]> {
    const filePath = await findLogFile(logType);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const allLines = content.split('\n').filter(line => line.trim() !== '');

        // Retornar las últimas N líneas
        return allLines.slice(-lines);
    } catch (error: any) {
        throw new Error(`Error al leer archivo ${path.basename(filePath)}: ${error.message}`);
    }
}

/**
 * GET /api/logs/[type] - Obtener contenido de un log específico
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
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

        const { type } = await params;
        const { searchParams } = new URL(request.url);
        const linesParam = searchParams.get('lines') || '100';
        const lines = Math.min(parseInt(linesParam, 10), 1000);

        // Validar tipo de log
        if (!['error', 'output', 'combined'].includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Tipo de log inválido',
                },
                { status: 400 }
            );
        }

        // Leer el archivo de log
        const logLines = await readLogFile(type as LogType, lines);
        const filePath = await findLogFile(type as LogType);
        const stats = await fs.stat(filePath);

        return NextResponse.json({
            success: true,
            data: {
                logType: type,
                lines: logLines,
                totalLines: logLines.length,
                fileInfo: {
                    size: stats.size,
                    lastModified: stats.mtime.toISOString(),
                    path: filePath,
                },
            },
        });
    } catch (error: any) {
        console.error('Error al leer archivo de log:', error);

        const statusCode = error.message?.includes('no encontrados') || error.message?.includes('no pudo determinar') ? 404 : 500;

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al leer archivo de log',
            },
            { status: statusCode }
        );
    }
}

/**
 * DELETE /api/logs/[type] - Limpiar un archivo de log
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
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

        const { type } = await params;

        // Validar tipo de log
        if (!['error', 'output', 'combined'].includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Tipo de log inválido',
                },
                { status: 400 }
            );
        }

        // Encontrar y limpiar el archivo
        const filePath = await findLogFile(type as LogType);
        await fs.writeFile(filePath, '', 'utf-8');

        return NextResponse.json({
            success: true,
            message: `Archivo de log ${path.basename(filePath)} limpiado exitosamente`,
        });
    } catch (error: any) {
        console.error('Error al limpiar archivo de log:', error);

        const statusCode = error.message?.includes('no encontrados') ? 404 : 500;

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al limpiar archivo de log',
            },
            { status: statusCode }
        );
    }
}
