"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Gamepad2, RefreshCw, Server } from "lucide-react";

type ServerStatus = {
  online: boolean;
  host?: string;
  port?: number;
  version?: { name_clean?: string; name?: string };
  players?: { online: number; max: number };
  motd?: { clean?: string };
};

const ADDRESS = "mc.nexvordev.ir";

export default function SmpServer() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/minecraft-status", { cache: "no-store" });
      if (!response.ok) throw new Error("Status unavailable");
      setStatus(await response.json());
    } catch {
      setStatus({ online: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const online = status?.online === true;

  return (
    <section className="hx-section hx-smp" id="smp">
      <div className="hx-wrap">
        <div className="hx-smp-card" data-reveal>
          <div className="hx-smp-glow" aria-hidden="true" />
          <div className="hx-smp-top">
            <div className="hx-smp-brand">
              <span className="hx-smp-icon"><Gamepad2 size={25} /></span>
              <div>
                <span className="hx-smp-kicker">NEXVORDEV NETWORK</span>
                <h2>Nexvor SMP</h2>
                <p>دنیای بقا، ماجراجویی و ساختن تجربه‌های تازه.</p>
              </div>
            </div>
            <div className={`hx-smp-status ${online ? "is-online" : "is-offline"}`}>
              <i />
              {loading ? "در حال بررسی" : online ? "آنلاین" : "آفلاین"}
            </div>
          </div>

          <div className="hx-smp-details">
            <div className="hx-smp-main">
              <span className="hx-smp-label">آدرس اتصال</span>
              <div className="hx-smp-address" dir="ltr">
                <strong>{ADDRESS}</strong>
                <button type="button" onClick={copyAddress} aria-label="کپی آدرس سرور">
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                  <span>{copied ? "کپی شد" : "کپی آدرس"}</span>
                </button>
              </div>
              <div className="hx-smp-tags">
                <span>Java Edition</span>
                <span>Survival</span>
                <span>1.21.4</span>
              </div>
            </div>

            <div className="hx-smp-stats">
              <div>
                <span className="hx-smp-label">بازیکنان آنلاین</span>
                <strong>{loading ? "—" : online ? `${status?.players?.online ?? 0} / ${status?.players?.max ?? 500}` : "۰ / ۵۰۰"}</strong>
              </div>
              <div>
                <span className="hx-smp-label">نسخه سرور</span>
                <strong>{status?.version?.name_clean || status?.version?.name || "1.21.4"}</strong>
              </div>
              <div>
                <span className="hx-smp-label">پورت</span>
                <strong>25565</strong>
              </div>
            </div>
          </div>

          {status?.motd?.clean && <p className="hx-smp-motd">{status.motd.clean}</p>}

          <div className="hx-smp-bottom">
            <span><Server size={15} /> وضعیت به‌صورت خودکار هر ۶۰ ثانیه به‌روزرسانی می‌شود.</span>
            <button type="button" onClick={refresh} disabled={loading}>
              <RefreshCw size={15} className={loading ? "is-spinning" : ""} />
              بروزرسانی
            </button>
          </div>
          <a className="hx-smp-join" href="https://mcstatus.io/status/java/mc.nexvordev.ir" target="_blank" rel="noreferrer">
            جزئیات وضعیت سرور <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
