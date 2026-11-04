import type { ReactNode } from "react";
import styles from "./status-message.module.css";

type StatusMessageProps = {
  variant: "info" | "empty" | "error";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export const StatusMessage = ({
  variant,
  title,
  children,
  action,
}: StatusMessageProps) => (
  <div
    className={`${styles.message} ${styles[variant]}`}
    role={variant === "error" ? "alert" : "status"}
  >
    <p className={styles.title}>{title}</p>
    {children !== undefined && <p className={styles.detail}>{children}</p>}
    {action}
  </div>
);
