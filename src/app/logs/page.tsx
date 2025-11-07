"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    FiFileText,
    FiAlertCircle,
    FiCheckCircle,
    FiLoader,
    FiRefreshCw,
    FiTrash2,
    FiDownload,
    FiInfo,
    FiServer,
    FiMonitor,
} from "react-icons/fi";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    (typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:3010`
        : "");

type LogType = "error" | "output" | "combined";
type LogSource = "backend" | "frontend";

interface LogFileInfo {
    type: LogType;
    path: string;
    size: number;
    lastModified: string;
    exists: boolean;
}

interface LogData {
    logType: LogType;
    lines: string[];
    totalLines: number;
    fileInfo: {
        size: number;
        lastModified: string;
    };
}

export default function LogsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [logSource, setLogSource] = useState<LogSource>("backend");
    const [selectedLog, setSelectedLog] = useState<LogType>("error");
    const [logs, setLogs] = useState<string[]>([]);
    const [filesInfo, setFilesInfo] = useState<LogFileInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [maxLines, setMaxLines] = useState(100);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Verificar que sea admin
    useEffect(() => {
        // if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
        if (!authLoading && (!isAuthenticated)) {
            router.push("/");
        }
    }, [isAuthenticated, authLoading, user, router]);

    // Cargar información inicial
    useEffect(() => {
        // if (isAuthenticated && user?.role === "admin") {
        if (isAuthenticated) {
            fetchLogsInfo();
        }
    }, [isAuthenticated, user, logSource]);

    // Auto-refresh
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchLogs();
            }, 5000); // Cada 5 segundos

            return () => clearInterval(interval);
        }
    }, [autoRefresh, selectedLog, maxLines, logSource]);

    const fetchLogsInfo = async () => {
        try {
            setError(null);
            const response = await fetch(`${API_BASE}/logs/info`, {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Error al obtener información de logs");
            }

            const data = await response.json();
            if (data.success) {
                setFilesInfo(data.data.files);
            }
        } catch (err) {
            console.error("Error fetching logs info:", err);
            setError(err instanceof Error ? err.message : "Error al cargar información de logs");
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE}/logs/${selectedLog}?lines=${maxLines}`,
                {
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al cargar logs");
            }

            const data = await response.json();
            if (data.success) {
                setLogs(data.data.lines);
                setLastUpdate(new Date());
            }
        } catch (err) {
            console.error("Error fetching logs:", err);
            setError(err instanceof Error ? err.message : "Error al cargar logs");
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!confirm(`¿Estás seguro de que deseas limpiar el archivo ${selectedLog}.log?`)) {
            return;
        }

        try {
            setError(null);
            const response = await fetch(`${API_BASE}/logs/${selectedLog}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al limpiar logs");
            }

            setLogs([]);
            fetchLogsInfo();
            alert("Logs limpiados exitosamente");
        } catch (err) {
            console.error("Error clearing logs:", err);
            setError(err instanceof Error ? err.message : "Error al limpiar logs");
        }
    };

    const downloadLogs = () => {
        const content = logs.join("\n");
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedLog}-${new Date().toISOString()}.log`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const getLogTypeColor = (type: LogType) => {
        switch (type) {
            case "error":
                return "text-red-600 bg-red-50 border-red-200";
            case "output":
                return "text-blue-600 bg-blue-50 border-blue-200";
            case "combined":
                return "text-purple-600 bg-purple-50 border-purple-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const isErrorLine = (line: string): boolean => {
        return (
            line.toLowerCase().includes("error") ||
            line.toLowerCase().includes("exception") ||
            line.toLowerCase().includes("failed")
        );
    };

    const isWarningLine = (line: string): boolean => {
        return line.toLowerCase().includes("warn") || line.toLowerCase().includes("warning");
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-32">
                    <div className="flex items-center justify-center">
                        <FiLoader className="animate-spin text-blue-600" size={32} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pt-24 sm:pt-28 md:pt-32 pb-12 md:pb-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <FiFileText size={40} />
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                            Logs del Sistema
                        </h1>
                    </div>
                    <p className="text-base sm:text-lg text-slate-300">
                        Monitoreo y gestión de logs de aplicación
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                {/* Source Selector */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setLogSource("backend")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${logSource === "backend"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                <FiServer size={20} />
                                Backend Logs
                            </button>
                            <button
                                onClick={() => setLogSource("frontend")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${logSource === "frontend"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                <FiMonitor size={20} />
                                Frontend Logs
                            </button>
                        </div>

                        {lastUpdate && (
                            <div className="text-sm text-gray-600">
                                Última actualización: {lastUpdate.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Files Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {filesInfo.map((file) => (
                        <div
                            key={file.type}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedLog === file.type
                                ? `${getLogTypeColor(file.type)} border-2`
                                : "bg-white border-gray-200 hover:border-gray-300"
                                }`}
                            onClick={() => setSelectedLog(file.type)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold capitalize">{file.type}.log</h3>
                                {file.exists ? (
                                    <FiCheckCircle className="text-green-600" />
                                ) : (
                                    <FiAlertCircle className="text-gray-400" />
                                )}
                            </div>
                            <div className="text-sm space-y-1">
                                <p>Tamaño: {formatFileSize(file.size)}</p>
                                <p className="text-xs text-gray-600 truncate" title={file.path}>
                                    {file.path}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Líneas:</label>
                            <select
                                value={maxLines}
                                onChange={(e) => setMaxLines(parseInt(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                                <option value={500}>500</option>
                                <option value={1000}>1000</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="autoRefresh"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
                                Auto-refresh (5s)
                            </label>
                        </div>

                        <div className="flex gap-2 ml-auto">
                            <button
                                onClick={fetchLogs}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                                Actualizar
                            </button>

                            <button
                                onClick={downloadLogs}
                                disabled={logs.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                <FiDownload />
                                Descargar
                            </button>

                            <button
                                onClick={clearLogs}
                                disabled={logs.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                <FiTrash2 />
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                        <div className="flex items-center">
                            <FiAlertCircle className="text-red-500 mr-2" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Logs Display */}
                <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold flex items-center gap-2">
                                <FiFileText />
                                {selectedLog}.log
                            </h2>
                            <span className="text-gray-400 text-sm">
                                {logs.length} líneas
                            </span>
                        </div>
                    </div>

                    <div className="p-6 max-h-[600px] overflow-y-auto">
                        {loading && logs.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <FiLoader className="animate-spin text-blue-400 mr-3" size={24} />
                                <span className="text-gray-400">Cargando logs...</span>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <FiInfo size={48} className="mb-3" />
                                <p>No hay logs disponibles</p>
                                <button
                                    onClick={fetchLogs}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Cargar logs
                                </button>
                            </div>
                        ) : (
                            <pre className="font-mono text-sm space-y-1">
                                {logs.map((line, index) => (
                                    <div
                                        key={index}
                                        className={`py-1 px-3 rounded ${isErrorLine(line)
                                            ? "bg-red-900/30 text-red-300"
                                            : isWarningLine(line)
                                                ? "bg-yellow-900/30 text-yellow-300"
                                                : "text-gray-300 hover:bg-gray-800/50"
                                            }`}
                                    >
                                        <span className="text-gray-600 mr-3">{index + 1}</span>
                                        {line}
                                    </div>
                                ))}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
