import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./status-message.module.css";

type StatusMessageProps = {
  variant: "info" | "empty" | "error";
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export const StatusMessage = ({
  variant,
  icon: Icon,
  title,
  children,
  action,
}: StatusMessageProps) => (
  <div
    className={`${styles.message} ${styles[variant]}`}
    role={variant === "error" ? "alert" : "status"}
  >
    <span className={styles.icon}>
      <Icon size={22} aria-hidden="true" />
    </span>
    <p className={styles.title}>{title}</p>
    {children !== undefined && <p className={styles.detail}>{children}</p>}
    {action}
  </div>
);
