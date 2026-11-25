"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Gamepad2, Users, Wifi, WifiOff } from "lucide-react";
import styles from "./smp-status.module.css";

type ServerStatus = {
  online?: boolean;
  version?: { name_clean?: string; name?: string };
  players?: { online?: number; max?: number };
};

const address = "mc.nexvordev.ir";
const statusUrl = "/api/minecraft-status";

export default function SmpStatus() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(statusUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("Status request failed");
      setStatus((await response.json()) as ServerStatus);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const online = status?.online === true;
  const offline = status?.online === false;
  const version = status?.version?.name_clean || status?.version?.name || "—";
  const players = status?.players;

  return (
    <section className={styles.section} id="smp">
      <div className={styles.wrap}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}><Gamepad2 size={15} /> NEXVORDEV NETWORK</span>
          <h2>ماجراجویی از اینجا شروع می‌شه.</h2>
          <p>به دنیای SMP نکسور بپیوند؛ وضعیت سرور و اطلاعات اتصال رو همین‌جا ببین.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.serverIdentity}>
              <span className={styles.serverIcon}><Gamepad2 size={25} /></span>
              <div><span className={styles.serverLabel}>SURVIVAL MULTIPLAYER</span><h3>NexvorDEV SMP</h3></div>
            </div>
            <div className={styles.status}>
              <span className={styles.dot + " " + (online ? styles.online : offline ? styles.offline : "")} />
              {loading ? "در حال بررسی" : online ? "آنلاین" : offline ? "آفلاین" : "وضعیت نامشخص"}
            </div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><span>بازیکنان آنلاین</span><strong>{players ? (players.online ?? 0) + " / " + (players.max ?? "—") : "—"}</strong><small><Users size={13} /> بازیکن</small></div>
            <div className={styles.stat}><span>نسخه سرور</span><strong className={styles.version}>{version}</strong><small><Gamepad2 size={13} /> Java Edition</small></div>
            <div className={styles.stat}><span>وضعیت اتصال</span><strong>{online ? "فعال" : offline ? "قطع" : "—"}</strong><small>{online ? <Wifi size={13} /> : <WifiOff size={13} />} اتصال سرور</small></div>
          </div>
          <div className={styles.connection}>
            <div><span className={styles.connectionLabel}>آدرس ورود به سرور</span><strong dir="ltr">{address}</strong><small>Port: 25565</small></div>
            <button type="button" onClick={copyAddress} className={styles.copyButton}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "کپی شد" : "کپی آدرس"}</button>
          </div>
          <div className={styles.cardBottom}>
            <span>اطلاعات وضعیت هر ۶۰ ثانیه به‌روزرسانی می‌شود.</span>
            <a href="https://mcstatus.io/status/java/mc.nexvordev.ir" target="_blank" rel="noreferrer">جزئیات بیشتر <ExternalLink size={14} /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
