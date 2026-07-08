import React, { useEffect, useState } from "react";
import { Terminal, RefreshCw, Trash2, Send, ChevronDown, ChevronRight, Check } from "lucide-react";
import { triggerWebhook } from "../lib/dbService";

export default function WebhookTerminal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 4000); // Poll every 4s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleTestTrigger = async () => {
    const mockPayload = {
      userEmail: "demo@ticoolture.vn",
      interactionType: "manual_test_simulation",
      targetId: "manual_tester_01",
      targetName: "Manual Webhook Verification",
      platform: "Brutalist Web Terminal",
      additionalMeta: {
        browser: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        localTime: new Date().toLocaleTimeString()
      }
    };

    await triggerWebhook("MANUAL_TEST_TRIGGER", mockPayload);
    fetchLogs();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-mono text-xs">
      {/* Overlay click to close */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Slide-out Terminal Panel */}
      <div className="w-full max-w-2xl bg-black text-white flex flex-col border-l-4 border-black h-full shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-neutral-900 border-b-2 border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Terminal className="w-5 h-5 text-neutral-400" />
            <span className="font-bold tracking-wider uppercase text-sm">WEBHOOK RECEIVER & SIMULATOR</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestTrigger}
              className="px-2 py-1 bg-white text-black hover:bg-neutral-300 transition-all font-bold text-[10px] uppercase flex items-center space-x-1"
              title="Manually simulate a webhook trigger payload"
            >
              <Send className="w-3 h-3" />
              <span>TEST PAYLOAD</span>
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
              title="Refresh webhook logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 bg-red-600 text-white hover:bg-red-700 font-bold text-[10px] uppercase border border-red-800"
            >
              ESC [X]
            </button>
          </div>
        </div>

        {/* Console Logs Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          <div className="p-3 bg-neutral-950 border border-neutral-800 text-neutral-400 space-y-1 mb-2">
            <p className="text-white font-bold">// REAL-TIME WEBHOOK LOGGER</p>
            <p className="text-[11px]">Triggers occur on clicking "ORDER NOW" or Store/Product social links.</p>
            <p className="text-[11px]">All event telemetry is captured and forwarded to <code className="text-white bg-neutral-800 px-1 py-[2px]">/api/webhooks/logs</code>.</p>
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 space-y-2">
              <p className="animate-pulse">_ Awaiting inbound payload telemetry...</p>
              <button 
                onClick={handleTestTrigger} 
                className="text-xs text-white underline hover:text-neutral-300"
              >
                Click here to dispatch first mock event
              </button>
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLog === log.id;
              const jsonString = JSON.stringify(log.payload, null, 2);
              return (
                <div 
                  key={log.id} 
                  className="border border-neutral-800 bg-neutral-950 flex flex-col transition-colors hover:border-neutral-600"
                >
                  {/* Log line heading */}
                  <div 
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    className="flex items-center justify-between p-2 cursor-pointer select-none text-neutral-300 hover:bg-neutral-900"
                  >
                    <div className="flex items-center space-x-2">
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-white" /> : <ChevronRight className="w-3 h-3 text-neutral-500" />}
                      <span className="font-bold text-white uppercase text-[10px] tracking-wider px-1 bg-neutral-800 border border-neutral-700">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        {log.payload.targetName || log.payload.platform || "Event"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-[9px] bg-neutral-900 text-neutral-400 px-1 border border-neutral-800">ID: {log.id}</span>
                    </div>
                  </div>

                  {/* Log body JSON */}
                  {isExpanded && (
                    <div className="border-t border-neutral-900 p-3 bg-neutral-950 text-emerald-400 overflow-x-auto relative">
                      <button
                        onClick={() => handleCopy(jsonString, log.id)}
                        className="absolute top-2 right-2 px-2 py-1 bg-neutral-800 text-white hover:bg-neutral-700 text-[10px] border border-neutral-700 flex items-center space-x-1"
                      >
                        {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                        <span>{copiedId === log.id ? "COPIED" : "COPY RAW JSON"}</span>
                      </button>
                      <pre className="text-[11px] font-mono leading-relaxed">{jsonString}</pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Terminal Footer */}
        <div className="bg-neutral-900 border-t-2 border-neutral-800 p-3 flex justify-between items-center text-[10px] text-neutral-500">
          <span>PORT: 3000 // EXPRESS ACTIVE</span>
          <span className="animate-pulse flex items-center space-x-1 text-emerald-500">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
            <span>LISTENING FOR TRAFFIC</span>
          </span>
        </div>
      </div>
    </div>
  );
}
