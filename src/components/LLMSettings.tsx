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
            <Card className="bg-foreground/[0.02] border-border/40">
                <CardContent className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-foreground/70 text-sm">Loading LLM providers...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <Card className="bg-foreground/[0.03] border-border/40 shadow-none rounded-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            <CardTitle className="text-foreground text-sm font-bold">AI Provider Settings</CardTitle>
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
                    <CardDescription className="text-foreground/40 text-[11px] leading-relaxed">
                        Configure which AI provider and model to use for the assistant.
                        {configuredCount === 0 && (
                            <span className="text-amber-500 ml-1">
                                No providers configured. Add API keys to .env file.
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Status Messages */}
                    {error && (
                        <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[11px]">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-[11px]">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Active Provider</label>
                        <Select
                            value={activeProvider || ''}
                            onValueChange={handleProviderSelect}
                            disabled={saving || configuredCount === 0}
                        >
                            <SelectTrigger className="bg-foreground/[0.03] border-border/30 text-foreground h-9 text-xs rounded-xl">
                                <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border/40 rounded-xl">
                                {providers.map(provider => (
                                    <SelectItem
                                        key={provider.id}
                                        value={provider.id}
                                        className="text-foreground hover:bg-foreground/5 cursor-pointer focus:bg-foreground/5 text-xs"
                                        disabled={!provider.configured}
                                    >
                                        <div className="flex items-center gap-2">
                                            {provider.configured ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-foreground/40" />
                                            )}
                                            <span>{provider.name}</span>
                                            {!provider.configured && (
                                                <span className="text-foreground/40 text-xs">(not configured)</span>
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
                            <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Model</label>
                            <Select
                                value={activeModel || ''}
                                onValueChange={handleModelSelect}
                                disabled={saving}
                            >
                                <SelectTrigger className="bg-foreground/[0.03] border-border/30 text-foreground h-9 text-xs rounded-xl">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border/40 rounded-xl">
                                    {currentProvider.models.map(model => (
                                        <SelectItem
                                            key={model.id}
                                            value={model.id}
                                            className="text-foreground hover:bg-foreground/5 cursor-pointer focus:bg-foreground/5 text-xs"
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
            <Card className="bg-foreground/[0.03] border-border/40 shadow-none rounded-xl">
                <CardHeader className="py-2.5">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <CardTitle className="text-foreground text-xs font-bold uppercase tracking-wider">Provider Status</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2">
                        {providers.map(provider => (
                            <div
                                key={provider.id}
                                className={`flex items-center justify-between p-2 rounded-xl border ${provider.configured
                                        ? 'bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400'
                                        : 'bg-foreground/[0.02] border-border/10 text-foreground/40'
                                    }`}
                            >
                                <span className="text-[10px] font-bold">
                                    {provider.name}
                                </span>
                                {provider.configured ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                    <XCircle className="h-3.5 w-3.5 text-foreground/20" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Configuration Instructions */}
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                <div className="flex gap-2">
                    <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] text-primary/80 space-y-1">
                        <p className="font-bold uppercase tracking-wider text-[9px]">How to configure API keys:</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-foreground/60 text-[10px]">
                            <li>Edit the <code className="bg-primary/10 px-1 rounded font-mono">.env</code> file in root</li>
                            <li>Add your API key(s) as per example</li>
                            <li>Restart backend server</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LLMSettings;
