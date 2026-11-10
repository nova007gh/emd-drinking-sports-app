"use client";

import { useState } from "react";

export function StaffAvatar({ name, avatarUrl, size = 22, className = "" }: { name: string; avatarUrl?: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`staff-avatar ${className}`} style={{ width: size, height: size, minWidth: size, minHeight: size }}>
      {!failed && avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <span className="staff-avatar-placeholder">{name[0]}</span>
      )}
    </div>
  );
}
