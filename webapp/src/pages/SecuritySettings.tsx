import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { walletApi } from '../api';

export const SecuritySettings = () => {
    const navigate = useNavigate();
    const [hasPin, setHasPin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    // PIN Flow State
    const [mode, setMode] = useState<'VIEW' | 'CREATE' | 'VERIFY_OLD'>('VIEW');
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await walletApi.getUserMe();
            setHasPin(res.data.hasPin);
        } catch (err) {
            console.error('Failed to fetch security status', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = async () => {
        setError('');

        if (pinInput.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        try {
            if (mode === 'CREATE') {
                setLoading(true);
                await walletApi.setPin(pinInput);
                setHasPin(true);
                setMode('VIEW');
                setSuccessMsg('PIN set successfully!');
                setTimeout(() => setSuccessMsg(''), 3000);
            } else if (mode === 'VERIFY_OLD') {
                const res = await walletApi.verifyPin(pinInput);
                if (res.data.isValid) {
                    // Old PIN OK, now set new one
                    setMode('CREATE');
                    setPinInput(''); // Clear for new PIN
                } else {
                    setError('Incorrect existing PIN');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const startChangePin = () => {
        setPinInput('');
        setError('');
        setMode('VERIFY_OLD');
    };

    const startSetPin = () => {
        setPinInput('');
        setError('');
        setMode('CREATE');
    };

    if (loading && !hasPin && mode === 'VIEW') return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0F172A] pb-24 text-white">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-20 border-b border-slate-800">
                <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Security</h1>
            </div>

            <div className="p-4 space-y-6">

                {/* PIN Management Card */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-slate-700/50 rounded-full">
                            <Lock className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="font-semibold text-lg">Transaction PIN</h2>
                    </div>

                    {mode === 'VIEW' ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                <span className="text-slate-300">Status</span>
                                {hasPin ? (
                                    <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                                        <CheckCircle className="w-4 h-4" /> Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-400 text-sm font-medium">
                                        <AlertCircle className="w-4 h-4" /> Not Set
                                    </span>
                                )}
                            </div>

                            {successMsg && (
                                <div className="p-3 bg-green-500/10 text-green-400 rounded-lg text-sm text-center">
                                    {successMsg}
                                </div>
                            )}

                            {hasPin ? (
                                <button
                                    onClick={startChangePin}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium"
                                >
                                    <RefreshCw className="w-4 h-4" /> Change PIN
                                </button>
                            ) : (
                                <button
                                    onClick={startSetPin}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-semibold shadow-lg shadow-blue-900/20"
                                >
                                    Set New PIN
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-slate-400 text-sm">
                                {mode === 'CREATE'
                                    ? (hasPin ? 'Enter your new PIN' : 'Create a 4-digit PIN for transactions')
                                    : 'Enter current PIN to continue'
                                }
                            </p>

                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-center text-3xl tracking-[1em] font-mono focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="••••"
                            />

                            {error && (
                                <p className="text-red-400 text-sm text-center animate-pulse">{error}</p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setMode('VIEW'); setError(''); }}
                                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePinSubmit}
                                    disabled={!pinInput || loading}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold"
                                >
                                    {loading ? 'Processing...' : (mode === 'CREATE' ? 'Save PIN' : 'Verify')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
