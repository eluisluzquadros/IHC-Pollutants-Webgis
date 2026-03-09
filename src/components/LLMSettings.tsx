import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    CheckCircle,
    XCircle,
    Bot,
    Settings,
    RefreshCw,
    AlertCircle,
    Info
} from 'lucide-react';

interface LLMModel {
    id: string;
    name: string;
    default?: boolean;
}

interface LLMProvider {
    id: string;
    name: string;
    configured: boolean;
    models: LLMModel[];
    active: boolean;
}

interface LLMProvidersResponse {
    success: boolean;
    providers: LLMProvider[];
    activeProvider: string | null;
    activeModel: string | null;
}

interface LLMSettingsProps {
    onProviderChange?: (provider: string, model: string) => void;
}

const getApiBaseUrl = (): string => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    return '';
};

const API_BASE_URL = getApiBaseUrl();

export function LLMSettings({ onProviderChange }: LLMSettingsProps) {
    const [providers, setProviders] = useState<LLMProvider[]>([]);
    const [activeProvider, setActiveProvider] = useState<string | null>(null);
    const [activeModel, setActiveModel] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchProviders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/llm/providers`);
            const data: LLMProvidersResponse = await response.json();

            if (data.success) {
                setProviders(data.providers);
                setActiveProvider(data.activeProvider);
                setActiveModel(data.activeModel);
            }
        } catch (err) {
            setError('Failed to load LLM providers. Make sure the backend server is running.');
            console.error('Error fetching providers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleProviderSelect = async (providerId: string) => {
        const provider = providers.find(p => p.id === providerId);
        if (!provider?.configured) {
            setError(`${provider?.name} is not configured. Add the API key to your .env file.`);
            return;
        }

        const defaultModel = provider.models.find(m => m.default)?.id || provider.models[0]?.id;

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            const response = await fetch(`${API_BASE_URL}/api/llm/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerId, model: defaultModel })
            });

            const data = await response.json();

            if (data.success) {
                setActiveProvider(providerId);
                setActiveModel(data.model);
                setSuccessMessage(`Switched to ${provider.name}`);
                onProviderChange?.(providerId, data.model);

                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(data.error || 'Failed to switch provider');
            }
        } catch (err) {
            setError('Failed to switch provider. Please try again.');
            console.error('Error switching provider:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleModelSelect = async (modelId: string) => {
        if (!activeProvider) return;

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/api/llm/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: activeProvider, model: modelId })
            });

            const data = await response.json();

            if (data.success) {
                setActiveModel(modelId);
                onProviderChange?.(activeProvider, modelId);
                setSuccessMessage('Model updated');
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(data.error || 'Failed to switch model');
            }
        } catch (err) {
            setError('Failed to switch model. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const configuredCount = providers.filter(p => p.configured).length;
    const currentProvider = providers.find(p => p.id === activeProvider);

    if (loading) {
        return (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                    <span className="text-slate-300">Loading LLM providers...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-blue-400" />
                            <CardTitle className="text-white">AI Provider Settings</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchProviders}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <CardDescription className="text-slate-400">
                        Configure which AI provider and model to use for the assistant.
                        {configuredCount === 0 && (
                            <span className="text-yellow-400 ml-1">
                                No providers configured. Add API keys to .env file.
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Status Messages */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Active Provider</label>
                        <Select
                            value={activeProvider || ''}
                            onValueChange={handleProviderSelect}
                            disabled={saving || configuredCount === 0}
                        >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {providers.map(provider => (
                                    <SelectItem
                                        key={provider.id}
                                        value={provider.id}
                                        className="text-white hover:bg-slate-700 focus:bg-slate-700"
                                        disabled={!provider.configured}
                                    >
                                        <div className="flex items-center gap-2">
                                            {provider.configured ? (
                                                <CheckCircle className="h-4 w-4 text-green-400" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-slate-500" />
                                            )}
                                            <span>{provider.name}</span>
                                            {!provider.configured && (
                                                <span className="text-slate-500 text-xs">(not configured)</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Model Selection */}
                    {currentProvider && currentProvider.configured && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Model</label>
                            <Select
                                value={activeModel || ''}
                                onValueChange={handleModelSelect}
                                disabled={saving}
                            >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {currentProvider.models.map(model => (
                                        <SelectItem
                                            key={model.id}
                                            value={model.id}
                                            className="text-white hover:bg-slate-700 focus:bg-slate-700"
                                        >
                                            {model.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Provider Status Overview */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-slate-400" />
                        <CardTitle className="text-white text-base">Provider Status</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {providers.map(provider => (
                            <div
                                key={provider.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${provider.configured
                                        ? 'bg-green-900/20 border-green-700/50'
                                        : 'bg-slate-700/30 border-slate-600/50'
                                    }`}
                            >
                                <span className={`text-sm ${provider.configured ? 'text-green-300' : 'text-slate-400'}`}>
                                    {provider.name}
                                </span>
                                {provider.configured ? (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-slate-500" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Configuration Instructions */}
            <Card className="bg-blue-900/20 border-blue-700/50">
                <CardContent className="pt-4">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-200 space-y-2">
                            <p className="font-medium">How to configure API keys:</p>
                            <ol className="list-decimal list-inside space-y-1 text-blue-300">
                                <li>Create or edit the <code className="bg-blue-900/50 px-1 rounded">.env</code> file in the project root</li>
                                <li>Add your API key(s) following the format in <code className="bg-blue-900/50 px-1 rounded">.env.example</code></li>
                                <li>Restart the backend server</li>
                                <li>Refresh this page to see updated status</li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default LLMSettings;
